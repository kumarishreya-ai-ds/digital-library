import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbStore, type StudentRecord } from "./server-store.ts";
import { type SlotType } from "./library.ts";

export type PublicSettings = {
  upiId: string | null;
  receiverName: string | null;
  halfDayPrice: number | null;
  fullDayPrice: number | null;
  qrImageUrl: string | null;
  address: string | null;
  timings: string | null;
  ownerName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

export type EntrySummary = {
  entryCode: string;
  fullName: string;
  mobileMasked: string;
  entryType: "half_day" | "full_day";
  entryDate: string;
  entryTime: string;
  amount: number | null;
  entryStatus: "pending" | "confirmed" | "rejected";
  paymentStatus: "pending" | "verified" | "rejected" | null;
  utr: string | null;
  adminNote: string | null;
};

const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "10 अंकों का सही मोबाइल नंबर डालें");

const slotSchema = z.enum(["morning_half", "second_half", "full_time"]);

function maskMobile(mobile: string) {
  return `${mobile.slice(0, 2)}XXXXX${mobile.slice(-3)}`;
}

// 1. GET PUBLIC SETTINGS
export const getPublicSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSettings> => {
    const s = dbStore.getSettings();
    return {
      upiId: s.upiId,
      receiverName: s.receiverName,
      halfDayPrice: s.halfDayPrice,
      fullDayPrice: s.fullDayPrice,
      qrImageUrl: s.qrImageUrl,
      address: s.address,
      timings: s.timings,
      ownerName: s.ownerName,
      contactPhone: s.contactPhone,
      contactEmail: s.contactEmail,
    };
  },
);

// 2. SEAT AVAILABILITY (20 Seats, Slot collision engine)
export const getSeatAvailabilityFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "सही तारीख चुनें"),
        slot: slotSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return dbStore.getSeatAvailability(data.date, data.slot);
  });

// 3. STUDENT ADMISSION
const admissionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "पूरा नाम लिखें (कम से कम 3 अक्षर)")
    .max(80, "नाम बहुत लंबा है"),
  parentName: z.string().trim().max(80).optional().nullable(),
  mobile: mobileSchema,
  email: z.string().trim().email("सही ईमेल आईडी डालें"),
  address: z.string().trim().min(5, "पूरा पता लिखें"),
  examGoal: z.string().trim().max(100).optional().nullable(),
  termsAccepted: z.boolean().optional(),
  selectedPlan: slotSchema,
  assignedSeatNumber: z.string().regex(/^Seat \d{2}$/, "सीट चुनें (जैसे Seat 01)"),
  photoUrl: z.string().optional().nullable(),
  signatureUrl: z.string().optional().nullable(),
  idProofUrl: z.string().optional().nullable(),
  admissionDate: z.string().optional(),
});

export const createAdmissionFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => admissionSchema.parse(input))
  .handler(async ({ data }): Promise<StudentRecord> => {
    return dbStore.createAdmission({
      fullName: data.fullName,
      parentName: data.parentName,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      examGoal: data.examGoal,
      termsAccepted: data.termsAccepted,
      selectedPlan: data.selectedPlan,
      assignedSeatNumber: data.assignedSeatNumber,
      photoUrl: data.photoUrl,
      signatureUrl: data.signatureUrl,
      idProofUrl: data.idProofUrl,
      admissionDate: data.admissionDate,
    });
  });

// 4. STUDENT PORTAL PROFILE LOOKUP
export const getStudentProfileFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        studentIdCode: z.string().trim().optional(),
        mobile: z.string().trim().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const student = dbStore.getStudent(data);
    if (!student) return null;
    if (student.isDeactivated) {
      throw new Error("यह छात्र खाता निष्क्रिय (Deactivated) कर दिया गया है। सहायता हेतु लाइब्रेरी व्यवस्थापक से संपर्क करें।");
    }

    const payments = dbStore.getAllPayments({ search: student.studentIdCode });
    const attendance = dbStore.getAttendanceHistory({ studentIdCode: student.studentIdCode });
    const today = new Date().toISOString().slice(0, 10);
    const todayAttendance = attendance.find((a) => a.attendanceDate === today) || null;

    const expiryDate = new Date(student.membershipEndDate);
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const isExpired = expiryDate.getTime() < now.getTime();

    return {
      student,
      payments,
      attendance,
      todayAttendance,
      daysRemaining,
      isExpired,
      membershipStatus: isExpired
        ? "expired"
        : student.admissionStatus === "approved"
          ? "active"
          : "pending",
    };
  });

// 5. ATTENDANCE PUNCH IN / OUT
export const checkInAttendanceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ studentIdCode: z.string().trim().toUpperCase() }).parse(input),
  )
  .handler(async ({ data }) => {
    return dbStore.checkInAttendance({ studentIdCode: data.studentIdCode });
  });

export const checkOutAttendanceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ studentIdCode: z.string().trim().toUpperCase() }).parse(input),
  )
  .handler(async ({ data }) => {
    return dbStore.checkOutAttendance({ studentIdCode: data.studentIdCode });
  });

// 6. MEMBERSHIP RENEWAL REQUEST
export const requestRenewalFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        studentIdCode: z.string().trim().toUpperCase(),
        requestedPlan: slotSchema,
        utr: z.string().trim().optional(),
        screenshotUrl: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return dbStore.requestRenewal(data);
  });

// 7. PAYMENT SUBMISSION (For Admission or Booking)
export const submitPaymentNewFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        studentIdCode: z.string().trim().toUpperCase(),
        utr: z
          .string()
          .trim()
          .min(6, "UTR / Transaction ID कम से कम 6 अक्षरों का होना चाहिए")
          .max(40, "UTR बहुत लंबा है"),
        screenshotUrl: z.string().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return dbStore.submitPayment({
      studentIdCode: data.studentIdCode,
      utr: data.utr,
      screenshotUrl: data.screenshotUrl,
    });
  });

// --- ADMIN SERVER FUNCTIONS (STRICT ROLE-BASED AUTHORIZATION) ---
export const getAdminSetupStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  return {
    isSetupNeeded: dbStore.isInitialAdminSetupNeeded(),
  };
});

export const setupInitialAdminFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email("मान्य ईमेल आईडी दर्ज करें"),
        fullName: z.string().trim().min(2, "पूरा नाम लिखें"),
        password: z
          .string()
          .min(8, "पासवर्ड में कम से कम 8 अक्षर होना अनिवार्य है")
          .regex(/[A-Za-z]/, "पासवर्ड में कम से कम एक अक्षर होना चाहिए")
          .regex(/\d/, "पासवर्ड में कम से कम एक संख्या (digit) होना चाहिए"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return dbStore.setupInitialAdmin(data);
  });

export const loginAdminFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        email: z.string().trim().email("मान्य ईमेल आईडी दर्ज करें"),
        password: z.string().min(1, "पासवर्ड दर्ज करें"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    return dbStore.loginAdmin(data);
  });

export const logoutAdminFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ adminToken: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    return { success: dbStore.logoutAdmin(data.adminToken) };
  });

export const verifyAdminTokenFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ adminToken: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return {
      valid: true,
      admin: {
        email: session.adminEmail,
        fullName: session.fullName,
        role: session.adminRole,
      },
    };
  });

export const getAdminOverviewFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ adminToken: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);

    const allStudents = dbStore.getAllStudents({ includeDeactivated: true });
    const payments = dbStore.getAllPayments();
    const today = new Date().toISOString().slice(0, 10);
    const todayAttendance = dbStore.getAttendanceHistory({ date: today });
    const pendingRenewals = dbStore.getAllRenewals().filter((r) => r.status === "pending");

    const nonDeactivated = allStudents.filter((s) => !s.isDeactivated);
    const totalStudents = nonDeactivated.length;
    const deactivatedStudents = allStudents.filter((s) => s.isDeactivated).length;

    const pendingAdmissions = nonDeactivated.filter((s) => s.admissionStatus === "pending").length;
    const approvedStudents = nonDeactivated.filter((s) => s.admissionStatus === "approved");

    const now = Date.now();
    const activeMemberships = approvedStudents.filter(
      (s) => new Date(s.membershipEndDate).getTime() >= now && s.membershipStatus !== "suspended",
    ).length;
    const expiredMemberships = approvedStudents.filter(
      (s) => new Date(s.membershipEndDate).getTime() < now,
    ).length;
    const suspendedMemberships = nonDeactivated.filter((s) => s.membershipStatus === "suspended").length;

    const todayPresent = todayAttendance.length;
    const currentlyInside = todayAttendance.filter((a) => a.checkOutAt === null).length;

    const pendingPayments = payments.filter((p) => p.status === "pending").length;
    const verifiedPayments = payments.filter((p) => p.status === "verified");
    const rejectedPayments = payments.filter((p) => p.status === "rejected").length;

    // Monthly verified collection (current calendar month)
    const currentMonthPrefix = today.slice(0, 7); // YYYY-MM
    const monthlyRevenue = verifiedPayments
      .filter((p) => (p.verifiedAt || p.createdAt).startsWith(currentMonthPrefix))
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalRevenue = verifiedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Physical seats utilization (Total 20 seats)
    const morningOccupied = approvedStudents.filter(
      (s) => (s.selectedPlan === "morning_half" || s.selectedPlan === "full_time") && s.membershipStatus !== "suspended",
    ).length;
    const secondOccupied = approvedStudents.filter(
      (s) => (s.selectedPlan === "second_half" || s.selectedPlan === "full_time") && s.membershipStatus !== "suspended",
    ).length;
    const fullTimeOccupied = approvedStudents.filter(
      (s) => s.selectedPlan === "full_time" && s.membershipStatus !== "suspended",
    ).length;

    const peakOccupied = Math.max(morningOccupied, secondOccupied);
    const availableSeats = Math.max(0, 20 - peakOccupied);

    return {
      totalStudents,
      deactivatedStudents,
      pendingAdmissions,
      activeMemberships,
      expiredMemberships,
      suspendedMemberships,
      todayPresent,
      currentlyInside,
      pendingPayments,
      verifiedPayments: verifiedPayments.length,
      rejectedPayments,
      monthlyRevenue,
      totalRevenue,
      totalSeats: 20,
      availableSeats,
      morningOccupied,
      secondOccupied,
      fullTimeOccupied,
      pendingRenewalsCount: pendingRenewals.length,
    };
  });

export const getAdminStudentsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        search: z.string().optional(),
        status: z.string().optional(),
        membershipStatus: z.string().optional(),
        includeDeactivated: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);
    return dbStore.getAllStudents({
      search: data.search,
      status: data.status,
      membershipStatus: data.membershipStatus,
      includeDeactivated: data.includeDeactivated,
    });
  });

export const updateStudentDetailsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim(),
        fullName: z.string().trim().min(2).optional(),
        parentName: z.string().trim().nullable().optional(),
        mobile: mobileSchema.optional(),
        email: z.string().trim().email().optional(),
        address: z.string().trim().min(3).optional(),
        examGoal: z.string().trim().nullable().optional(),
        assignedSeatNumber: z.string().regex(/^Seat \d{2}$/).optional(),
        selectedPlan: slotSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    const { adminToken, ...payload } = data;
    return dbStore.updateStudentDetails({
      ...payload,
      adminEmail: session.adminEmail,
    });
  });

export const suspendStudentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim(),
        reason: z.string().min(3, "निलंबन का कारण लिखें"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.suspendStudent({
      studentIdCode: data.studentIdCode,
      reason: data.reason,
      adminEmail: session.adminEmail,
    });
  });

export const reactivateStudentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.reactivateStudent({
      studentIdCode: data.studentIdCode,
      adminEmail: session.adminEmail,
    });
  });

export const deactivateStudentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim(),
        reason: z.string().min(5, "रिकॉर्ड निष्क्रिय करने का कारण लिखें (कम से कम 5 अक्षर)"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.deactivateStudent({
      studentIdCode: data.studentIdCode,
      reason: data.reason,
      adminEmail: session.adminEmail,
    });
  });

export const deleteStudentPermanentlyFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim().toUpperCase(),
        confirmationCode: z.string().trim(),
        reason: z.string().trim().min(5, "हटाने का कारण कम से कम 5 अक्षर होना चाहिए"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.permanentlyDeleteStudent({
      studentIdCode: data.studentIdCode,
      confirmationCode: data.confirmationCode,
      reason: data.reason,
      adminEmail: session.adminEmail,
    });
  });

export const updateAdmissionStatusFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim(),
        status: z.enum(["approved", "rejected"]),
        rejectionReason: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.updateAdmissionStatus({
      studentIdCode: data.studentIdCode,
      status: data.status,
      rejectionReason: data.rejectionReason,
      adminEmail: session.adminEmail,
    });
  });

export const reassignSeatFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim(),
        newSeatNumber: z.string().regex(/^Seat \d{2}$/, "सही सीट चुनें"),
        reason: z.string().min(3, "सीट बदलने का कारण लिखें"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.reassignSeatBooking({
      studentIdCode: data.studentIdCode,
      newSeatNumber: data.newSeatNumber,
      reason: data.reason,
      adminEmail: session.adminEmail,
    });
  });

export const cancelBookingFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        bookingCode: z.string().trim(),
        reason: z.string().min(3, "रद्द करने का कारण लिखें"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.cancelSeatBooking({
      bookingCode: data.bookingCode,
      reason: data.reason,
      adminEmail: session.adminEmail,
    });
  });

export const getAdminPaymentsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        status: z.string().optional(),
        search: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);
    return dbStore.getAllPayments({
      status: data.status,
      search: data.search,
    });
  });

export const verifyPaymentFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        paymentId: z.string(),
        status: z.enum(["verified", "rejected"]),
        adminNote: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.verifyPayment({
      paymentId: data.paymentId,
      status: data.status,
      adminNote: data.adminNote,
      adminEmail: session.adminEmail,
    });
  });

export const getAdminAttendanceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        date: z.string().optional(),
        studentIdCode: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);
    return dbStore.getAttendanceHistory({
      date: data.date,
      studentIdCode: data.studentIdCode,
    });
  });

export const correctAttendanceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        studentIdCode: z.string().trim(),
        attendanceDate: z.string(),
        checkInAt: z.string(),
        checkOutAt: z.string().nullable().optional(),
        status: z.enum(["present", "incomplete", "absent"]),
        reason: z.string().min(5, "सुधार का कारण लिखना अनिवार्य है (कम से कम 5 अक्षर)"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.adminCorrectAttendance({
      studentIdCode: data.studentIdCode,
      attendanceDate: data.attendanceDate,
      checkInAt: data.checkInAt,
      checkOutAt: data.checkOutAt,
      status: data.status,
      reason: data.reason,
      adminEmail: session.adminEmail,
    });
  });

export const getAdminRenewalsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ adminToken: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);
    return dbStore.getAllRenewals();
  });

export const approveRenewalFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        renewalId: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    return dbStore.approveRenewal({
      renewalId: data.renewalId,
      adminEmail: session.adminEmail,
    });
  });

export const getAdminAuditLogsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ adminToken: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);
    return dbStore.getAuditLogs();
  });

export const getAdminBookingsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ adminToken: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);
    return dbStore.getAllBookings();
  });

export const getAdminSettingsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ adminToken: z.string() }).parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);
    return dbStore.getSettings();
  });

export const updateAdminSettingsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        upiId: z.string().optional(),
        receiverName: z.string().optional(),
        halfDayPrice: z.number().optional(),
        fullDayPrice: z.number().optional(),
        address: z.string().optional(),
        timings: z.string().optional(),
        ownerName: z.string().optional(),
        contactPhone: z.string().optional(),
        contactEmail: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const session = dbStore.verifyAdminSession(data.adminToken);
    const { adminToken, ...updates } = data;
    return dbStore.updateSettings(updates, session.adminEmail);
  });

export const exportAdminDataFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        adminToken: z.string(),
        type: z.enum(["students", "payments", "attendance", "bookings"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    dbStore.verifyAdminSession(data.adminToken);

    if (data.type === "students") {
      const students = dbStore.getAllStudents({ includeDeactivated: true });
      const headers = "Student_ID,Full_Name,Parent_Name,Mobile,Email,Exam_Goal,Plan,Seat,Admission_Status,Membership_Status,Start_Date,End_Date,Deactivated\n";
      const rows = students
        .map(
          (s) =>
            `"${s.studentIdCode}","${s.fullName}","${s.parentName || ""}","${s.mobile}","${s.email}","${s.examGoal || ""}","${s.selectedPlan}","${s.assignedSeatNumber}","${s.admissionStatus}","${s.membershipStatus || "active"}","${s.membershipStartDate}","${s.membershipEndDate}","${s.isDeactivated ? "YES" : "NO"}"`,
        )
        .join("\n");
      return { filename: "sgdl_students.csv", content: headers + rows };
    }

    if (data.type === "payments") {
      const payments = dbStore.getAllPayments();
      const headers = "Payment_ID,Student_ID,Name,Mobile,Plan,Amount,UTR,Status,Date,Verified_By,Admin_Note\n";
      const rows = payments
        .map(
          (p) =>
            `"${p.id}","${p.studentIdCode}","${p.studentName}","${p.studentMobile}","${p.plan}",${p.amount},"${p.utr || ""}","${p.status}","${p.createdAt}","${p.verifiedBy || ""}","${p.adminNote || ""}"`,
        )
        .join("\n");
      return { filename: "sgdl_payments.csv", content: headers + rows };
    }

    if (data.type === "attendance") {
      const logs = dbStore.getAttendanceHistory();
      const headers = "Attendance_ID,Date,Student_ID,Name,Seat,Check_In,Check_Out,Status,Is_Correction,Reason,Corrected_By\n";
      const rows = logs
        .map(
          (a) =>
            `"${a.id}","${a.attendanceDate}","${a.studentIdCode}","${a.studentName}","${a.assignedSeat}","${a.checkInAt}","${a.checkOutAt || ""}","${a.status}","${a.isManualCorrection ? "YES" : "NO"}","${a.correctionReason || ""}","${a.correctedBy || ""}"`,
        )
        .join("\n");
      return { filename: "sgdl_attendance.csv", content: headers + rows };
    }

    // Bookings
    const state = dbStore.getAllSeats();
    const students = dbStore.getAllStudents({ includeDeactivated: false });
    const headers = "Seat_Number,Seat_Label,Status,Allocated_Student,Slot\n";
    const rows = state
      .map((seat) => {
        const student = students.find((s) => s.assignedSeatNumber === seat.number);
        return `"${seat.number}","${seat.label}","${student ? "Occupied" : "Available"}","${student ? student.fullName : ""}","${student ? student.selectedPlan : ""}"`;
      })
      .join("\n");
    return { filename: "sgdl_bookings.csv", content: headers + rows };
  });

// --- LEGACY HELPERS PRESERVED FOR BACKWARD COMPATIBILITY ---
const entrySchema = z.object({
  fullName: z.string().trim().min(3).max(80),
  mobile: mobileSchema,
  entryType: z.enum(["half_day", "full_day"]),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const createEntry = createServerFn({ method: "POST" })
  .validator((input: unknown) => entrySchema.parse(input))
  .handler(async ({ data }): Promise<EntrySummary> => {
    const slot: SlotType = data.entryType === "half_day" ? "morning_half" : "full_time";
    const availableSeats = dbStore.getSeatAvailability(data.entryDate, slot);
    const freeSeat = availableSeats.find((s) => s.isAvailable)?.number || "Seat 01";

    const student = dbStore.createAdmission({
      fullName: data.fullName,
      mobile: data.mobile,
      email: `${data.mobile}@student.sgdl.local`,
      address: "Khudra, Siwan",
      selectedPlan: slot,
      assignedSeatNumber: freeSeat,
      admissionDate: data.entryDate,
    });

    const price = slot === "morning_half" ? 400 : 700;

    return {
      entryCode: student.studentIdCode,
      fullName: data.fullName,
      mobileMasked: maskMobile(data.mobile),
      entryType: data.entryType,
      entryDate: data.entryDate,
      entryTime: data.entryTime,
      amount: price,
      entryStatus: "pending",
      paymentStatus: "pending",
      utr: null,
      adminNote: null,
    };
  });

export const lookupEntry = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        entryCode: z.string().trim().toUpperCase(),
        mobile: mobileSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<EntrySummary> => {
    const student = dbStore.getStudent({ studentIdCode: data.entryCode, mobile: data.mobile });
    if (!student) throw new Error("Entry ID और मोबाइल नंबर मेल नहीं खा रहे");

    const payment = dbStore.getAllPayments({ search: student.studentIdCode })[0];
    const isHalf = student.selectedPlan === "morning_half" || student.selectedPlan === "second_half";

    return {
      entryCode: student.studentIdCode,
      fullName: student.fullName,
      mobileMasked: maskMobile(student.mobile),
      entryType: isHalf ? "half_day" : "full_day",
      entryDate: student.admissionDate,
      entryTime: "09:00",
      amount: isHalf ? 400 : 700,
      entryStatus: student.admissionStatus === "approved" ? "confirmed" : student.admissionStatus,
      paymentStatus: payment?.status ?? "pending",
      utr: payment?.utr ?? null,
      adminNote: payment?.adminNote ?? null,
    };
  });

export const submitPayment = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        entryCode: z.string().trim().toUpperCase(),
        mobile: mobileSchema,
        utr: z.string().trim().min(6),
        screenshotBase64: z.string().optional(),
        screenshotType: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<EntrySummary> => {
    let screenshotUrl: string | null = null;
    if (data.screenshotBase64 && data.screenshotType) {
      screenshotUrl = `data:${data.screenshotType};base64,${data.screenshotBase64}`;
    }

    dbStore.submitPayment({
      studentIdCode: data.entryCode,
      utr: data.utr,
      screenshotUrl,
    });

    const student = dbStore.getStudent({ studentIdCode: data.entryCode, mobile: data.mobile });
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");

    const payment = dbStore.getAllPayments({ search: student.studentIdCode })[0];
    const isHalf = student.selectedPlan === "morning_half" || student.selectedPlan === "second_half";

    return {
      entryCode: student.studentIdCode,
      fullName: student.fullName,
      mobileMasked: maskMobile(student.mobile),
      entryType: isHalf ? "half_day" : "full_day",
      entryDate: student.admissionDate,
      entryTime: "09:00",
      amount: isHalf ? 400 : 700,
      entryStatus: student.admissionStatus === "approved" ? "confirmed" : student.admissionStatus,
      paymentStatus: payment?.status ?? "pending",
      utr: payment?.utr ?? null,
      adminNote: payment?.adminNote ?? null,
    };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" }).handler(async () => {
  return { granted: true };
});

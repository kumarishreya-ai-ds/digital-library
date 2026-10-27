import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { LIBRARY, MEMBERSHIP_PLANS, PHYSICAL_SEATS, type SlotType } from "./library.ts";

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: "superadmin" | "admin";
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminSessionRecord {
  token: string;
  adminId: string;
  adminEmail: string;
  adminRole: "superadmin" | "admin";
  fullName: string;
  createdAt: string;
  expiresAt: string;
}

export interface StudentRecord {
  id: string;
  studentIdCode: string; // e.g. SGDL-2026-00001
  fullName: string;
  parentName?: string | null; // Father / Guardian Name
  mobile: string;
  email: string;
  address: string;
  examGoal?: string | null; // Preparation Goal (BPSC, UPSC, SSC, etc.)
  termsAccepted?: boolean;
  membershipStatus?: "active" | "expired" | "pending" | "suspended" | "cancelled";
  isDeactivated?: boolean;
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
  photoUrl: string | null;
  signatureUrl: string | null;
  idProofUrl: string | null;
  admissionStatus: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  selectedPlan: SlotType;
  assignedSeatNumber: string; // e.g. "Seat 05"
  admissionDate: string; // YYYY-MM-DD
  membershipStartDate: string;
  membershipEndDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRecord {
  id: string;
  bookingCode: string; // e.g. SGL-2026-00001
  seatNumber: string; // e.g. "Seat 01"
  studentId: string;
  studentName: string;
  studentMobile: string;
  bookingDate: string; // YYYY-MM-DD
  slot: SlotType;
  amount: number;
  status: "reserved" | "confirmed" | "cancelled" | "expired";
  reservedUntil: string | null; // ISO string for temporary hold
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  bookingCode: string;
  studentIdCode: string;
  studentName: string;
  studentMobile: string;
  plan: SlotType;
  amount: number;
  utr: string | null;
  screenshotUrl: string | null;
  status: "pending" | "verified" | "rejected";
  method: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentIdCode: string;
  studentName: string;
  studentMobile: string;
  assignedSeat: string;
  attendanceDate: string; // YYYY-MM-DD
  checkInAt: string; // ISO
  checkOutAt: string | null; // ISO
  status: "present" | "incomplete" | "absent";
  isManualCorrection: boolean;
  correctionReason: string | null;
  correctedBy: string | null;
  createdAt: string;
}

export interface RenewalRecord {
  id: string;
  studentIdCode: string;
  studentName: string;
  studentMobile: string;
  currentSeat: string;
  requestedPlan: SlotType;
  status: "pending" | "approved" | "rejected";
  utr: string | null;
  screenshotUrl: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface AdminSettingsRecord {
  upiId: string;
  receiverName: string;
  halfDayPrice: number;
  fullDayPrice: number;
  address: string;
  timings: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  qrImageUrl: string | null;
}

interface DatabaseState {
  adminUsers: AdminUserRecord[];
  adminSessions: AdminSessionRecord[];
  students: StudentRecord[];
  bookings: BookingRecord[];
  payments: PaymentRecord[];
  attendance: AttendanceRecord[];
  renewals: RenewalRecord[];
  auditLogs: AuditLogRecord[];
  settings: AdminSettingsRecord;
  nextStudentSeq: number;
  nextBookingSeq: number;
}

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.resolve(DATA_DIR, "sgdl_data.json");

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function defaultState(): DatabaseState {
  return {
    adminUsers: [],
    adminSessions: [],
    students: [
      {
        id: "stu-demo-01",
        studentIdCode: "SGDL-2026-00001",
        fullName: "Rohan Verma",
        parentName: "Suresh Verma",
        mobile: "9876543210",
        email: "rohan.verma@example.com",
        address: "Village Khudra, Pachlakhi, Siwan, Bihar",
        examGoal: "BPSC & Bihar Police SI",
        termsAccepted: true,
        photoUrl: null,
        signatureUrl: null,
        idProofUrl: null,
        admissionStatus: "approved",
        rejectionReason: null,
        selectedPlan: "morning_half",
        assignedSeatNumber: "Seat 01",
        admissionDate: "2026-10-01",
        membershipStartDate: "2026-10-01",
        membershipEndDate: "2026-11-01",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "stu-demo-02",
        studentIdCode: "SGDL-2026-00002",
        fullName: "Pooja Kumari",
        parentName: "Manoj Singh",
        mobile: "9812345678",
        email: "pooja.kumari@example.com",
        address: "Station Road, Siwan, Bihar",
        examGoal: "UPSC Civil Services",
        termsAccepted: true,
        photoUrl: null,
        signatureUrl: null,
        idProofUrl: null,
        admissionStatus: "approved",
        rejectionReason: null,
        selectedPlan: "full_time",
        assignedSeatNumber: "Seat 04",
        admissionDate: "2026-10-15",
        membershipStartDate: "2026-10-15",
        membershipEndDate: "2026-11-15",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    bookings: [
      {
        id: "bk-demo-01",
        bookingCode: "SGL-2026-00001",
        seatNumber: "Seat 01",
        studentId: "stu-demo-01",
        studentName: "Rohan Verma",
        studentMobile: "9876543210",
        bookingDate: new Date().toISOString().slice(0, 10),
        slot: "morning_half",
        amount: 400,
        status: "confirmed",
        reservedUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "bk-demo-02",
        bookingCode: "SGL-2026-00002",
        seatNumber: "Seat 04",
        studentId: "stu-demo-02",
        studentName: "Pooja Kumari",
        studentMobile: "9812345678",
        bookingDate: new Date().toISOString().slice(0, 10),
        slot: "full_time",
        amount: 700,
        status: "confirmed",
        reservedUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    payments: [
      {
        id: "pay-demo-01",
        bookingCode: "SGL-2026-00001",
        studentIdCode: "SGDL-2026-00001",
        studentName: "Rohan Verma",
        studentMobile: "9876543210",
        plan: "morning_half",
        amount: 400,
        utr: "987654321001",
        screenshotUrl: null,
        status: "verified",
        method: "upi",
        verifiedBy: "Admin",
        verifiedAt: new Date().toISOString(),
        adminNote: "Payment verified via SBI UPI",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "pay-demo-02",
        bookingCode: "SGL-2026-00002",
        studentIdCode: "SGDL-2026-00002",
        studentName: "Pooja Kumari",
        studentMobile: "9812345678",
        plan: "full_time",
        amount: 700,
        utr: "981234567802",
        screenshotUrl: null,
        status: "verified",
        method: "upi",
        verifiedBy: "Admin",
        verifiedAt: new Date().toISOString(),
        adminNote: "Full-Time month payment verified",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    attendance: [
      {
        id: "att-demo-01",
        studentIdCode: "SGDL-2026-00001",
        studentName: "Rohan Verma",
        studentMobile: "9876543210",
        assignedSeat: "Seat 01",
        attendanceDate: new Date().toISOString().slice(0, 10),
        checkInAt: new Date(Date.now() - 3600 * 2000).toISOString(),
        checkOutAt: null,
        status: "present",
        isManualCorrection: false,
        correctionReason: null,
        correctedBy: null,
        createdAt: new Date().toISOString(),
      },
    ],
    renewals: [],
    auditLogs: [
      {
        id: "log-init",
        adminEmail: "admin@shreeganeshdigitallibrary.in",
        action: "SYSTEM_INITIALIZED",
        entityType: "SYSTEM",
        entityId: "SYSTEM",
        details: "Shree Ganesh Digital Library management platform initialized with 20 seats.",
        createdAt: new Date().toISOString(),
      },
    ],
    settings: {
      upiId: LIBRARY.upiId,
      receiverName: LIBRARY.nameEn,
      halfDayPrice: 400,
      fullDayPrice: 700,
      address: LIBRARY.address,
      timings: "Morning: 7:00 AM - 12:00 PM | Second Half: 12:00 PM - 5:00 PM | Full-Time: 7:00 AM - 5:00 PM",
      ownerName: "Kumari Shreya",
      contactPhone: LIBRARY.phone,
      contactEmail: LIBRARY.email,
      qrImageUrl: null,
    },
    nextStudentSeq: 3,
    nextBookingSeq: 3,
  };
}

let memoryState: DatabaseState | null = null;

function loadState(): DatabaseState {
  if (memoryState) return memoryState;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      memoryState = JSON.parse(raw);
      if (!memoryState!.adminUsers) memoryState!.adminUsers = [];
      if (!memoryState!.adminSessions) memoryState!.adminSessions = [];
      return memoryState!;
    }

    // Fallback: check legacy .output path and migrate if found
    const legacyFile = path.resolve(process.cwd(), ".output", "sgdl_data.json");
    if (fs.existsSync(legacyFile)) {
      const raw = fs.readFileSync(legacyFile, "utf-8");
      memoryState = JSON.parse(raw);
      if (!memoryState!.adminUsers) memoryState!.adminUsers = [];
      if (!memoryState!.adminSessions) memoryState!.adminSessions = [];
      saveState();
      return memoryState!;
    }
  } catch (err) {
    console.warn("Could not read local data file, initializing defaults", err);
  }

  memoryState = defaultState();
  saveState();
  return memoryState;
}

function saveState(): void {
  if (!memoryState) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryState, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to persist data state to file", err);
  }
}

export const dbStore = {
  // --- ADMIN AUTHENTICATION & SESSIONS ---
  isInitialAdminSetupNeeded(): boolean {
    const state = loadState();
    return !state.adminUsers || state.adminUsers.length === 0;
  },

  setupInitialAdmin(opts: {
    email: string;
    fullName: string;
    password: string;
  }): { token: string; admin: { email: string; fullName: string; role: "superadmin" | "admin" } } {
    const state = loadState();
    if (state.adminUsers && state.adminUsers.length > 0) {
      throw new Error("प्रथम व्यवस्थापक पहले से पंजीकृत है। कृपया लॉगिन करें।");
    }

    const email = opts.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("वैध ईमेल आईडी दर्ज करें (Enter a valid email address)");
    }
    const fullName = opts.fullName.trim();
    if (fullName.length < 2) {
      throw new Error("व्यवस्थापक का पूरा नाम दर्ज करें");
    }
    if (opts.password.length < 8 || !/[A-Za-z]/.test(opts.password) || !/\d/.test(opts.password)) {
      throw new Error("पासवर्ड में कम से कम 8 अक्षर, एक अक्षर और एक संख्या होना अनिवार्य है");
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(opts.password, salt);
    const admin: AdminUserRecord = {
      id: `admin-${Date.now()}`,
      email,
      fullName,
      role: "superadmin",
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    state.adminUsers.push(admin);

    const token = generateToken();
    const session: AdminSessionRecord = {
      token,
      adminId: admin.id,
      adminEmail: admin.email,
      adminRole: admin.role,
      fullName: admin.fullName,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    };
    state.adminSessions.push(session);

    this.addAuditLog({
      adminEmail: admin.email,
      action: "INITIAL_ADMIN_SETUP",
      entityType: "ADMIN_USER",
      entityId: admin.id,
      details: JSON.stringify({ email: admin.email, role: admin.role }),
    });

    saveState();
    return { token, admin: { email: admin.email, fullName: admin.fullName, role: admin.role } };
  },

  loginAdmin(opts: {
    email: string;
    password: string;
  }): { token: string; admin: { email: string; fullName: string; role: "superadmin" | "admin" } } {
    const state = loadState();
    const email = opts.email.trim().toLowerCase();
    const admin = state.adminUsers.find((u) => u.email === email);

    if (!admin) {
      throw new Error("अमान्य ईमेल या पासवर्ड (Invalid email or password)");
    }

    const hashed = hashPassword(opts.password, admin.salt);
    if (hashed !== admin.passwordHash) {
      throw new Error("अमान्य ईमेल या पासवर्ड (Invalid email or password)");
    }

    // Clean expired sessions
    state.adminSessions = (state.adminSessions || []).filter(
      (s) => new Date(s.expiresAt).getTime() > Date.now(),
    );

    const token = generateToken();
    const session: AdminSessionRecord = {
      token,
      adminId: admin.id,
      adminEmail: admin.email,
      adminRole: admin.role,
      fullName: admin.fullName,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    };
    state.adminSessions.push(session);
    admin.lastLoginAt = new Date().toISOString();

    this.addAuditLog({
      adminEmail: admin.email,
      action: "ADMIN_LOGIN",
      entityType: "ADMIN_SESSION",
      entityId: session.adminId,
      details: JSON.stringify({ email: admin.email }),
    });

    saveState();
    return { token, admin: { email: admin.email, fullName: admin.fullName, role: admin.role } };
  },

  logoutAdmin(token: string): boolean {
    const state = loadState();
    if (!token) return true;
    const session = state.adminSessions.find((s) => s.token === token);
    if (session) {
      this.addAuditLog({
        adminEmail: session.adminEmail,
        action: "ADMIN_LOGOUT",
        entityType: "ADMIN_SESSION",
        entityId: session.adminId,
        details: JSON.stringify({ email: session.adminEmail }),
      });
    }
    state.adminSessions = state.adminSessions.filter((s) => s.token !== token);
    saveState();
    return true;
  },

  verifyAdminSession(token?: string | null): AdminSessionRecord {
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      throw new Error("अनधिकृत: व्यवस्थापक प्रमाणीकरण आवश्यक है (Unauthorized: Admin token required)");
    }
    const state = loadState();
    const session = state.adminSessions.find((s) => s.token === token.trim());
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      throw new Error("सत्र समाप्त हो गया है। कृपया पुनः लॉगिन करें (Session expired, please sign in)");
    }
    return session;
  },

  getSettings(): AdminSettingsRecord {
    return loadState().settings;
  },

  updateSettings(updates: Partial<AdminSettingsRecord>, adminEmail = "Admin"): AdminSettingsRecord {
    const state = loadState();
    state.settings = { ...state.settings, ...updates };
    this.addAuditLog({
      adminEmail,
      action: "UPDATE_SETTINGS",
      entityType: "SETTINGS",
      entityId: "singleton",
      details: JSON.stringify(updates),
    });
    saveState();
    return state.settings;
  },

  // --- SEATS & BOOKING AVAILABILITY ---
  getAllSeats() {
    return PHYSICAL_SEATS;
  },

  /**
   * Calculates availability for a given date and slot across all 20 seats.
   * Slot conflict rules:
   * - morning_half & second_half do not conflict with each other.
   * - full_time conflicts with both morning_half and second_half.
   */
  getSeatAvailability(date: string, selectedSlot: SlotType) {
    const state = loadState();
    const now = Date.now();

    // Clean expired reservations
    for (const b of state.bookings) {
      if (b.status === "reserved" && b.reservedUntil) {
        if (new Date(b.reservedUntil).getTime() < now) {
          b.status = "expired";
        }
      }
    }

    // Active bookings on this date
    const dateBookings = state.bookings.filter(
      (b) => b.bookingDate === date && (b.status === "confirmed" || b.status === "reserved"),
    );

    return PHYSICAL_SEATS.map((seat) => {
      // Find all bookings for this seat on this date
      const seatBookings = dateBookings.filter((b) => b.seatNumber === seat.number);

      let isOccupied = false;
      let occupiedReason: string | null = null;
      let holdExpiresAt: string | null = null;

      for (const b of seatBookings) {
        if (b.slot === "full_time") {
          isOccupied = true;
          occupiedReason = `Booked Full-Time by ${b.studentName}`;
          if (b.status === "reserved") holdExpiresAt = b.reservedUntil;
          break;
        }

        if (selectedSlot === "full_time") {
          // Full-time is blocked if either morning or second half is booked
          isOccupied = true;
          occupiedReason = `Blocked by ${b.slot === "morning_half" ? "Morning Half" : "Second Half"} booking (${b.studentName})`;
          if (b.status === "reserved") holdExpiresAt = b.reservedUntil;
          break;
        }

        if (b.slot === selectedSlot) {
          isOccupied = true;
          occupiedReason = `Booked for ${MEMBERSHIP_PLANS[selectedSlot].nameEn} by ${b.studentName}`;
          if (b.status === "reserved") holdExpiresAt = b.reservedUntil;
          break;
        }
      }

      // Check also active student assigned seats if admission is approved
      const assignedStudent = state.students.find(
        (s) =>
          !s.isDeactivated &&
          s.membershipStatus !== "cancelled" &&
          s.assignedSeatNumber === seat.number &&
          s.admissionStatus === "approved" &&
          s.membershipStartDate <= date &&
          s.membershipEndDate >= date,
      );

      if (assignedStudent) {
        if (
          assignedStudent.selectedPlan === "full_time" ||
          selectedSlot === "full_time" ||
          assignedStudent.selectedPlan === selectedSlot
        ) {
          isOccupied = true;
          occupiedReason = `Allocated to ${assignedStudent.fullName} (${MEMBERSHIP_PLANS[assignedStudent.selectedPlan].nameEn})`;
        }
      }

      return {
        number: seat.number,
        label: seat.label,
        row: seat.row,
        col: seat.col,
        isAvailable: !isOccupied,
        occupiedReason,
        holdExpiresAt,
      };
    });
  },

  createSeatHold(opts: {
    seatNumber: string;
    studentName: string;
    studentMobile: string;
    bookingDate: string;
    slot: SlotType;
    studentId?: string;
  }): BookingRecord {
    const state = loadState();
    const availability = this.getSeatAvailability(opts.bookingDate, opts.slot);
    const targetSeat = availability.find((s) => s.number === opts.seatNumber);

    if (!targetSeat) throw new Error("सीट मौजूद नहीं है");
    if (!targetSeat.isAvailable) {
      throw new Error(`सीट ${opts.seatNumber} चुनी गई तारीख और स्लॉट के लिए उपलब्ध नहीं है (${targetSeat.occupiedReason})`);
    }

    const year = new Date().getFullYear();
    const seq = state.nextBookingSeq++;
    const bookingCode = `SGL-${year}-${seq.toString().padStart(5, "0")}`;
    const amount = MEMBERSHIP_PLANS[opts.slot].priceMonthly;

    // 15-minute reservation hold
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const booking: BookingRecord = {
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bookingCode,
      seatNumber: opts.seatNumber,
      studentId: opts.studentId || `temp-${opts.studentMobile}`,
      studentName: opts.studentName,
      studentMobile: opts.studentMobile,
      bookingDate: opts.bookingDate,
      slot: opts.slot,
      amount,
      status: "reserved",
      reservedUntil,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.bookings.push(booking);
    saveState();
    return booking;
  },

  // --- ADMISSIONS ---
  createAdmission(opts: {
    fullName: string;
    parentName?: string | null;
    mobile: string;
    email: string;
    address: string;
    examGoal?: string | null;
    termsAccepted?: boolean;
    selectedPlan: SlotType;
    assignedSeatNumber: string;
    photoUrl?: string | null;
    signatureUrl?: string | null;
    idProofUrl?: string | null;
    admissionDate?: string;
  }): StudentRecord {
    const state = loadState();

    // Check duplicate by mobile
    const existing = state.students.find((s) => s.mobile === opts.mobile);
    if (existing && existing.admissionStatus === "approved") {
      throw new Error(`इस मोबाइल नंबर (${opts.mobile}) से पहले ही छात्र आईडी ${existing.studentIdCode} मौजूद है। कृपया स्टूडेंट पोर्टल में लॉगिन करें।`);
    }

    // Check seat availability
    const admissionDate = opts.admissionDate || new Date().toISOString().slice(0, 10);
    const availability = this.getSeatAvailability(admissionDate, opts.selectedPlan);
    const targetSeat = availability.find((s) => s.number === opts.assignedSeatNumber);

    if (targetSeat && !targetSeat.isAvailable) {
      throw new Error(`सीट ${opts.assignedSeatNumber} इस स्लॉट के लिए उपलब्ध नहीं है। कृपया कोई अन्य सीट चुनें।`);
    }

    const year = new Date().getFullYear();
    const seq = state.nextStudentSeq++;
    const studentIdCode = `SGDL-${year}-${seq.toString().padStart(5, "0")}`;

    // End date 30 days ahead
    const startDate = admissionDate;
    const end = new Date(startDate);
    end.setDate(end.getDate() + 30);
    const membershipEndDate = end.toISOString().slice(0, 10);

    const student: StudentRecord = {
      id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentIdCode,
      fullName: opts.fullName,
      parentName: opts.parentName || null,
      mobile: opts.mobile,
      email: opts.email,
      address: opts.address,
      examGoal: opts.examGoal || null,
      termsAccepted: opts.termsAccepted ?? true,
      photoUrl: opts.photoUrl || null,
      signatureUrl: opts.signatureUrl || null,
      idProofUrl: opts.idProofUrl || null,
      admissionStatus: "pending",
      rejectionReason: null,
      selectedPlan: opts.selectedPlan,
      assignedSeatNumber: opts.assignedSeatNumber,
      admissionDate,
      membershipStartDate: startDate,
      membershipEndDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      // Update pending existing
      Object.assign(existing, student, { id: existing.id, studentIdCode: existing.studentIdCode });
    } else {
      state.students.push(student);
    }

    // Auto-create initial seat hold
    const bookingCode = `SGL-${year}-${(state.nextBookingSeq++).toString().padStart(5, "0")}`;
    state.bookings.push({
      id: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      bookingCode,
      seatNumber: opts.assignedSeatNumber,
      studentId: student.id,
      studentName: student.fullName,
      studentMobile: student.mobile,
      bookingDate: admissionDate,
      slot: opts.selectedPlan,
      amount: MEMBERSHIP_PLANS[opts.selectedPlan].priceMonthly,
      status: "reserved",
      reservedUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // 24-hr hold for admission
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    saveState();
    return student;
  },

  getStudent(lookup: { studentIdCode?: string; mobile?: string }): StudentRecord | null {
    const state = loadState();
    if (lookup.studentIdCode) {
      const code = lookup.studentIdCode.trim().toUpperCase();
      const byCode = state.students.find((s) => s.studentIdCode.toUpperCase() === code);
      if (byCode) return byCode;

      // Allow 10-digit mobile lookup inside studentIdCode field
      if (/^\d{10}$/.test(lookup.studentIdCode.trim())) {
        const byMobile = state.students.find((s) => s.mobile === lookup.studentIdCode.trim());
        if (byMobile) return byMobile;
      }
      return null;
    }
    if (lookup.mobile) {
      return state.students.find((s) => s.mobile === lookup.mobile.trim()) || null;
    }
    return null;
  },

  getAllStudents(filter?: {
    search?: string;
    status?: string;
    membershipStatus?: string;
    includeDeactivated?: boolean;
  }): StudentRecord[] {
    const state = loadState();
    let list = [...state.students];

    if (!filter?.includeDeactivated) {
      list = list.filter((s) => !s.isDeactivated);
    }

    if (filter?.status && filter.status !== "all") {
      list = list.filter((s) => s.admissionStatus === filter.status);
    }

    if (filter?.membershipStatus && filter.membershipStatus !== "all") {
      list = list.filter((s) => s.membershipStatus === filter.membershipStatus);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          (s.parentName && s.parentName.toLowerCase().includes(q)) ||
          (s.examGoal && s.examGoal.toLowerCase().includes(q)) ||
          s.studentIdCode.toLowerCase().includes(q) ||
          s.mobile.includes(q),
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateAdmissionStatus(opts: {
    studentIdCode: string;
    status: "approved" | "rejected";
    rejectionReason?: string;
    adminEmail?: string;
  }): StudentRecord {
    const state = loadState();
    const student = state.students.find((s) => s.studentIdCode === opts.studentIdCode);
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");

    student.admissionStatus = opts.status;
    student.rejectionReason = opts.rejectionReason || null;
    student.updatedAt = new Date().toISOString();

    // Also update associated bookings
    const bookings = state.bookings.filter((b) => b.studentId === student.id);
    for (const b of bookings) {
      if (opts.status === "approved") {
        b.status = "confirmed";
        b.reservedUntil = null;
      } else {
        b.status = "cancelled";
      }
      b.updatedAt = new Date().toISOString();
    }

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: opts.status === "approved" ? "APPROVE_ADMISSION" : "REJECT_ADMISSION",
      entityType: "STUDENT",
      entityId: student.studentIdCode,
      details: JSON.stringify({ reason: opts.rejectionReason, plan: student.selectedPlan }),
    });

    saveState();
    return student;
  },

  updateStudentDetails(opts: {
    studentIdCode: string;
    fullName?: string;
    parentName?: string | null;
    mobile?: string;
    email?: string;
    address?: string;
    examGoal?: string | null;
    assignedSeatNumber?: string;
    selectedPlan?: SlotType;
    adminEmail?: string;
  }): StudentRecord {
    const state = loadState();
    const student = state.students.find((s) => s.studentIdCode === opts.studentIdCode);
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");

    if (opts.mobile && opts.mobile !== student.mobile) {
      const dup = state.students.find(
        (s) => s.mobile === opts.mobile && s.id !== student.id && !s.isDeactivated,
      );
      if (dup) {
        throw new Error(`मोबाइल नंबर (${opts.mobile}) पहले से छात्र ${dup.studentIdCode} के लिए पंजीकृत है`);
      }
      student.mobile = opts.mobile.trim();
    }

    if (opts.fullName) student.fullName = opts.fullName.trim();
    if (opts.parentName !== undefined) student.parentName = opts.parentName?.trim() || null;
    if (opts.email) student.email = opts.email.trim();
    if (opts.address) student.address = opts.address.trim();
    if (opts.examGoal !== undefined) student.examGoal = opts.examGoal?.trim() || null;

    // Check if seat or plan changed
    const newSeat = opts.assignedSeatNumber || student.assignedSeatNumber;
    const newPlan = opts.selectedPlan || student.selectedPlan;

    if (newSeat !== student.assignedSeatNumber || newPlan !== student.selectedPlan) {
      // Validate availability on target seat (ignoring student's own booking)
      const avail = this.getSeatAvailability(student.admissionDate, newPlan);
      const target = avail.find((s) => s.number === newSeat);
      if (target && !target.isAvailable && target.number !== student.assignedSeatNumber) {
        throw new Error(`सीट ${newSeat} इस स्लॉट (${MEMBERSHIP_PLANS[newPlan].nameEn}) के लिए उपलब्ध नहीं है`);
      }

      student.assignedSeatNumber = newSeat;
      student.selectedPlan = newPlan;

      // Update active booking
      const activeBooking = state.bookings.find(
        (b) => b.studentId === student.id && (b.status === "confirmed" || b.status === "reserved"),
      );
      if (activeBooking) {
        activeBooking.seatNumber = newSeat;
        activeBooking.slot = newPlan;
        activeBooking.updatedAt = new Date().toISOString();
      }
    }

    student.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "UPDATE_STUDENT_DETAILS",
      entityType: "STUDENT",
      entityId: student.studentIdCode,
      details: JSON.stringify({
        fullName: student.fullName,
        seat: student.assignedSeatNumber,
        plan: student.selectedPlan,
      }),
    });

    saveState();
    return student;
  },

  suspendStudent(opts: {
    studentIdCode: string;
    reason: string;
    adminEmail?: string;
  }): StudentRecord {
    const state = loadState();
    const student = state.students.find((s) => s.studentIdCode === opts.studentIdCode);
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");
    if (!opts.reason || opts.reason.trim().length < 3) {
      throw new Error("सदस्यता निलंबित करने का कारण लिखना अनिवार्य है");
    }

    student.membershipStatus = "suspended";
    student.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "SUSPEND_STUDENT_MEMBERSHIP",
      entityType: "STUDENT",
      entityId: student.studentIdCode,
      details: JSON.stringify({ reason: opts.reason }),
    });

    saveState();
    return student;
  },

  reactivateStudent(opts: {
    studentIdCode: string;
    adminEmail?: string;
  }): StudentRecord {
    const state = loadState();
    const student = state.students.find((s) => s.studentIdCode === opts.studentIdCode);
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");

    student.isDeactivated = false;
    student.deactivatedAt = undefined;
    student.deactivationReason = undefined;
    student.membershipStatus = "active";
    student.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "REACTIVATE_STUDENT_MEMBERSHIP",
      entityType: "STUDENT",
      entityId: student.studentIdCode,
      details: JSON.stringify({ status: "active", reactivatedAt: student.updatedAt }),
    });

    saveState();
    return student;
  },

  permanentlyDeleteStudent(opts: {
    studentIdCode: string;
    confirmationCode: string;
    reason: string;
    adminEmail?: string;
  }): { success: boolean; message: string; deletedStudent: { idCode: string; name: string } } {
    const state = loadState();
    const code = opts.studentIdCode.trim().toUpperCase();
    const student = state.students.find((s) => s.studentIdCode.toUpperCase() === code);
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");

    const conf = opts.confirmationCode.trim();
    if (conf !== code && conf.toUpperCase() !== student.fullName.trim().toUpperCase()) {
      throw new Error(`हटाने की पुष्टि के लिए छात्र की आईडी "${code}" या नाम दर्ज करें`);
    }

    if (!opts.reason || opts.reason.trim().length < 5) {
      throw new Error("स्थाई रूप से हटाने का कारण लिखना अनिवार्य है (कम से कम 5 अक्षर)");
    }

    // 1. Release physical seat holds / active bookings
    const studentBookings = state.bookings.filter(
      (b) => b.studentId === student.id || b.studentName === student.fullName,
    );
    for (const b of studentBookings) {
      if (b.status === "confirmed" || b.status === "reserved") {
        b.status = "cancelled";
        b.updatedAt = new Date().toISOString();
      }
    }

    // 2. Preserve financial integrity: retain payment records with audit notation
    const studentPayments = state.payments.filter((p) => p.studentIdCode === student.studentIdCode);
    for (const p of studentPayments) {
      p.adminNote = p.adminNote
        ? `${p.adminNote} | [खाता स्थाई रूप से हटाया गया]: ${opts.reason}`
        : `[खाता स्थाई रूप से हटाया गया]: ${opts.reason}`;
      p.updatedAt = new Date().toISOString();
    }

    // 3. Preserve attendance history with archived notation
    const studentAttendance = state.attendance.filter((a) => a.studentIdCode === student.studentIdCode);
    for (const a of studentAttendance) {
      a.correctionReason = a.correctionReason
        ? `${a.correctionReason} | [Deleted Student Record]`
        : `[Deleted Student Record]`;
    }

    // 4. Remove student record from active database
    state.students = state.students.filter((s) => s.id !== student.id);

    // 5. Audit Log
    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "PERMANENTLY_DELETE_STUDENT",
      entityType: "STUDENT",
      entityId: code,
      details: JSON.stringify({
        fullName: student.fullName,
        mobile: student.mobile,
        reason: opts.reason.trim(),
        preservedPaymentsCount: studentPayments.length,
        preservedAttendanceCount: studentAttendance.length,
        deletedAt: new Date().toISOString(),
      }),
    });

    saveState();
    return {
      success: true,
      message: `छात्र ${student.fullName} (${code}) का रिकॉर्ड स्थाई रूप से हटा दिया गया एवं वित्तीय इतिहास सुरक्षित रखा गया`,
      deletedStudent: { idCode: code, name: student.fullName },
    };
  },

  deactivateStudent(opts: {
    studentIdCode: string;
    reason: string;
    adminEmail?: string;
  }): StudentRecord {
    const state = loadState();
    const student = state.students.find((s) => s.studentIdCode === opts.studentIdCode);
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");
    if (!opts.reason || opts.reason.trim().length < 5) {
      throw new Error("छात्र रिकॉर्ड निष्क्रिय करने का कारण लिखना अनिवार्य है (कम से कम 5 अक्षर)");
    }

    student.isDeactivated = true;
    student.deactivatedAt = new Date().toISOString();
    student.deactivationReason = opts.reason.trim();
    student.membershipStatus = "cancelled";
    student.updatedAt = new Date().toISOString();

    // Release any active seat bookings so desk is immediately available for others
    const activeBookings = state.bookings.filter(
      (b) => b.studentId === student.id && (b.status === "confirmed" || b.status === "reserved"),
    );
    for (const b of activeBookings) {
      b.status = "cancelled";
      b.updatedAt = new Date().toISOString();
    }

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "DEACTIVATE_STUDENT",
      entityType: "STUDENT",
      entityId: student.studentIdCode,
      details: JSON.stringify({ reason: opts.reason }),
    });

    saveState();
    return student;
  },

  reassignSeatBooking(opts: {
    studentIdCode: string;
    newSeatNumber: string;
    reason: string;
    adminEmail?: string;
  }): BookingRecord {
    const state = loadState();
    const student = state.students.find((s) => s.studentIdCode === opts.studentIdCode);
    if (!student) throw new Error("छात्र रिकॉर्ड नहीं मिला");
    if (!opts.reason || opts.reason.trim().length < 3) {
      throw new Error("सीट पुनर्वितरण का कारण लिखना अनिवार्य है");
    }

    const avail = this.getSeatAvailability(student.admissionDate, student.selectedPlan);
    const target = avail.find((s) => s.number === opts.newSeatNumber);
    if (!target || !target.isAvailable) {
      throw new Error(`सीट ${opts.newSeatNumber} इस स्लॉट (${student.selectedPlan}) के लिए उपलब्ध नहीं है`);
    }

    const oldSeat = student.assignedSeatNumber;
    student.assignedSeatNumber = opts.newSeatNumber;
    student.updatedAt = new Date().toISOString();

    let booking = state.bookings.find(
      (b) => b.studentId === student.id && (b.status === "confirmed" || b.status === "reserved"),
    );
    if (booking) {
      booking.seatNumber = opts.newSeatNumber;
      booking.updatedAt = new Date().toISOString();
    } else {
      const year = new Date().getFullYear();
      booking = {
        id: `bk-${Date.now()}`,
        bookingCode: `SGL-${year}-${(state.nextBookingSeq++).toString().padStart(5, "0")}`,
        seatNumber: opts.newSeatNumber,
        studentId: student.id,
        studentName: student.fullName,
        studentMobile: student.mobile,
        bookingDate: student.admissionDate,
        slot: student.selectedPlan,
        amount: MEMBERSHIP_PLANS[student.selectedPlan].priceMonthly,
        status: "confirmed",
        reservedUntil: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.bookings.push(booking);
    }

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "REASSIGN_SEAT",
      entityType: "BOOKING",
      entityId: booking.bookingCode,
      details: JSON.stringify({
        student: student.studentIdCode,
        fromSeat: oldSeat,
        toSeat: opts.newSeatNumber,
        reason: opts.reason,
      }),
    });

    saveState();
    return booking;
  },

  cancelSeatBooking(opts: {
    bookingCode: string;
    reason: string;
    adminEmail?: string;
  }): BookingRecord {
    const state = loadState();
    const booking = state.bookings.find((b) => b.bookingCode === opts.bookingCode);
    if (!booking) throw new Error("बुकिंग रिकॉर्ड नहीं मिला");
    if (!opts.reason || opts.reason.trim().length < 3) {
      throw new Error("बुकिंग रद्द करने का कारण लिखना अनिवार्य है");
    }

    booking.status = "cancelled";
    booking.updatedAt = new Date().toISOString();

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "CANCEL_BOOKING",
      entityType: "BOOKING",
      entityId: booking.bookingCode,
      details: JSON.stringify({ reason: opts.reason, seat: booking.seatNumber }),
    });

    saveState();
    return booking;
  },

  getAllBookings(): BookingRecord[] {
    const state = loadState();
    return [...state.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // --- PAYMENTS & MANUAL VERIFICATION ---
  submitPayment(opts: {
    studentIdCode: string;
    bookingCode?: string;
    utr: string;
    screenshotUrl?: string | null;
  }): PaymentRecord {
    const state = loadState();
    let student = state.students.find(
      (s) => s.studentIdCode.toUpperCase() === opts.studentIdCode.trim().toUpperCase(),
    );
    if (!student && /^\d{10}$/.test(opts.studentIdCode.trim())) {
      student = state.students.find((s) => s.mobile === opts.studentIdCode.trim());
    }
    if (!student) throw new Error("छात्र आईडी या पंजीकृत मोबाइल नंबर मान्य नहीं है");

    // Check duplicate UTR
    const cleanUtr = opts.utr.trim().toUpperCase();
    const dup = state.payments.find((p) => p.utr?.toUpperCase() === cleanUtr);
    if (dup && dup.status === "verified") {
      throw new Error("यह UTR / Transaction ID पहले से सत्यापित किया जा चुका है");
    }

    const plan = student.selectedPlan;
    const amount = MEMBERSHIP_PLANS[plan].priceMonthly;
    const booking = state.bookings.find((b) => b.studentId === student.id) || state.bookings[0];
    const bookingCode = opts.bookingCode || booking?.bookingCode || `SGL-PAY-${Date.now()}`;

    // Existing pending payment for this student?
    const existing = state.payments.find(
      (p) => p.studentIdCode === student.studentIdCode && p.status === "pending",
    );

    let paymentRecord: PaymentRecord;
    if (existing) {
      existing.utr = cleanUtr;
      existing.screenshotUrl = opts.screenshotUrl || existing.screenshotUrl;
      existing.updatedAt = new Date().toISOString();
      paymentRecord = existing;
    } else {
      paymentRecord = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        bookingCode,
        studentIdCode: student.studentIdCode,
        studentName: student.fullName,
        studentMobile: student.mobile,
        plan,
        amount,
        utr: cleanUtr,
        screenshotUrl: opts.screenshotUrl || null,
        status: "pending",
        method: "upi",
        verifiedBy: null,
        verifiedAt: null,
        adminNote: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.payments.push(paymentRecord);
    }

    saveState();
    return paymentRecord;
  },

  verifyPayment(opts: {
    paymentId: string;
    status: "verified" | "rejected";
    adminNote?: string;
    adminEmail?: string;
  }): PaymentRecord {
    const state = loadState();
    const payment = state.payments.find((p) => p.id === opts.paymentId);
    if (!payment) throw new Error("भुगतान रिकॉर्ड नहीं मिला");

    payment.status = opts.status;
    payment.adminNote = opts.adminNote || null;
    payment.verifiedBy = opts.adminEmail || "Admin";
    payment.verifiedAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();

    if (opts.status === "verified") {
      // Automatically confirm the student admission if pending
      const student = state.students.find((s) => s.studentIdCode === payment.studentIdCode);
      if (student && student.admissionStatus === "pending") {
        student.admissionStatus = "approved";
        student.updatedAt = new Date().toISOString();
      }

      // Confirm seat booking
      const booking = state.bookings.find((b) => b.bookingCode === payment.bookingCode);
      if (booking) {
        booking.status = "confirmed";
        booking.reservedUntil = null;
        booking.updatedAt = new Date().toISOString();
      }
    }

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: opts.status === "verified" ? "VERIFY_PAYMENT" : "REJECT_PAYMENT",
      entityType: "PAYMENT",
      entityId: payment.id,
      details: JSON.stringify({
        utr: payment.utr,
        amount: payment.amount,
        studentIdCode: payment.studentIdCode,
        note: opts.adminNote,
      }),
    });

    saveState();
    return payment;
  },

  getAllPayments(filter?: { status?: string; search?: string }): PaymentRecord[] {
    const state = loadState();
    let list = [...state.payments];

    if (filter?.status && filter.status !== "all") {
      list = list.filter((p) => p.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.studentName.toLowerCase().includes(q) ||
          p.studentIdCode.toLowerCase().includes(q) ||
          (p.utr && p.utr.toLowerCase().includes(q)),
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // --- ATTENDANCE MANAGEMENT ---
  checkInAttendance(opts: { studentIdCode: string }): AttendanceRecord {
    const state = loadState();
    let student = state.students.find(
      (s) => s.studentIdCode.toUpperCase() === opts.studentIdCode.trim().toUpperCase(),
    );
    if (!student && /^\d{10}$/.test(opts.studentIdCode.trim())) {
      student = state.students.find((s) => s.mobile === opts.studentIdCode.trim());
    }
    if (!student) throw new Error("छात्र आईडी या पंजीकृत मोबाइल नंबर मान्य नहीं है");
    if (student.isDeactivated) {
      throw new Error("आपका छात्र खाता निष्क्रिय (Deactivated) है। कृपया लाइब्रेरी व्यवस्थापक से संपर्क करें।");
    }
    if (student.membershipStatus === "suspended") {
      throw new Error("आपकी सदस्यता वर्तमान में निलंबित (Suspended) है। कृपया व्यवस्थापक से संपर्क करें।");
    }
    if (student.admissionStatus !== "approved") {
      throw new Error("एडमिशन स्वीकृत होने के बाद ही उपस्थिति दर्ज की जा सकती है");
    }

    const today = new Date().toISOString().slice(0, 10);
    const existing = state.attendance.find(
      (a) => a.studentIdCode === student.studentIdCode && a.attendanceDate === today,
    );

    if (existing) {
      if (existing.checkOutAt === null) {
        throw new Error("आप पहले ही चेक-इन कर चुके हैं। बाहर जाते समय चेक-आउट करें।");
      }
      throw new Error("आज की उपस्थिति पहले ही दर्ज हो चुकी है (चेक-आउट पूरा हो गया है)");
    }

    const record: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentIdCode: student.studentIdCode,
      studentName: student.fullName,
      studentMobile: student.mobile,
      assignedSeat: student.assignedSeatNumber,
      attendanceDate: today,
      checkInAt: new Date().toISOString(),
      checkOutAt: null,
      status: "present",
      isManualCorrection: false,
      correctionReason: null,
      correctedBy: null,
      createdAt: new Date().toISOString(),
    };

    state.attendance.push(record);
    saveState();
    return record;
  },

  checkOutAttendance(opts: { studentIdCode: string }): AttendanceRecord {
    const state = loadState();
    const today = new Date().toISOString().slice(0, 10);
    const code = opts.studentIdCode.trim().toUpperCase();
    let record = state.attendance.find(
      (a) =>
        (a.studentIdCode.toUpperCase() === code || a.studentMobile === opts.studentIdCode.trim()) &&
        a.attendanceDate === today,
    );

    if (!record) {
      throw new Error("आज का कोई चेक-इन रिकॉर्ड नहीं मिला। पहले चेक-इन करें।");
    }
    if (record.checkOutAt !== null) {
      throw new Error("आप पहले ही चेक-आउट कर चुके हैं।");
    }

    record.checkOutAt = new Date().toISOString();
    saveState();
    return record;
  },

  adminCorrectAttendance(opts: {
    studentIdCode: string;
    attendanceDate: string;
    checkInAt: string;
    checkOutAt?: string | null;
    status: "present" | "incomplete" | "absent";
    reason: string;
    adminEmail?: string;
  }): AttendanceRecord {
    const state = loadState();
    if (!opts.reason || opts.reason.trim().length < 5) {
      throw new Error("सुधार का कारण लिखना अनिवार्य है (कम से कम 5 अक्षर)");
    }

    const student = state.students.find((s) => s.studentIdCode === opts.studentIdCode);
    if (!student) throw new Error("छात्र नहीं मिला");

    let record = state.attendance.find(
      (a) => a.studentIdCode === opts.studentIdCode && a.attendanceDate === opts.attendanceDate,
    );

    if (record) {
      record.checkInAt = opts.checkInAt;
      record.checkOutAt = opts.checkOutAt || null;
      record.status = opts.status;
      record.isManualCorrection = true;
      record.correctionReason = opts.reason;
      record.correctedBy = opts.adminEmail || "Admin";
    } else {
      record = {
        id: `att-corr-${Date.now()}`,
        studentIdCode: student.studentIdCode,
        studentName: student.fullName,
        studentMobile: student.mobile,
        assignedSeat: student.assignedSeatNumber,
        attendanceDate: opts.attendanceDate,
        checkInAt: opts.checkInAt,
        checkOutAt: opts.checkOutAt || null,
        status: opts.status,
        isManualCorrection: true,
        correctionReason: opts.reason,
        correctedBy: opts.adminEmail || "Admin",
        createdAt: new Date().toISOString(),
      };
      state.attendance.push(record);
    }

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "CORRECT_ATTENDANCE",
      entityType: "ATTENDANCE",
      entityId: opts.studentIdCode,
      details: JSON.stringify({ date: opts.attendanceDate, reason: opts.reason, status: opts.status }),
    });

    saveState();
    return record;
  },

  getAttendanceHistory(filter?: { studentIdCode?: string; date?: string }): AttendanceRecord[] {
    const state = loadState();
    let list = [...state.attendance];

    if (filter?.studentIdCode) {
      const code = filter.studentIdCode.toUpperCase().trim();
      list = list.filter((a) => a.studentIdCode.toUpperCase() === code);
    }
    if (filter?.date) {
      list = list.filter((a) => a.attendanceDate === filter.date);
    }

    return list.sort((a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime());
  },

  // --- RENEWALS ---
  requestRenewal(opts: {
    studentIdCode: string;
    requestedPlan: SlotType;
    utr?: string;
    screenshotUrl?: string;
  }): RenewalRecord {
    const state = loadState();
    const student = state.students.find(
      (s) => s.studentIdCode.toUpperCase() === opts.studentIdCode.trim().toUpperCase(),
    );
    if (!student) throw new Error("छात्र आईडी मान्य नहीं है");
    if (student.isDeactivated) {
      throw new Error("निष्क्रिय (Deactivated) छात्र खाते का नवीनीकरण नहीं किया जा सकता। कृपया व्यवस्थापक से संपर्क करें।");
    }

    const renewal: RenewalRecord = {
      id: `rnw-${Date.now()}`,
      studentIdCode: student.studentIdCode,
      studentName: student.fullName,
      studentMobile: student.mobile,
      currentSeat: student.assignedSeatNumber,
      requestedPlan: opts.requestedPlan,
      status: "pending",
      utr: opts.utr || null,
      screenshotUrl: opts.screenshotUrl || null,
      adminNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    state.renewals.push(renewal);
    saveState();
    return renewal;
  },

  approveRenewal(opts: { renewalId: string; adminEmail?: string }): RenewalRecord {
    const state = loadState();
    const renewal = state.renewals.find((r) => r.id === opts.renewalId);
    if (!renewal) throw new Error("नवीनीकरण अनुरोध नहीं मिला");

    renewal.status = "approved";
    renewal.updatedAt = new Date().toISOString();

    const student = state.students.find((s) => s.studentIdCode === renewal.studentIdCode);
    if (student) {
      student.selectedPlan = renewal.requestedPlan;
      // Extend end date by 30 days
      const currentExpiry = new Date(student.membershipEndDate);
      const base = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
      base.setDate(base.getDate() + 30);
      student.membershipEndDate = base.toISOString().slice(0, 10);
      student.updatedAt = new Date().toISOString();
    }

    this.addAuditLog({
      adminEmail: opts.adminEmail || "Admin",
      action: "APPROVE_RENEWAL",
      entityType: "RENEWAL",
      entityId: renewal.id,
      details: JSON.stringify({ student: renewal.studentIdCode, plan: renewal.requestedPlan }),
    });

    saveState();
    return renewal;
  },

  getAllRenewals(): RenewalRecord[] {
    return [...loadState().renewals].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  // --- AUDIT LOGS ---
  addAuditLog(opts: {
    adminEmail: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
  }): void {
    const state = loadState();
    state.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      adminEmail: opts.adminEmail,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      details: opts.details,
      createdAt: new Date().toISOString(),
    });
    // Keep last 500 logs
    if (state.auditLogs.length > 500) state.auditLogs.length = 500;
  },

  getAuditLogs(): AuditLogRecord[] {
    return loadState().auditLogs;
  },
};

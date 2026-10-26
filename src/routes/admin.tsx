import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Calendar,
  Download,
  Search,
  FileCheck2,
  AlertCircle,
  Eye,
  Settings,
  History,
  Lock,
  LogOut,
  UserCheck,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { SeatGrid } from "@/components/SeatGrid";
import { ReceiptCard } from "@/components/ReceiptCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LIBRARY,
  MEMBERSHIP_PLANS,
  formatPrice,
  type SlotType,
} from "@/lib/library";
import {
  getAdminOverviewFn,
  getAdminStudentsFn,
  updateAdmissionStatusFn,
  getAdminPaymentsFn,
  verifyPaymentFn,
  getAdminAttendanceFn,
  correctAttendanceFn,
  getAdminRenewalsFn,
  approveRenewalFn,
  getAdminAuditLogsFn,
  updateAdminSettingsFn,
  getSeatAvailabilityFn,
} from "@/lib/library.functions";
import type { StudentRecord, PaymentRecord, AttendanceRecord } from "@/lib/server-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "प्रशासनिक नियंत्रण कक्ष (Admin Portal) | " + LIBRARY.nameEn },
      {
        name: "description",
        content: "श्री गणेश डिजिटल लाइब्रेरी - व्यवस्थापक डैशबोर्ड: छात्र एडमिशन, सीट आवंटन, फीस सत्यापन एवं उपस्थिति।",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  // Simple administrative authentication barrier for prototype & verification
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("sgdl_admin_auth") === "true";
    }
    return false;
  });
  const [adminPin, setAdminPin] = useState("");

  const [activeTab, setActiveTab] = useState<
    "overview" | "admissions" | "seats" | "payments" | "attendance" | "renewals" | "reports" | "audit" | "settings"
  >("overview");

  // Search and filter states
  const [studentSearch, setStudentSearch] = useState("");
  const [admissionFilter, setAdmissionFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  // Seat tab state
  const [seatSlot, setSeatSlot] = useState<SlotType>("morning_half");
  const [seatDate, setSeatDate] = useState(new Date().toISOString().slice(0, 10));

  // Modals & previews
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [previewPayment, setPreviewPayment] = useState<PaymentRecord | null>(null);

  // Attendance correction form state
  const [correctionStudentId, setCorrectionStudentId] = useState("");
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [correctionCheckIn, setCorrectionCheckIn] = useState("08:00");
  const [correctionCheckOut, setCorrectionCheckOut] = useState("12:00");
  const [correctionStatus, setCorrectionStatus] = useState<"present" | "incomplete" | "absent">("present");
  const [correctionReason, setCorrectionReason] = useState("");

  // Server functions
  const fetchOverview = useServerFn(getAdminOverviewFn);
  const fetchStudents = useServerFn(getAdminStudentsFn);
  const updateAdmission = useServerFn(updateAdmissionStatusFn);
  const fetchPayments = useServerFn(getAdminPaymentsFn);
  const verifyPayment = useServerFn(verifyPaymentFn);
  const fetchAttendance = useServerFn(getAdminAttendanceFn);
  const correctAttendance = useServerFn(correctAttendanceFn);
  const fetchRenewals = useServerFn(getAdminRenewalsFn);
  const approveRenewal = useServerFn(approveRenewalFn);
  const fetchAuditLogs = useServerFn(getAdminAuditLogsFn);
  const fetchSeatAvail = useServerFn(getSeatAvailabilityFn);

  // Queries
  const { data: overview, refetch: refetchOverview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
    enabled: isAdminAuthenticated,
  });

  const { data: students = [], refetch: refetchStudents } = useQuery({
    queryKey: ["admin-students", studentSearch, admissionFilter],
    queryFn: () =>
      fetchStudents({
        data: { search: studentSearch, status: admissionFilter },
      }),
    enabled: isAdminAuthenticated,
  });

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ["admin-payments", paymentFilter],
    queryFn: () => fetchPayments({ data: { status: paymentFilter } }),
    enabled: isAdminAuthenticated,
  });

  const { data: attendanceLogs = [], refetch: refetchAttendance } = useQuery({
    queryKey: ["admin-attendance", attendanceDate],
    queryFn: () => fetchAttendance({ data: { date: attendanceDate } }),
    enabled: isAdminAuthenticated,
  });

  const { data: renewals = [], refetch: refetchRenewals } = useQuery({
    queryKey: ["admin-renewals"],
    queryFn: () => fetchRenewals(),
    enabled: isAdminAuthenticated,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: () => fetchAuditLogs(),
    enabled: isAdminAuthenticated,
  });

  const { data: seatGridData = [] } = useQuery({
    queryKey: ["admin-seats", seatDate, seatSlot],
    queryFn: () => fetchSeatAvail({ data: { date: seatDate, slot: seatSlot } }),
    enabled: isAdminAuthenticated,
  });

  // Mutations
  const admissionMutation = useMutation({
    mutationFn: (opts: { studentIdCode: string; status: "approved" | "rejected"; reason?: string }) =>
      updateAdmission({
        data: {
          studentIdCode: opts.studentIdCode,
          status: opts.status,
          rejectionReason: opts.reason,
          adminEmail: "admin@sgdl.in",
        },
      }),
    onSuccess: () => {
      toast.success("छात्र एडमिशन स्थिति अपडेट हो गई");
      refetchStudents();
      refetchOverview();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const paymentMutation = useMutation({
    mutationFn: (opts: { paymentId: string; status: "verified" | "rejected"; note?: string }) =>
      verifyPayment({
        data: {
          paymentId: opts.paymentId,
          status: opts.status,
          adminNote: opts.note,
          adminEmail: "admin@sgdl.in",
        },
      }),
    onSuccess: () => {
      toast.success("भुगतान सत्यापन स्थिति अपडेट हो गई");
      refetchPayments();
      refetchOverview();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const attendanceMutation = useMutation({
    mutationFn: () =>
      correctAttendance({
        data: {
          studentIdCode: correctionStudentId.trim().toUpperCase(),
          attendanceDate: correctionDate,
          checkInAt: `${correctionDate}T${correctionCheckIn}:00Z`,
          checkOutAt: correctionCheckOut ? `${correctionDate}T${correctionCheckOut}:00Z` : null,
          status: correctionStatus,
          reason: correctionReason.trim(),
          adminEmail: "admin@sgdl.in",
        },
      }),
    onSuccess: () => {
      toast.success("उपस्थिति सुधार दर्ज किया गया");
      setCorrectionReason("");
      refetchAttendance();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const renewalMutation = useMutation({
    mutationFn: (renewalId: string) =>
      approveRenewal({ data: { renewalId, adminEmail: "admin@sgdl.in" } }),
    onSuccess: () => {
      toast.success("नवीनीकरण स्वीकृत एवं सदस्यता 30 दिन बढ़ा दी गई");
      refetchRenewals();
      refetchOverview();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin access PIN for library staff (9852) or passphrase
    if (adminPin === "9852" || adminPin === "admin123" || adminPin === "7061038932") {
      setIsAdminAuthenticated(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sgdl_admin_auth", "true");
      }
      toast.success("व्यवस्थापक के रूप में प्रमाणित!");
    } else {
      toast.error("अमान्य एडमिन पिन (Invalid Admin PIN)");
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("sgdl_admin_auth");
    }
    toast.info("एडमिन लॉगआउट हो गया");
  };

  // CSV Export helpers
  const exportStudentsCsv = () => {
    const headers = "Student_ID,Full_Name,Parent_Name,Mobile,Email,Exam_Goal,Plan,Seat,Admission_Status,Start_Date,End_Date\n";
    const rows = students
      .map(
        (s) =>
          `"${s.studentIdCode}","${s.fullName}","${s.parentName || ""}","${s.mobile}","${s.email}","${s.examGoal || ""}","${s.selectedPlan}","${s.assignedSeatNumber}","${s.admissionStatus}","${s.membershipStartDate}","${s.membershipEndDate}"`,
      )
      .join("\n");
    downloadCsv("sgdl_students.csv", headers + rows);
  };

  const exportPaymentsCsv = () => {
    const headers = "Payment_ID,Student_ID,Name,Mobile,Plan,Amount,UTR,Status,Date,Verified_By\n";
    const rows = payments
      .map(
        (p) =>
          `"${p.id}","${p.studentIdCode}","${p.studentName}","${p.studentMobile}","${p.plan}",${p.amount},"${p.utr || ""}","${p.status}","${p.createdAt}","${p.verifiedBy || ""}"`,
      )
      .join("\n");
    downloadCsv("sgdl_payments.csv", headers + rows);
  };

  const exportAttendanceCsv = () => {
    const headers = "Attendance_ID,Date,Student_ID,Name,Seat,Check_In,Check_Out,Status\n";
    const rows = attendanceLogs
      .map(
        (a) =>
          `"${a.id}","${a.attendanceDate}","${a.studentIdCode}","${a.studentName}","${a.assignedSeat}","${a.checkInAt}","${a.checkOutAt || ""}","${a.status}"`,
      )
      .join("\n");
    downloadCsv("sgdl_attendance.csv", headers + rows);
  };

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} डाउनलोड हो गया`);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {!isAdminAuthenticated ? (
          /* Admin Login Shield */
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-heading text-xl font-bold text-foreground">
              व्यवस्थापक प्रमाणीकरण (Admin Sign-In)
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {LIBRARY.nameEn} के प्रशासनिक नियंत्रण कक्ष में प्रवेश हेतु अपना अधिकृत पिन दर्ज करें।
            </p>

            <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="admin-pin" className="text-xs font-semibold text-muted-foreground">
                  व्यवस्थापक सुरक्षा पिन (Staff PIN: 9852)
                </Label>
                <Input
                  id="admin-pin"
                  type="password"
                  required
                  placeholder="पिन दर्ज करें"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  className="mt-1.5 text-center font-mono text-lg tracking-widest"
                />
              </div>

              <Button type="submit" className="w-full font-semibold">
                प्रवेश करें (Authorize)
              </Button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Shield className="h-4 w-4" /> मास्टर एडमिनिस्ट्रेशन (Master Control)
                </span>
                <h1 className="mt-2 font-heading text-2xl font-bold text-primary sm:text-3xl">
                  {LIBRARY.nameEn} — व्यवस्थापक डैशबोर्ड
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  स्थान: {LIBRARY.address} | हेल्पलाइन: {LIBRARY.phone}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAdminLogout} className="text-xs">
                  <LogOut className="mr-1.5 h-3.5 w-3.5" /> लॉगआउट
                </Button>
              </div>
            </div>

            {/* KPI STAT CARDS */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">कुल छात्र</span>
                <p className="font-heading text-xl font-bold text-foreground">
                  {overview?.totalStudents ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase">लंबित एडमिशन</span>
                <p className="font-heading text-xl font-bold text-amber-700">
                  {overview?.pendingAdmissions ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">सक्रिय सदस्यता</span>
                <p className="font-heading text-xl font-bold text-emerald-700">
                  {overview?.activeMemberships ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-rose-700 uppercase">समाप्त सदस्यता</span>
                <p className="font-heading text-xl font-bold text-rose-700">
                  {overview?.expiredMemberships ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-primary uppercase">आज उपस्थित</span>
                <p className="font-heading text-xl font-bold text-primary">
                  {overview?.todayPresent ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">वर्तमान अंदर</span>
                <p className="font-heading text-xl font-bold text-emerald-700">
                  {overview?.currentlyInside ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-amber-700 uppercase">लंबित फीस</span>
                <p className="font-heading text-xl font-bold text-amber-700">
                  {overview?.pendingPayments ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">कुल संग्रह</span>
                <p className="font-heading text-xl font-bold text-emerald-700">
                  {formatPrice(overview?.totalRevenue ?? 0)}
                </p>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex border-b border-border text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                डैशबोर्ड सारांश (Overview)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("admissions")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "admissions"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                एडमिशन प्रबंधन ({students.filter((s) => s.admissionStatus === "pending").length} लंबित)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("seats")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "seats"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                20-सीट नक्शा (Seat Matrix)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "payments"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                फीस सत्यापन ({payments.filter((p) => p.status === "pending").length} Pending)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("attendance")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "attendance"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                उपस्थिति प्रबंधन (Attendance)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("renewals")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "renewals"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                नवीनीकरण ({renewals.filter((r) => r.status === "pending").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reports")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "reports"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                CSV रिपोर्ट्स (Exports)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "audit"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                ऑडिट लॉग (Audit Trail)
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    सीट उपयोगिता रिपोर्ट (Seat Utilization)
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-medium">
                        <span>मॉर्निंग हाफ उपयोगिता (7 AM - 12 PM):</span>
                        <span className="font-bold">{overview?.morningOccupied ?? 0} / 20 सीटें</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, (((overview?.morningOccupied ?? 0) / 20) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium">
                        <span>सेकंड हाफ उपयोगिता (12 PM - 5 PM):</span>
                        <span className="font-bold">{overview?.secondOccupied ?? 0} / 20 सीटें</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, (((overview?.secondOccupied ?? 0) / 20) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      लाइब्रेरी में कुल 20 फिजिकल सीटें हैं। मॉर्निंग और सेकंड हाफ की बुकिंग ओवरलैप नहीं होती, जबकि फुल-टाइम बुकिंग दोनों हाफ लॉक कर देती है।
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    व्यवस्थापक त्वरित कार्य (Pending Tasks)
                  </h3>
                  <div className="space-y-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("admissions")}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30"
                    >
                      <span>समीक्षा हेतु लंबित एडमिशन</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {overview?.pendingAdmissions ?? 0} Pending
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("payments")}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30"
                    >
                      <span>सत्यापन हेतु लंबित फीस भुगतान</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {overview?.pendingPayments ?? 0} Pending
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("renewals")}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30"
                    >
                      <span>सदस्यता नवीनीकरण अनुरोध</span>
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {overview?.pendingRenewalsCount ?? 0} Pending
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ADMISSIONS */}
            {activeTab === "admissions" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    छात्र प्रवेश आवेदन (Student Admissions)
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="नाम, आईडी या मोबाइल से खोजें"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="h-8 text-xs w-48"
                    />
                    <select
                      aria-label="एडमिशन स्थिति फ़िल्टर"
                      value={admissionFilter}
                      onChange={(e) => setAdmissionFilter(e.target.value)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option value="all">सभी स्थितियां</option>
                      <option value="pending">लंबित (Pending)</option>
                      <option value="approved">स्वीकृत (Approved)</option>
                      <option value="rejected">अस्वीकृत (Rejected)</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">छात्र आईडी</th>
                        <th className="py-2.5 px-3">विद्यार्थी का नाम</th>
                        <th className="py-2.5 px-3">मोबाइल</th>
                        <th className="py-2.5 px-3">सीट</th>
                        <th className="py-2.5 px-3">स्लॉट</th>
                        <th className="py-2.5 px-3">दस्तावेज़</th>
                        <th className="py-2.5 px-3">स्थिति</th>
                        <th className="py-2.5 px-3">कार्रवाई (Action)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">
                            {s.studentIdCode}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">{s.fullName}</td>
                          <td className="py-2.5 px-3 font-mono">{s.mobile}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{s.assignedSeatNumber}</td>
                          <td className="py-2.5 px-3">{MEMBERSHIP_PLANS[s.selectedPlan]?.nameEn}</td>
                          <td className="py-2.5 px-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewStudent(s)}
                              className="h-7 text-xs px-2 gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" /> देखें
                            </Button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                s.admissionStatus === "approved"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : s.admissionStatus === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {s.admissionStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              {s.admissionStatus !== "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    admissionMutation.mutate({
                                      studentIdCode: s.studentIdCode,
                                      status: "approved",
                                    })
                                  }
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  स्वीकृत करें
                                </Button>
                              )}
                              {s.admissionStatus !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const reason = prompt("अस्वीकृति का कारण दर्ज करें:");
                                    if (reason) {
                                      admissionMutation.mutate({
                                        studentIdCode: s.studentIdCode,
                                        status: "rejected",
                                        reason,
                                      });
                                    }
                                  }}
                                  className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  रद्द करें
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: 20-SEAT MATRIX */}
            {activeTab === "seats" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      20 फिजिकल सीटों का लाइव स्टेटस बोर्ड
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      तारीख और स्लॉट के अनुसार सीटों की उपलब्धता व आरक्षण देखें।
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={seatDate}
                      onChange={(e) => setSeatDate(e.target.value)}
                      className="h-8 text-xs w-36"
                    />
                    <select
                      aria-label="स्लॉट चुनें"
                      value={seatSlot}
                      onChange={(e) => setSeatSlot(e.target.value as SlotType)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option value="morning_half">मॉर्निंग हाफ (7 AM - 12 PM)</option>
                      <option value="second_half">सेकंड हाफ (12 PM - 5 PM)</option>
                      <option value="full_time">फुल-टाइम (7 AM - 5 PM)</option>
                    </select>
                  </div>
                </div>

                <SeatGrid
                  seats={seatGridData}
                  selectedSeat={null}
                  onSelectSeat={(seatNum) => {
                    const st = seatGridData.find((s) => s.number === seatNum);
                    alert(
                      st?.isAvailable
                        ? `${seatNum} उपलब्ध है!`
                        : `${seatNum}: ${st?.occupiedReason || "आरक्षित"}`,
                    );
                  }}
                />
              </div>
            )}

            {/* TAB 4: PAYMENT VERIFICATION */}
            {activeTab === "payments" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      शुल्क सत्यापन स्क्रीन (Payment Verification)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      बैंक स्टेटमेंट से UTR मिलाकर [Verify Payment] पर क्लिक करें। केवल अधिकृत एडमिन ही सत्यापित कर सकता है।
                    </p>
                  </div>
                  <select
                    aria-label="भुगतान फ़िल्टर"
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="h-8 text-xs rounded-md border border-input bg-background px-2"
                  >
                    <option value="all">सभी भुगतान</option>
                    <option value="pending">सत्यापन बाकी (Pending)</option>
                    <option value="verified">सत्यापित (Verified)</option>
                    <option value="rejected">अस्वीकृत (Rejected)</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">छात्र आईडी</th>
                        <th className="py-2.5 px-3">नाम</th>
                        <th className="py-2.5 px-3">स्लॉट</th>
                        <th className="py-2.5 px-3">राशि</th>
                        <th className="py-2.5 px-3">UTR / Trans ID</th>
                        <th className="py-2.5 px-3">स्क्रीनशॉट</th>
                        <th className="py-2.5 px-3">स्थिति</th>
                        <th className="py-2.5 px-3">कार्रवाई (Verify/Reject)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">
                            {p.studentIdCode}
                          </td>
                          <td className="py-2.5 px-3 font-medium">{p.studentName}</td>
                          <td className="py-2.5 px-3">{MEMBERSHIP_PLANS[p.plan]?.nameEn}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-700">
                            {formatPrice(p.amount)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold">{p.utr || "जमा नहीं"}</td>
                          <td className="py-2.5 px-3">
                            {p.screenshotUrl ? (
                              <button
                                type="button"
                                onClick={() => setPreviewPayment(p)}
                                className="text-primary underline flex items-center gap-1 font-semibold"
                              >
                                <Eye className="h-3.5 w-3.5" /> देखें
                              </button>
                            ) : (
                              <span className="text-muted-foreground">नहीं दिया</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                p.status === "verified"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : p.status === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              {p.status !== "verified" && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    paymentMutation.mutate({
                                      paymentId: p.id,
                                      status: "verified",
                                      note: "Verified via UPI Statement",
                                    })
                                  }
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  सत्यापित करें
                                </Button>
                              )}
                              {p.status !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const note = prompt("अस्वीकृति का कारण दर्ज करें:");
                                    if (note) {
                                      paymentMutation.mutate({
                                        paymentId: p.id,
                                        status: "rejected",
                                        note,
                                      });
                                    }
                                  }}
                                  className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  अस्वीकृत
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: ATTENDANCE & CORRECTION */}
            {activeTab === "attendance" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <h3 className="font-heading text-base font-bold text-foreground">
                      दैनिक उपस्थिति लॉग (Attendance Records)
                    </h3>
                    <Input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="h-8 text-xs w-36"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3">छात्र आईडी</th>
                          <th className="py-2.5 px-3">नाम</th>
                          <th className="py-2.5 px-3">सीट</th>
                          <th className="py-2.5 px-3">चेक-इन</th>
                          <th className="py-2.5 px-3">चेक-आउट</th>
                          <th className="py-2.5 px-3">स्थिति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {attendanceLogs.map((a) => (
                          <tr key={a.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">
                              {a.studentIdCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium">{a.studentName}</td>
                            <td className="py-2.5 px-3 font-mono">{a.assignedSeat}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700">
                              {new Date(a.checkInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {a.checkOutAt ? new Date(a.checkOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  a.status === "present"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {a.status}
                              </span>
                              {a.isManualCorrection && (
                                <span className="ml-1 text-[9px] text-muted-foreground font-mono">
                                  (Edited)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Manual Attendance Correction Form */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-heading text-sm font-bold text-foreground">
                    उपस्थिति संशोधन (Manual Correction)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    छात्र की उपस्थिति में सुधार करें। प्रत्येक सुधार का कारण ऑडिट लॉग में दर्ज होगा।
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs font-semibold">छात्र आईडी</Label>
                      <Input
                        placeholder="SGDL-2026-00001"
                        value={correctionStudentId}
                        onChange={(e) => setCorrectionStudentId(e.target.value)}
                        className="mt-1 font-mono uppercase text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">तारीख</Label>
                      <Input
                        type="date"
                        value={correctionDate}
                        onChange={(e) => setCorrectionDate(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs font-semibold">चेक-इन समय</Label>
                        <Input
                          type="time"
                          value={correctionCheckIn}
                          onChange={(e) => setCorrectionCheckIn(e.target.value)}
                          className="mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">चेक-आउट समय</Label>
                        <Input
                          type="time"
                          value={correctionCheckOut}
                          onChange={(e) => setCorrectionCheckOut(e.target.value)}
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">सुधार का कारण (Mandatory Reason) *</Label>
                      <Input
                        placeholder="उदा. छात्र चेक-आउट करना भूल गया था"
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <Button
                      onClick={() => attendanceMutation.mutate()}
                      disabled={attendanceMutation.isPending || !correctionStudentId || !correctionReason}
                      className="w-full text-xs font-semibold"
                    >
                      सुधार सहेजें (Save Correction)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RENEWALS */}
            {activeTab === "renewals" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <h3 className="font-heading text-base font-bold text-foreground">
                  सदस्यता नवीनीकरण अनुरोध (Renewal Approvals)
                </h3>
                {renewals.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    वर्तमान में कोई नवीनीकरण अनुरोध लंबित नहीं है।
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                          <th className="py-2.5 px-3">छात्र आईडी</th>
                          <th className="py-2.5 px-3">नाम</th>
                          <th className="py-2.5 px-3">वर्तमान सीट</th>
                          <th className="py-2.5 px-3">अनुरोधित स्लॉट</th>
                          <th className="py-2.5 px-3">UTR</th>
                          <th className="py-2.5 px-3">स्थिति</th>
                          <th className="py-2.5 px-3">कार्रवाई</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {renewals.map((r) => (
                          <tr key={r.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">
                              {r.studentIdCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium">{r.studentName}</td>
                            <td className="py-2.5 px-3 font-mono">{r.currentSeat}</td>
                            <td className="py-2.5 px-3">{MEMBERSHIP_PLANS[r.requestedPlan]?.nameEn}</td>
                            <td className="py-2.5 px-3 font-mono">{r.utr || "जमा नहीं"}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {r.status === "pending" && (
                                <Button
                                  size="sm"
                                  onClick={() => renewalMutation.mutate(r.id)}
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  स्वीकार करें (+30 दिन)
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: CSV EXPORTS */}
            {activeTab === "reports" && (
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground">छात्र डेटाबेस (Students List)</h4>
                  <p className="text-xs text-muted-foreground">
                    सभी पंजीकृत छात्रों के नाम, मोबाइल, पता, स्लॉट और सीट विवरण CSV में डाउनलोड करें।
                  </p>
                  <Button onClick={exportStudentsCsv} className="w-full text-xs font-semibold gap-2">
                    <Download className="h-4 w-4" /> छात्र सूची डाउनलोड करें (CSV)
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground">शुल्क एवं भुगतान (Fee Collection)</h4>
                  <p className="text-xs text-muted-foreground">
                    दैनिक व मासिक फीस कलेक्शन, UTR और सत्यापन स्थिति की विस्तृत रिपोर्ट निर्यात करें।
                  </p>
                  <Button onClick={exportPaymentsCsv} className="w-full text-xs font-semibold gap-2">
                    <Download className="h-4 w-4" /> भुगतान रिपोर्ट डाउनलोड करें (CSV)
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground">उपस्थिति रिपोर्ट (Attendance Report)</h4>
                  <p className="text-xs text-muted-foreground">
                    छात्र चेक-इन व चेक-आउट समय और कुल अध्ययन अवधि की रिपोर्ट एक्सेल/CSV प्रारूप में पाएं।
                  </p>
                  <Button onClick={exportAttendanceCsv} className="w-full text-xs font-semibold gap-2">
                    <Download className="h-4 w-4" /> उपस्थिति रिपोर्ट डाउनलोड करें (CSV)
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 8: AUDIT LOG */}
            {activeTab === "audit" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <h3 className="font-heading text-base font-bold text-foreground">
                  प्रशासनिक ऑडिट ट्रेल (Admin Audit Log)
                </h3>
                <p className="text-xs text-muted-foreground">
                  प्रशासनिक कार्यों का अपरिवर्तनीय इतिहास (एडमिशन स्वीकृति, फीस सत्यापन, उपस्थिति संशोधन)।
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">समय (Timestamp)</th>
                        <th className="py-2.5 px-3">प्रशासक</th>
                        <th className="py-2.5 px-3">क्रिया (Action)</th>
                        <th className="py-2.5 px-3">इकाई</th>
                        <th className="py-2.5 px-3">विवरण (Details)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString("en-IN")}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{log.adminEmail}</td>
                          <td className="py-2.5 px-3 font-bold text-primary">{log.action}</td>
                          <td className="py-2.5 px-3 font-mono">{log.entityId}</td>
                          <td className="py-2.5 px-3 text-[11px] font-mono text-muted-foreground">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Document Preview Modal */}
            {previewStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground">
                        छात्र संपूर्ण विवरण ({previewStudent.studentIdCode})
                      </h3>
                      <p className="text-xs text-muted-foreground">{previewStudent.fullName}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setPreviewStudent(null)}>
                      ✕
                    </Button>
                  </div>

                  {/* Summary Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">छात्र का नाम:</span>
                      <p className="font-semibold text-foreground">{previewStudent.fullName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">पिता/अभिभावक:</span>
                      <p className="font-semibold text-foreground">{previewStudent.parentName || "उपलब्ध नहीं"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">मोबाइल:</span>
                      <p className="font-mono font-medium text-foreground">{previewStudent.mobile}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ईमेल:</span>
                      <p className="font-medium text-foreground truncate">{previewStudent.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">तैयारी लक्ष्य (Goal):</span>
                      <p className="font-semibold text-primary">{previewStudent.examGoal || "General"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">सीट एवं स्लॉट:</span>
                      <p className="font-bold text-foreground">
                        {previewStudent.assignedSeatNumber} ({MEMBERSHIP_PLANS[previewStudent.selectedPlan]?.nameEn})
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">पूरा आवासीय पता:</span>
                      <p className="font-medium text-foreground">{previewStudent.address}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4 text-xs">
                    <div>
                      <p className="font-bold text-muted-foreground mb-1">छात्र पासपोर्ट फोटो:</p>
                      {previewStudent.photoUrl ? (
                        <img
                          src={previewStudent.photoUrl}
                          alt="Photo"
                          className="h-32 w-32 rounded-lg object-cover border border-border shadow-xs"
                        />
                      ) : (
                        <p className="text-muted-foreground">फोटो संलग्न नहीं है</p>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-muted-foreground mb-1">डिजिटल हस्ताक्षर (Signature):</p>
                      {previewStudent.signatureUrl ? (
                        <img
                          src={previewStudent.signatureUrl}
                          alt="Signature"
                          className="h-24 w-60 rounded-lg bg-white p-2 object-contain border border-border shadow-xs"
                        />
                      ) : (
                        <p className="text-muted-foreground">हस्ताक्षर उपलब्ध नहीं है</p>
                      )}
                    </div>

                    <div>
                      <p className="font-bold text-muted-foreground mb-1">पहचान पत्र (ID Proof Document):</p>
                      {previewStudent.idProofUrl ? (
                        <img
                          src={previewStudent.idProofUrl}
                          alt="ID Proof"
                          className="max-h-56 rounded-lg object-contain border border-border shadow-xs"
                        />
                      ) : (
                        <p className="text-muted-foreground">आईडी प्रूफ संलग्न नहीं है</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Screenshot Preview Modal */}
            {previewPayment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h3 className="font-bold text-base text-foreground">
                      पेमेंट स्क्रीनशॉट (UTR: {previewPayment.utr})
                    </h3>
                    <Button size="sm" variant="ghost" onClick={() => setPreviewPayment(null)}>
                      ✕
                    </Button>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <img
                      src={previewPayment.screenshotUrl!}
                      alt="Payment Screenshot"
                      className="max-h-[60vh] rounded-lg object-contain border border-border"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

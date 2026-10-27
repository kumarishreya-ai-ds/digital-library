import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
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
  Edit,
  UserX,
  AlertTriangle,
  RefreshCw,
  Printer,
  ChevronRight,
  Filter,
  Phone,
  Mail,
  MapPin,
  Award,
  Trash2,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { SeatGrid } from "@/components/SeatGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LIBRARY,
  MEMBERSHIP_PLANS,
  PHYSICAL_SEATS,
  formatPrice,
  type SlotType,
} from "@/lib/library.ts";
import {
  getAdminSetupStatusFn,
  setupInitialAdminFn,
  loginAdminFn,
  logoutAdminFn,
  verifyAdminTokenFn,
  getAdminOverviewFn,
  getAdminStudentsFn,
  updateStudentDetailsFn,
  suspendStudentFn,
  reactivateStudentFn,
  deactivateStudentFn,
  deleteStudentPermanentlyFn,
  updateAdmissionStatusFn,
  reassignSeatFn,
  cancelBookingFn,
  getAdminPaymentsFn,
  verifyPaymentFn,
  getAdminAttendanceFn,
  correctAttendanceFn,
  getAdminRenewalsFn,
  approveRenewalFn,
  getAdminAuditLogsFn,
  getAdminBookingsFn,
  getAdminSettingsFn,
  updateAdminSettingsFn,
  exportAdminDataFn,
  getSeatAvailabilityFn,
} from "@/lib/library.functions.ts";
import type {
  StudentRecord,
  PaymentRecord,
  AttendanceRecord,
  BookingRecord,
  AuditLogRecord,
} from "@/lib/server-store.ts";

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
  const [adminToken, setAdminToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("sgdl_admin_token") || "";
    }
    return "";
  });

  const [adminUser, setAdminUser] = useState<{ email: string; fullName: string; role: string } | null>(() => {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("sgdl_admin_user");
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "seats" | "payments" | "attendance" | "renewals" | "settings" | "reports" | "audit"
  >("overview");

  // Auth Screen Toggle ("login" or "setup")
  const [authMode, setAuthMode] = useState<"login" | "setup">("login");

  // Auth Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [setupFullName, setSetupFullName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");

  // Search and filter states
  const [studentSearch, setStudentSearch] = useState("");
  const [admissionFilter, setAdmissionFilter] = useState("all");
  const [membershipFilter, setMembershipFilter] = useState("all");
  const [includeDeactivated, setIncludeDeactivated] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));

  // Seat tab state
  const [seatSlot, setSeatSlot] = useState<SlotType>("morning_half");
  const [seatDate, setSeatDate] = useState(new Date().toISOString().slice(0, 10));

  // Modals & interaction dialog states
  const [previewStudent, setPreviewStudent] = useState<StudentRecord | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [suspendingStudent, setSuspendingStudent] = useState<StudentRecord | null>(null);
  const [deactivatingStudent, setDeactivatingStudent] = useState<StudentRecord | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentRecord | null>(null);
  const [deleteConfirmationCode, setDeleteConfirmationCode] = useState("");
  const [rejectingAdmission, setRejectingAdmission] = useState<StudentRecord | null>(null);
  const [reassigningStudent, setReassigningStudent] = useState<StudentRecord | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<{ bookingCode: string; seat: string } | null>(null);
  const [previewPayment, setPreviewPayment] = useState<PaymentRecord | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRecord | null>(null);
  const [modalReason, setModalReason] = useState("");
  const [targetSeat, setTargetSeat] = useState("Seat 01");

  // Edit Student Form State
  const [editFullName, setEditFullName] = useState("");
  const [editParentName, setEditParentName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editExamGoal, setEditExamGoal] = useState("");
  const [editSeat, setEditSeat] = useState("Seat 01");
  const [editPlan, setEditPlan] = useState<SlotType>("morning_half");

  useEffect(() => {
    if (editingStudent) {
      setEditFullName(editingStudent.fullName || "");
      setEditParentName(editingStudent.parentName || "");
      setEditMobile(editingStudent.mobile || "");
      setEditEmail(editingStudent.email || "");
      setEditAddress(editingStudent.address || "");
      setEditExamGoal(editingStudent.examGoal || "");
      setEditSeat(editingStudent.assignedSeatNumber || "Seat 01");
      setEditPlan(editingStudent.selectedPlan || "morning_half");
    }
  }, [editingStudent]);

  // Attendance correction form state
  const [correctionStudentId, setCorrectionStudentId] = useState("");
  const [correctionDate, setCorrectionDate] = useState(new Date().toISOString().slice(0, 10));
  const [correctionCheckIn, setCorrectionCheckIn] = useState("08:00");
  const [correctionCheckOut, setCorrectionCheckOut] = useState("12:00");
  const [correctionStatus, setCorrectionStatus] = useState<"present" | "incomplete" | "absent">("present");
  const [correctionReason, setCorrectionReason] = useState("");

  // Settings form state
  const [formUpi, setFormUpi] = useState(LIBRARY.upiId);
  const [formReceiverName, setFormReceiverName] = useState("Kumari Shreya / Shree Ganesh Digital Library");
  const [formPhone, setFormPhone] = useState(LIBRARY.phone);
  const [formEmail, setFormEmail] = useState(LIBRARY.email);
  const [formAddress, setFormAddress] = useState(LIBRARY.address);
  const [formHalfPrice, setFormHalfPrice] = useState(400);
  const [formFullPrice, setFormFullPrice] = useState(700);
  const [formTimings, setFormTimings] = useState("प्रातः 07:00 बजे से सायं 05:00 बजे तक");
  const [formOwnerName, setFormOwnerName] = useState("Kumari Shreya");

  // Server functions
  const fetchSetupStatus = useServerFn(getAdminSetupStatusFn);
  const setupAdmin = useServerFn(setupInitialAdminFn);
  const loginAdmin = useServerFn(loginAdminFn);
  const logoutAdmin = useServerFn(logoutAdminFn);
  const verifyToken = useServerFn(verifyAdminTokenFn);
  const fetchOverview = useServerFn(getAdminOverviewFn);
  const fetchStudents = useServerFn(getAdminStudentsFn);
  const updateStudentDetails = useServerFn(updateStudentDetailsFn);
  const suspendStudent = useServerFn(suspendStudentFn);
  const reactivateStudent = useServerFn(reactivateStudentFn);
  const deactivateStudent = useServerFn(deactivateStudentFn);
  const deletePermanently = useServerFn(deleteStudentPermanentlyFn);
  const updateAdmission = useServerFn(updateAdmissionStatusFn);
  const reassignSeat = useServerFn(reassignSeatFn);
  const cancelBooking = useServerFn(cancelBookingFn);
  const fetchPayments = useServerFn(getAdminPaymentsFn);
  const verifyPayment = useServerFn(verifyPaymentFn);
  const fetchAttendance = useServerFn(getAdminAttendanceFn);
  const correctAttendance = useServerFn(correctAttendanceFn);
  const fetchRenewals = useServerFn(getAdminRenewalsFn);
  const approveRenewal = useServerFn(approveRenewalFn);
  const fetchAuditLogs = useServerFn(getAdminAuditLogsFn);
  const fetchBookings = useServerFn(getAdminBookingsFn);
  const fetchSettings = useServerFn(getAdminSettingsFn);
  const updateSettings = useServerFn(updateAdminSettingsFn);
  const exportData = useServerFn(exportAdminDataFn);
  const fetchSeatAvail = useServerFn(getSeatAvailabilityFn);

  // Initial setup check
  const { data: setupStatus, isLoading: isCheckingSetup, refetch: refetchSetupStatus } = useQuery({
    queryKey: ["admin-setup-status"],
    queryFn: () => fetchSetupStatus(),
  });
  const isSetupNeeded = setupStatus?.isSetupNeeded ?? false;

  useEffect(() => {
    if (isSetupNeeded) {
      setAuthMode("setup");
    }
  }, [isSetupNeeded]);

  // Session verification on mount
  useEffect(() => {
    if (adminToken) {
      verifyToken({ data: { adminToken } })
        .then((res) => {
          if (res.admin) setAdminUser(res.admin);
        })
        .catch(() => {
          setAdminToken("");
          setAdminUser(null);
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("sgdl_admin_token");
            sessionStorage.removeItem("sgdl_admin_user");
          }
        });
    }
  }, [adminToken]);

  const isAuthenticated = !!adminToken;

  // Queries (enabled only when authenticated)
  const { data: overview, refetch: refetchOverview } = useQuery({
    queryKey: ["admin-overview", adminToken],
    queryFn: () => fetchOverview({ data: { adminToken } }),
    enabled: isAuthenticated,
  });

  const { data: students = [], refetch: refetchStudents } = useQuery({
    queryKey: ["admin-students", adminToken, studentSearch, admissionFilter, membershipFilter, includeDeactivated],
    queryFn: () =>
      fetchStudents({
        data: {
          adminToken,
          search: studentSearch,
          status: admissionFilter,
          membershipStatus: membershipFilter,
          includeDeactivated,
        },
      }),
    enabled: isAuthenticated,
  });

  const { data: payments = [], refetch: refetchPayments } = useQuery({
    queryKey: ["admin-payments", adminToken, paymentFilter, paymentSearch],
    queryFn: () =>
      fetchPayments({
        data: {
          adminToken,
          status: paymentFilter,
          search: paymentSearch,
        },
      }),
    enabled: isAuthenticated,
  });

  const { data: attendanceLogs = [], refetch: refetchAttendance } = useQuery({
    queryKey: ["admin-attendance", adminToken, attendanceDate],
    queryFn: () => fetchAttendance({ data: { adminToken, date: attendanceDate } }),
    enabled: isAuthenticated,
  });

  const { data: renewals = [], refetch: refetchRenewals } = useQuery({
    queryKey: ["admin-renewals", adminToken],
    queryFn: () => fetchRenewals({ data: { adminToken } }),
    enabled: isAuthenticated,
  });

  const { data: auditLogs = [], refetch: refetchAuditLogs } = useQuery({
    queryKey: ["admin-audit-logs", adminToken],
    queryFn: () => fetchAuditLogs({ data: { adminToken } }),
    enabled: isAuthenticated,
  });

  const { data: bookingsList = [], refetch: refetchBookings } = useQuery({
    queryKey: ["admin-bookings", adminToken],
    queryFn: () => fetchBookings({ data: { adminToken } }),
    enabled: isAuthenticated,
  });

  const { data: adminSettings, refetch: refetchSettings } = useQuery({
    queryKey: ["admin-settings", adminToken],
    queryFn: () => fetchSettings({ data: { adminToken } }),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (adminSettings) {
      if (adminSettings.upiId) setFormUpi(adminSettings.upiId);
      if (adminSettings.receiverName) setFormReceiverName(adminSettings.receiverName);
      if (adminSettings.contactPhone) setFormPhone(adminSettings.contactPhone);
      if (adminSettings.contactEmail) setFormEmail(adminSettings.contactEmail);
      if (adminSettings.address) setFormAddress(adminSettings.address);
      if (adminSettings.halfDayPrice) setFormHalfPrice(adminSettings.halfDayPrice);
      if (adminSettings.fullDayPrice) setFormFullPrice(adminSettings.fullDayPrice);
      if (adminSettings.timings) setFormTimings(adminSettings.timings);
      if (adminSettings.ownerName) setFormOwnerName(adminSettings.ownerName);
    }
  }, [adminSettings]);

  const { data: seatGridData = [] } = useQuery({
    queryKey: ["admin-seats", seatDate, seatSlot],
    queryFn: () => fetchSeatAvail({ data: { date: seatDate, slot: seatSlot } }),
    enabled: isAuthenticated,
  });

  // Auth Mutations
  const setupMutation = useMutation({
    mutationFn: (data: { email: string; fullName: string; password: string }) =>
      setupAdmin({ data }),
    onSuccess: (res) => {
      setAdminToken(res.token);
      setAdminUser(res.admin);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sgdl_admin_token", res.token);
        sessionStorage.setItem("sgdl_admin_user", JSON.stringify(res.admin));
      }
      toast.success("मुख्य व्यवस्थापक खाता सफलतापूर्वक बन गया!");
      refetchSetupStatus();
    },
    onError: (err: Error) => toast.error(err.message || "खाता निर्माण में त्रुटि"),
  });

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      loginAdmin({ data }),
    onSuccess: (res) => {
      setAdminToken(res.token);
      setAdminUser(res.admin);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sgdl_admin_token", res.token);
        sessionStorage.setItem("sgdl_admin_user", JSON.stringify(res.admin));
      }
      toast.success("व्यवस्थापक के रूप में प्रमाणित!");
    },
    onError: (err: Error) => toast.error(err.message || "अमान्य ईमेल या पासवर्ड"),
  });

  const handleLogout = () => {
    logoutAdmin({ data: { adminToken } }).finally(() => {
      setAdminToken("");
      setAdminUser(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("sgdl_admin_token");
        sessionStorage.removeItem("sgdl_admin_user");
      }
      toast.info("सत्र समाप्त एवं व्यवस्थापक लॉगआउट सफल");
    });
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPassword !== setupConfirmPassword) {
      toast.error("पासवर्ड और पुष्टि पासवर्ड मेल नहीं खा रहे");
      return;
    }
    setupMutation.mutate({
      email: setupEmail,
      fullName: setupFullName,
      password: setupPassword,
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: loginEmail,
      password: loginPassword,
    });
  };

  // Student Mutations
  const editStudentMutation = useMutation({
    mutationFn: (data: {
      studentIdCode: string;
      fullName?: string;
      parentName?: string | null;
      mobile?: string;
      email?: string;
      address?: string;
      examGoal?: string | null;
      assignedSeatNumber?: string;
      selectedPlan?: SlotType;
    }) => updateStudentDetails({ data: { adminToken, ...data } }),
    onSuccess: () => {
      toast.success("छात्र विवरण सफलतापूर्वक अपडेट किया गया");
      setEditingStudent(null);
      refetchStudents();
      refetchOverview();
      refetchBookings();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const suspendMutation = useMutation({
    mutationFn: (data: { studentIdCode: string; reason: string }) =>
      suspendStudent({ data: { adminToken, ...data } }),
    onSuccess: () => {
      toast.success("छात्र सदस्यता निलंबित कर दी गई");
      setSuspendingStudent(null);
      setModalReason("");
      refetchStudents();
      refetchOverview();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: (studentIdCode: string) =>
      reactivateStudent({ data: { adminToken, studentIdCode } }),
    onSuccess: () => {
      toast.success("छात्र सदस्यता पुनः सक्रिय कर दी गई");
      refetchStudents();
      refetchOverview();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: (data: { studentIdCode: string; reason: string }) =>
      deactivateStudent({ data: { adminToken, ...data } }),
    onSuccess: () => {
      toast.success("छात्र रिकॉर्ड सुरक्षित निष्क्रिय किया गया एवं सीट तुरंत खाली हो गई");
      setDeactivatingStudent(null);
      setModalReason("");
      refetchStudents();
      refetchOverview();
      refetchBookings();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deletePermanentMutation = useMutation({
    mutationFn: (data: { studentIdCode: string; confirmationCode: string; reason: string }) =>
      deletePermanently({ data: { adminToken, ...data } }),
    onSuccess: (res) => {
      toast.success(res.message);
      setDeletingStudent(null);
      setDeleteConfirmationCode("");
      setModalReason("");
      refetchStudents();
      refetchOverview();
      refetchBookings();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const admissionMutation = useMutation({
    mutationFn: (opts: { studentIdCode: string; status: "approved" | "rejected"; reason?: string }) =>
      updateAdmission({
        data: {
          adminToken,
          studentIdCode: opts.studentIdCode,
          status: opts.status,
          rejectionReason: opts.reason,
        },
      }),
    onSuccess: () => {
      toast.success("छात्र एडमिशन स्थिति अपडेट हो गई");
      setRejectingAdmission(null);
      setModalReason("");
      refetchStudents();
      refetchOverview();
      refetchBookings();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Seat Mutations
  const reassignSeatMutation = useMutation({
    mutationFn: (data: { studentIdCode: string; newSeatNumber: string; reason: string }) =>
      reassignSeat({ data: { adminToken, ...data } }),
    onSuccess: () => {
      toast.success("सीट सफलतापूर्वक पुनर्वितरित कर दी गई");
      setReassigningStudent(null);
      setModalReason("");
      refetchStudents();
      refetchOverview();
      refetchBookings();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (data: { bookingCode: string; reason: string }) =>
      cancelBooking({ data: { adminToken, ...data } }),
    onSuccess: () => {
      toast.success("सीट बुकिंग रद्द कर दी गई");
      setCancellingBooking(null);
      setModalReason("");
      refetchOverview();
      refetchBookings();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Payment Mutation
  const paymentMutation = useMutation({
    mutationFn: (opts: { paymentId: string; status: "verified" | "rejected"; note?: string }) =>
      verifyPayment({
        data: {
          adminToken,
          paymentId: opts.paymentId,
          status: opts.status,
          adminNote: opts.note,
        },
      }),
    onSuccess: () => {
      toast.success("भुगतान स्थिति अपडेट हो गई एवं रसीद सक्षम की गई");
      setRejectingPayment(null);
      setModalReason("");
      refetchPayments();
      refetchStudents();
      refetchOverview();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Attendance Mutation
  const attendanceMutation = useMutation({
    mutationFn: () =>
      correctAttendance({
        data: {
          adminToken,
          studentIdCode: correctionStudentId.trim().toUpperCase(),
          attendanceDate: correctionDate,
          checkInAt: `${correctionDate}T${correctionCheckIn}:00Z`,
          checkOutAt: correctionCheckOut ? `${correctionDate}T${correctionCheckOut}:00Z` : null,
          status: correctionStatus,
          reason: correctionReason.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("उपस्थिति सुधार दर्ज किया गया");
      setCorrectionReason("");
      refetchAttendance();
      refetchOverview();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Renewal Mutation
  const renewalMutation = useMutation({
    mutationFn: (renewalId: string) =>
      approveRenewal({ data: { adminToken, renewalId } }),
    onSuccess: () => {
      toast.success("नवीनीकरण स्वीकृत एवं सदस्यता 30 दिन बढ़ा दी गई");
      refetchRenewals();
      refetchOverview();
      refetchStudents();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Settings Mutation
  const settingsMutation = useMutation({
    mutationFn: (updates: {
      upiId?: string;
      receiverName?: string;
      halfDayPrice?: number;
      fullDayPrice?: number;
      address?: string;
      timings?: string;
      ownerName?: string;
      contactPhone?: string;
      contactEmail?: string;
    }) => updateSettings({ data: { adminToken, ...updates } }),
    onSuccess: () => {
      toast.success("लाइब्रेरी सेटिंग्स सफलतापूर्वक अपडेट की गईं");
      refetchOverview();
      refetchSettings();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Protected CSV Export helper
  const handleExport = (type: "students" | "payments" | "attendance" | "bookings") => {
    exportData({ data: { adminToken, type } })
      .then((res) => {
        const blob = new Blob([res.content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", res.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${res.filename} डाउनलोड हो गया`);
      })
      .catch((err: Error) => toast.error(err.message));
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {!isAuthenticated ? (
          /* Secure Admin Authentication Barrier */
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Shield className="h-7 w-7" />
              </div>

              <h1 className="mt-3 font-heading text-xl font-bold text-foreground">
                प्रशासनिक नियंत्रण कक्ष (Admin Control)
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {LIBRARY.nameEn} के प्रशासनिक कार्यों हेतु अधिकृत व्यवस्थापक प्रमाणीकरण अनिवार्य है।
              </p>

              {/* Mode Toggle Pills */}
              <div className="mt-5 flex rounded-lg border border-border bg-muted/40 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`flex-1 rounded-md py-1.5 transition-all ${
                    authMode === "login"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  व्यवस्थापक लॉगिन (Sign In)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("setup")}
                  className={`flex-1 rounded-md py-1.5 transition-all ${
                    authMode === "setup"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  नया व्यवस्थापक सेटअप {isSetupNeeded && "(आवश्यक)"}
                </button>
              </div>
            </div>

            {authMode === "setup" ? (
              /* Phase 1: First-Time Admin Account Setup */
              <div className="mt-6">
                <div className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 border border-amber-500/20">
                  <span className="font-bold">प्रथम व्यवस्थापक सेटअप:</span> मुख्य प्रशासनिक पासवर्ड कॉन्फ़िगर करें। एक बार खाता बनने के बाद यह विंडो सुरक्षित रूप से लॉक हो जाएगी।
                </div>

                <form onSubmit={handleSetupSubmit} className="mt-4 space-y-3.5 text-left">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">व्यवस्थापक का पूरा नाम</Label>
                    <Input
                      type="text"
                      required
                      placeholder="उदा. Kumari Shreya"
                      value={setupFullName}
                      onChange={(e) => setSetupFullName(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">आधिकारिक ईमेल आईडी</Label>
                    <Input
                      type="email"
                      required
                      placeholder="admin@shreeganeshdigitallibrary.in"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">सुरक्षित पासवर्ड (कम से कम 8 अक्षर, अक्षर + अंक)</Label>
                    <Input
                      type="password"
                      required
                      placeholder="कम से कम 8 अक्षर"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">पासवर्ड की पुष्टि करें</Label>
                    <Input
                      type="password"
                      required
                      placeholder="पासवर्ड पुनः दर्ज करें"
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={setupMutation.isPending}
                    className="w-full font-semibold mt-3"
                  >
                    {setupMutation.isPending ? "खाता बन रहा है..." : "खाता बनाएं एवं प्रवेश करें"}
                  </Button>
                </form>
              </div>
            ) : (
              /* Phase 1: Secure Admin Login */
              <div className="mt-6">
                {isSetupNeeded && (
                  <div className="mb-4 rounded-lg bg-primary/10 p-3 text-xs text-primary border border-primary/20 flex items-start gap-2">
                    <Key className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>प्रथम बार उपयोग?</strong> अभी तक कोई व्यवस्थापक पंजीकृत नहीं है।{" "}
                      <button
                        type="button"
                        onClick={() => setAuthMode("setup")}
                        className="font-bold underline cursor-pointer"
                      >
                        नया व्यवस्थापक सेटअप खोलें
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">व्यवस्थापक ईमेल (Admin Email)</Label>
                    <Input
                      type="email"
                      required
                      placeholder="admin@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">पासवर्ड (Password)</Label>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full font-semibold"
                  >
                    {loginMutation.isPending ? "सत्यापन हो रहा है..." : "प्रवेश करें (Authorize)"}
                  </Button>
                </form>
              </div>
            )}
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

              <div className="flex items-center gap-3">
                {adminUser && (
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-foreground">{adminUser.fullName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {adminUser.role.toUpperCase()} • {adminUser.email}
                    </span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs">
                  <LogOut className="mr-1.5 h-3.5 w-3.5" /> लॉगआउट
                </Button>
              </div>
            </div>

            {/* KPI STAT CARDS (All 10 Real Database Statistics) */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
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
                <span className="text-[10px] font-bold text-emerald-700 uppercase">सक्रिय सदस्य</span>
                <p className="font-heading text-xl font-bold text-emerald-700">
                  {overview?.activeMemberships ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-rose-700 uppercase">समाप्त सदस्य</span>
                <p className="font-heading text-xl font-bold text-rose-700">
                  {overview?.expiredMemberships ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-orange-600 uppercase">निलंबित छात्र</span>
                <p className="font-heading text-xl font-bold text-orange-600">
                  {overview?.suspendedMemberships ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-primary uppercase">20 सीटें / उपलब्ध</span>
                <p className="font-heading text-xl font-bold text-primary">
                  {overview?.availableSeats ?? 20} <span className="text-xs text-muted-foreground font-normal">/ 20</span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-indigo-600 uppercase">आज उपस्थित</span>
                <p className="font-heading text-xl font-bold text-indigo-600">
                  {overview?.todayPresent ?? 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-3 text-center shadow-xs">
                <span className="text-[10px] font-bold text-teal-600 uppercase">वर्तमान अंदर</span>
                <p className="font-heading text-xl font-bold text-teal-600">
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
                <p className="font-heading text-base font-bold text-emerald-700 truncate">
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
                onClick={() => setActiveTab("students")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "students"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                छात्र प्रबंधन ({students.length} छात्र)
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
                20-सीट नक्शा एवं बुकिंग ({overview?.availableSeats ?? 20} रिक्त)
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
                फीस सत्यापन ({payments.filter((p) => p.status === "pending").length} लंबित)
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
                उपस्थिति प्रबंधन ({attendanceLogs.length} आज)
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
                onClick={() => setActiveTab("settings")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "settings"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                लाइब्रेरी सेटिंग्स (Settings)
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
                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between font-medium">
                        <span>मॉर्निंग हाफ उपयोगिता (7 AM - 12 PM):</span>
                        <span className="font-bold">{overview?.morningOccupied ?? 0} / 20 सीटें</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-primary transition-all duration-300"
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
                      <div className="mt-1 h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-primary transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (((overview?.secondOccupied ?? 0) / 20) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-medium">
                        <span>फुल-टाइम ऑक्यूपाइड (7 AM - 5 PM):</span>
                        <span className="font-bold">{overview?.fullTimeOccupied ?? 0} / 20 सीटें</span>
                      </div>
                      <div className="mt-1 h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-emerald-600 transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (((overview?.fullTimeOccupied ?? 0) / 20) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      लाइब्रेरी में कुल 20 फिजिकल सीटें निश्चित हैं। मॉर्निंग और सेकंड हाफ की बुकिंग स्वतंत्र रहती है, जबकि फुल-टाइम बुकिंग दोनों हाफ लॉक कर देती है।
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
                      onClick={() => {
                        setActiveTab("students");
                        setAdmissionFilter("pending");
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer"
                    >
                      <span>समीक्षा हेतु लंबित एडमिशन आवेदन</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {overview?.pendingAdmissions ?? 0} Pending
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("payments");
                        setPaymentFilter("pending");
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer"
                    >
                      <span>सत्यापन हेतु लंबित फीस भुगतान (UTR)</span>
                      <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        {overview?.pendingPayments ?? 0} Pending
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("renewals")}
                      className="flex w-full items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 cursor-pointer"
                    >
                      <span>सदस्यता नवीनीकरण अनुरोध (+30 दिन)</span>
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {overview?.pendingRenewalsCount ?? 0} Pending
                      </span>
                    </button>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                    <span className="font-bold text-foreground">मासिक वित्तीय सारांश:</span>
                    <div className="flex justify-between text-muted-foreground">
                      <span>चालू माह का सत्यापित संग्रह:</span>
                      <span className="font-bold text-emerald-700">{formatPrice(overview?.monthlyRevenue ?? 0)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>सर्वकालिक कुल संग्रह:</span>
                      <span className="font-bold text-foreground">{formatPrice(overview?.totalRevenue ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPREHENSIVE STUDENT MANAGEMENT */}
            {activeTab === "students" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-base font-bold text-foreground">
                      छात्र प्रबंधन संदर्शिका (Student Directory & Lifecycle)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      छात्र प्रोफाइल संपादन, दस्तावेज़ सत्यापन, एडमिशन अनुमोदन, निलंबन, सुरक्षित निष्क्रियीकरण एवं स्थाई विलोपन।
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      placeholder="नाम, आईडी, मोबाइल, अभिभावक या लक्ष्य..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="h-8 text-xs w-56"
                    />
                    <select
                      aria-label="एडमिशन फ़िल्टर"
                      value={admissionFilter}
                      onChange={(e) => setAdmissionFilter(e.target.value)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option value="all">सभी एडमिशन स्थितियां</option>
                      <option value="pending">लंबित (Pending)</option>
                      <option value="approved">स्वीकृत (Approved)</option>
                      <option value="rejected">अस्वीकृत (Rejected)</option>
                    </select>

                    <select
                      aria-label="सदस्यता फ़िल्टर"
                      value={membershipFilter}
                      onChange={(e) => setMembershipFilter(e.target.value)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2"
                    >
                      <option value="all">सभी सदस्यता स्थितियां</option>
                      <option value="active">सक्रिय (Active)</option>
                      <option value="expired">समाप्त (Expired)</option>
                      <option value="suspended">निलंबित (Suspended)</option>
                    </select>

                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer ml-2">
                      <input
                        type="checkbox"
                        checked={includeDeactivated}
                        onChange={(e) => setIncludeDeactivated(e.target.checked)}
                        className="rounded border-border text-primary"
                      />
                      <span>निष्क्रिय छात्र देखें</span>
                    </label>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">छात्र आईडी</th>
                        <th className="py-2.5 px-3">विद्यार्थी का नाम</th>
                        <th className="py-2.5 px-3">पिता/अभिभावक</th>
                        <th className="py-2.5 px-3">मोबाइल</th>
                        <th className="py-2.5 px-3">सीट एवं स्लॉट</th>
                        <th className="py-2.5 px-3">लक्ष्य</th>
                        <th className="py-2.5 px-3">एडमिशन</th>
                        <th className="py-2.5 px-3">सदस्यता</th>
                        <th className="py-2.5 px-3">कार्रवाई (Actions)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map((s) => (
                        <tr key={s.id} className={`hover:bg-muted/20 ${s.isDeactivated ? "bg-muted/10 opacity-70" : ""}`}>
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">
                            {s.studentIdCode}
                            {s.isDeactivated && (
                              <span className="block text-[9px] text-rose-600 font-sans">
                                (निष्क्रिय)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {s.fullName}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {s.parentName || "-"}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{s.mobile}</td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className="font-bold text-foreground">{s.assignedSeatNumber || "अनावंटित"}</span>
                            <span className="block text-[10px] text-muted-foreground font-sans">
                              {MEMBERSHIP_PLANS[s.selectedPlan]?.nameEn || s.selectedPlan}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">{s.examGoal || "-"}</td>
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
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                s.membershipStatus === "active"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : s.membershipStatus === "suspended"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {s.membershipStatus}
                            </span>
                            <span className="block text-[10px] text-muted-foreground font-mono">
                              वैध: {s.membershipEndDate.slice(0, 10)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* Inspect Docs */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPreviewStudent(s)}
                                className="h-6 text-[11px] px-2 gap-1 cursor-pointer"
                                title="दस्तावेज़ एवं फ़ोटो देखें"
                              >
                                <Eye className="h-3 w-3" /> दस्तावेज़
                              </Button>

                              {/* Edit Profile */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingStudent(s)}
                                className="h-6 text-[11px] px-2 gap-1 cursor-pointer"
                                title="विवरण संपादित करें"
                              >
                                <Edit className="h-3 w-3" /> संपादित
                              </Button>

                              {/* Admission Approval / Rejection */}
                              {s.admissionStatus === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      admissionMutation.mutate({
                                        studentIdCode: s.studentIdCode,
                                        status: "approved",
                                      })
                                    }
                                    className="h-6 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  >
                                    स्वीकृत
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRejectingAdmission(s);
                                      setModalReason("");
                                    }}
                                    className="h-6 text-[11px] px-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  >
                                    अस्वीकार
                                  </Button>
                                </>
                              )}

                              {/* Suspend / Reactivate */}
                              {s.admissionStatus === "approved" && (
                                <>
                                  {s.membershipStatus === "suspended" || s.isDeactivated ? (
                                    <Button
                                      size="sm"
                                      onClick={() => reactivateMutation.mutate(s.studentIdCode)}
                                      className="h-6 text-[11px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                    >
                                      पुनः सक्रिय
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSuspendingStudent(s);
                                        setModalReason("");
                                      }}
                                      className="h-6 text-[11px] px-2 text-orange-600 hover:bg-orange-50 cursor-pointer"
                                    >
                                      निलंबित
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* Reassign Seat */}
                              {!s.isDeactivated && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setReassigningStudent(s);
                                    setTargetSeat(s.assignedSeatNumber || "Seat 01");
                                    setModalReason("");
                                  }}
                                  className="h-6 text-[11px] px-1.5 text-primary hover:bg-primary/10 cursor-pointer"
                                >
                                  सीट बदलें
                                </Button>
                              )}

                              {/* Option A: Soft Deactivate (Preferred) */}
                              {!s.isDeactivated && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setDeactivatingStudent(s);
                                    setModalReason("");
                                  }}
                                  className="h-6 text-[11px] px-1.5 text-amber-700 hover:bg-amber-50 cursor-pointer"
                                  title="छात्र को सुरक्षित निष्क्रिय करें एवं सीट खाली करें (वित्तीय व उपस्थिति रिकॉर्ड सुरक्षित)"
                                >
                                  निष्क्रिय
                                </Button>
                              )}

                              {/* Option B: Permanent Delete */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setDeletingStudent(s);
                                  setDeleteConfirmationCode("");
                                  setModalReason("");
                                }}
                                className="h-6 text-[11px] px-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="छात्र रिकॉर्ड को स्थाई रूप से हटाएं"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: 20-SEAT MATRIX & RESERVATIONS */}
            {activeTab === "seats" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground">
                        20 फिजिकल सीटों का लाइव स्टेटस बोर्ड (Physical Desk Matrix)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        तारीख एवं स्लॉट अनुसार सीटों की उपलब्धता व आरक्षण देखें।
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

                {/* Active Seat Bookings Table */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground">
                        सक्रिय सीट आरक्षण एवं आवंटन सूची (Active Seat Allocations)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        सीटों का पुनर्वितरण अथवा निरस्तीकरण यहां से सुरक्षित रूप से किया जा सकता है।
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3">बुकिंग कोड</th>
                          <th className="py-2.5 px-3">सीट नंबर</th>
                          <th className="py-2.5 px-3">विद्यार्थी का नाम</th>
                          <th className="py-2.5 px-3">स्लॉट</th>
                          <th className="py-2.5 px-3">तारीख / वैधता</th>
                          <th className="py-2.5 px-3">स्थिति</th>
                          <th className="py-2.5 px-3">कार्रवाई (Manage)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {bookingsList.map((b) => (
                          <tr key={b.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">
                              {b.bookingCode}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                              {b.seatNumber}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-foreground">
                              {b.studentName}
                            </td>
                            <td className="py-2.5 px-3">
                              {MEMBERSHIP_PLANS[b.slot]?.nameEn || b.slot}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">
                              {b.bookingDate}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  b.status === "confirmed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : b.status === "cancelled"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                {b.status !== "cancelled" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCancellingBooking({ bookingCode: b.bookingCode, seat: b.seatNumber });
                                      setModalReason("");
                                    }}
                                    className="h-6 text-[11px] px-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  >
                                    बुकिंग रद्द करें
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
              </div>
            )}

            {/* TAB 4: PAYMENT VERIFICATION */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">कुल सत्यापित संग्रह</span>
                    <p className="font-heading text-xl font-bold text-emerald-700">
                      {formatPrice(overview?.totalRevenue ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">चालू माह का संग्रह</span>
                    <p className="font-heading text-xl font-bold text-emerald-700">
                      {formatPrice(overview?.monthlyRevenue ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">सत्यापन हेतु लंबित</span>
                    <p className="font-heading text-xl font-bold text-amber-700">
                      {overview?.pendingPayments ?? 0} भुगतान
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground">
                        शुल्क सत्यापन स्क्रीन (Payment Verification Ledger)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        बैंक स्टेटमेंट / UPI ऐप से UTR मिलाकर सत्यापित करें। केवल अधिकृत एडमिन ही सत्यापित कर सकता है।
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="UTR, छात्र नाम या आईडी खोजें..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        className="h-8 text-xs w-48"
                      />
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
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3">छात्र आईडी</th>
                          <th className="py-2.5 px-3">नाम</th>
                          <th className="py-2.5 px-3">स्लॉट</th>
                          <th className="py-2.5 px-3">राशि</th>
                          <th className="py-2.5 px-3">UTR / Ref No.</th>
                          <th className="py-2.5 px-3">स्क्रीनशॉट</th>
                          <th className="py-2.5 px-3">सत्यापन विवरण</th>
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
                            <td className="py-2.5 px-3">{MEMBERSHIP_PLANS[p.plan]?.nameEn || p.plan}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">
                              {formatPrice(p.amount)}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold">{p.utr || "जमा नहीं"}</td>
                            <td className="py-2.5 px-3">
                              {p.screenshotUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewPayment(p)}
                                  className="text-primary underline flex items-center gap-1 font-semibold hover:text-primary/80 cursor-pointer"
                                >
                                  <Eye className="h-3.5 w-3.5" /> रसीद देखें
                                </button>
                              ) : (
                                <span className="text-muted-foreground">उपलब्ध नहीं</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-muted-foreground">
                              {p.verifiedBy ? (
                                <div>
                                  <span className="font-mono">{p.verifiedBy}</span>
                                  {p.adminNote && <p className="italic">"{p.adminNote}"</p>}
                                </div>
                              ) : (
                                "-"
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
                              <div className="flex items-center gap-1.5">
                                {p.status !== "verified" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      paymentMutation.mutate({
                                        paymentId: p.id,
                                        status: "verified",
                                        note: "Verified via Bank UPI Statement",
                                      })
                                    }
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                  >
                                    सत्यापित करें
                                  </Button>
                                )}
                                {p.status !== "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRejectingPayment(p);
                                      setModalReason("");
                                    }}
                                    className="h-7 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer"
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
              </div>
            )}

            {/* TAB 5: ATTENDANCE & CORRECTION */}
            {activeTab === "attendance" && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <h3 className="font-heading text-base font-bold text-foreground">
                        दैनिक उपस्थिति लॉग (Attendance Records)
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        छात्र चेक-इन व चेक-आउट समय (IST)।
                      </p>
                    </div>
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
                              {a.checkOutAt ? (
                                new Date(a.checkOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                              ) : (
                                <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                  अंदर हैं (Inside)
                                </span>
                              )}
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
                    छात्र उपस्थिति में सुधार करें। प्रत्येक सुधार का कारण और व्यवस्थापक ईमेल ऑडिट लॉग में दर्ज होगा।
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <Label className="text-xs font-semibold">छात्र आईडी *</Label>
                      <Input
                        placeholder="SGDL-2026-00001"
                        value={correctionStudentId}
                        onChange={(e) => setCorrectionStudentId(e.target.value)}
                        className="mt-1 font-mono uppercase text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">तारीख *</Label>
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
                      disabled={attendanceMutation.isPending || !correctionStudentId || correctionReason.length < 5}
                      className="w-full text-xs font-semibold cursor-pointer"
                    >
                      {attendanceMutation.isPending ? "सहेज रहा है..." : "सुधार सहेजें (Save Correction)"}
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
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    वर्तमान में कोई नवीनीकरण अनुरोध लंबित नहीं है।
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
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
                          <tr key={r.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-mono font-bold text-primary">
                              {r.studentIdCode}
                            </td>
                            <td className="py-2.5 px-3 font-medium">{r.studentName}</td>
                            <td className="py-2.5 px-3 font-mono font-bold">{r.currentSeat}</td>
                            <td className="py-2.5 px-3">{MEMBERSHIP_PLANS[r.requestedPlan]?.nameEn || r.requestedPlan}</td>
                            <td className="py-2.5 px-3 font-mono font-bold">{r.utr || "जमा नहीं"}</td>
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
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
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

            {/* TAB 7: SETTINGS */}
            {activeTab === "settings" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
                <div className="border-b border-border pb-4">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    लाइब्रेरी सेटिंग्स एवं कॉन्फ़िगरेशन (Library Settings)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    लाइब्रेरी की आधिकारिक जानकारी, यूपीआई आईडी, शुल्क एवं संपर्क विवरण अपडेट करें।
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">आधिकारिक UPI आईडी (Fee Payment)</Label>
                      <Input
                        value={formUpi}
                        onChange={(e) => setFormUpi(e.target.value)}
                        className="mt-1 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">UPI प्राप्तकर्ता नाम (Receiver Name)</Label>
                      <Input
                        value={formReceiverName}
                        onChange={(e) => setFormReceiverName(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">हाफ-डे शुल्क (₹)</Label>
                        <Input
                          type="number"
                          value={formHalfPrice}
                          onChange={(e) => setFormHalfPrice(Number(e.target.value))}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">फुल-डे शुल्क (₹)</Label>
                        <Input
                          type="number"
                          value={formFullPrice}
                          onChange={(e) => setFormFullPrice(Number(e.target.value))}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">हेल्पलाइन फोन / WhatsApp नंबर</Label>
                      <Input
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="mt-1 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold">आधिकारिक ईमेल आईडी</Label>
                      <Input
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">लाइब्रेरी का पता (Address)</Label>
                      <Input
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">लाइब्रेरी समय (Timings)</Label>
                      <Input
                        value={formTimings}
                        onChange={(e) => setFormTimings(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    {/* Fixed Capacity Badge */}
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <Award className="h-4 w-4" /> कुल भौतिक क्षमता: 20 सीटें (Locked)
                      </div>
                      <p className="mt-1 text-muted-foreground text-[11px]">
                        श्री गणेश डिजिटल लाइब्रेरी का भौतिक स्पेस 20 समर्पित व्यक्तिगत केबिन-डेस्क से सुसज्जित है।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <Button
                    onClick={() =>
                      settingsMutation.mutate({
                        upiId: formUpi,
                        receiverName: formReceiverName,
                        contactPhone: formPhone,
                        contactEmail: formEmail,
                        address: formAddress,
                        halfDayPrice: formHalfPrice,
                        fullDayPrice: formFullPrice,
                        timings: formTimings,
                        ownerName: formOwnerName,
                      })
                    }
                    disabled={settingsMutation.isPending}
                    className="font-semibold text-xs cursor-pointer"
                  >
                    {settingsMutation.isPending ? "सहेज रहा है..." : "सेटिंग्स अपडेट करें (Save Configuration)"}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 8: CSV EXPORTS */}
            {activeTab === "reports" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground">छात्र डेटाबेस (Students CSV)</h4>
                  <p className="text-xs text-muted-foreground">
                    सभी पंजीकृत छात्रों के नाम, मोबाइल, पता, स्लॉट और सीट विवरण CSV में डाउनलोड करें।
                  </p>
                  <Button onClick={() => handleExport("students")} className="w-full text-xs font-semibold gap-2 cursor-pointer">
                    <Download className="h-4 w-4" /> छात्र सूची डाउनलोड (CSV)
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground">शुल्क एवं भुगतान (Payments CSV)</h4>
                  <p className="text-xs text-muted-foreground">
                    दैनिक व मासिक फीस कलेक्शन, UTR और सत्यापन स्थिति की विस्तृत रिपोर्ट निर्यात करें।
                  </p>
                  <Button onClick={() => handleExport("payments")} className="w-full text-xs font-semibold gap-2 cursor-pointer">
                    <Download className="h-4 w-4" /> भुगतान रिपोर्ट (CSV)
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground">उपस्थिति रिपोर्ट (Attendance CSV)</h4>
                  <p className="text-xs text-muted-foreground">
                    छात्र चेक-इन व चेक-आउट समय और उपस्थिति विवरण CSV प्रारूप में पाएं।
                  </p>
                  <Button onClick={() => handleExport("attendance")} className="w-full text-xs font-semibold gap-2 cursor-pointer">
                    <Download className="h-4 w-4" /> उपस्थिति रिपोर्ट (CSV)
                  </Button>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-3">
                  <h4 className="font-bold text-sm text-foreground">20-सीट आवंटन (Bookings CSV)</h4>
                  <p className="text-xs text-muted-foreground">
                    सभी 20 सीटों का वर्तमान आवंटन, आवंटित छात्र एवं स्लॉट का पूरा लेखा-जोखा।
                  </p>
                  <Button onClick={() => handleExport("bookings")} className="w-full text-xs font-semibold gap-2 cursor-pointer">
                    <Download className="h-4 w-4" /> सीट आवंटन रिपोर्ट (CSV)
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 9: AUDIT LOG */}
            {activeTab === "audit" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                <h3 className="font-heading text-base font-bold text-foreground">
                  प्रशासनिक ऑडिट ट्रेल (Admin Audit Log)
                </h3>
                <p className="text-xs text-muted-foreground">
                  प्रशासनिक कार्यों का अपरिवर्तनीय इतिहास (एडमिशन स्वीकृति, फीस सत्यापन, सीट परिवर्तन, उपस्थिति संशोधन, छात्र विलोपन)।
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">समय (Timestamp IST)</th>
                        <th className="py-2.5 px-3">प्रशासक</th>
                        <th className="py-2.5 px-3">क्रिया (Action)</th>
                        <th className="py-2.5 px-3">इकाई</th>
                        <th className="py-2.5 px-3">विवरण (Details)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
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

            {/* MODAL 1: Document Inspection Modal */}
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
                    <Button size="sm" variant="ghost" onClick={() => setPreviewStudent(null)} className="cursor-pointer">
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
                        {previewStudent.assignedSeatNumber} ({MEMBERSHIP_PLANS[previewStudent.selectedPlan]?.nameEn || previewStudent.selectedPlan})
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
                          className="h-20 w-60 rounded-lg bg-white p-2 object-contain border border-border shadow-xs"
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

            {/* MODAL 2: Edit Student Profile Dialog */}
            {editingStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground">
                        छात्र प्रोफ़ाइल संपादन ({editingStudent.studentIdCode})
                      </h3>
                      <p className="text-xs text-muted-foreground">व्यक्तिगत जानकारी एवं सीट का संशोधन</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setEditingStudent(null)} className="cursor-pointer">✕</Button>
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <Label className="text-xs font-semibold">विद्यार्थी का नाम</Label>
                      <Input
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">पिता / अभिभावक का नाम</Label>
                      <Input
                        value={editParentName}
                        onChange={(e) => setEditParentName(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">मोबाइल नंबर</Label>
                        <Input
                          value={editMobile}
                          onChange={(e) => setEditMobile(e.target.value)}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">ईमेल</Label>
                        <Input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">आवासीय पता</Label>
                      <Input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">तैयारी लक्ष्य (Exam Goal)</Label>
                      <Input
                        value={editExamGoal}
                        onChange={(e) => setEditExamGoal(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">आवंटित सीट</Label>
                        <select
                          aria-label="सीट चुनें"
                          value={editSeat}
                          onChange={(e) => setEditSeat(e.target.value)}
                          className="mt-1 h-8 w-full text-xs rounded-md border border-input bg-background px-2"
                        >
                          {PHYSICAL_SEATS.map((s) => (
                            <option key={s.number} value={s.number}>{s.number}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">स्लॉट / प्लान</Label>
                        <select
                          aria-label="स्लॉट चुनें"
                          value={editPlan}
                          onChange={(e) => setEditPlan(e.target.value as SlotType)}
                          className="mt-1 h-8 w-full text-xs rounded-md border border-input bg-background px-2"
                        >
                          <option value="morning_half">मॉर्निंग हाफ (7 AM - 12 PM)</option>
                          <option value="second_half">सेकंड हाफ (12 PM - 5 PM)</option>
                          <option value="full_time">फुल-टाइम (7 AM - 5 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <Button
                        onClick={() =>
                          editStudentMutation.mutate({
                            studentIdCode: editingStudent.studentIdCode,
                            fullName: editFullName,
                            parentName: editParentName,
                            mobile: editMobile,
                            email: editEmail,
                            address: editAddress,
                            examGoal: editExamGoal,
                            assignedSeatNumber: editSeat,
                            selectedPlan: editPlan,
                          })
                        }
                        disabled={editStudentMutation.isPending}
                        className="w-full text-xs font-semibold cursor-pointer"
                      >
                        {editStudentMutation.isPending ? "सहेज रहा है..." : "परिवर्तन सहेजें"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingStudent(null)} className="text-xs cursor-pointer">
                        रद्द करें
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 3: Suspend Student Dialog */}
            {suspendingStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <h3 className="font-bold text-base text-foreground">
                    छात्र सदस्यता निलंबन ({suspendingStudent.studentIdCode})
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {suspendingStudent.fullName} की सदस्यता निलंबित करने का कारण दर्ज करें:
                  </p>

                  <div className="mt-4 space-y-3">
                    <Input
                      placeholder="उदा. अनुशासनात्मक कार्रवाई अथवा फीस बकाया"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      className="text-xs"
                    />

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setSuspendingStudent(null)} className="cursor-pointer">
                        रद्द करें
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          suspendMutation.mutate({
                            studentIdCode: suspendingStudent.studentIdCode,
                            reason: modalReason || "व्यवस्थापक द्वारा निलंबित",
                          })
                        }
                        disabled={suspendMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs cursor-pointer"
                      >
                        निलंबित करें
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 4: Option A - Soft Deactivation Dialog with Double Confirmation */}
            {deactivatingStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-amber-500/30 bg-card p-6 shadow-2xl">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-base">
                    <AlertTriangle className="h-5 w-5" /> सुरक्षित निष्क्रियीकरण (Soft Deactivation - अनुशंसित)
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    छात्र <strong>{deactivatingStudent.fullName} ({deactivatingStudent.studentIdCode})</strong> को निष्क्रिय करने से:
                  </p>
                  <ul className="mt-2 list-disc list-inside text-[11px] text-muted-foreground space-y-1">
                    <li>आवंटित सीट <strong>{deactivatingStudent.assignedSeatNumber}</strong> तुरंत अन्य छात्रों हेतु उपलब्ध हो जाएगी।</li>
                    <li>छात्र का वित्तीय रिकॉर्ड, पूर्व भुगतान और उपस्थिति लॉग <strong>हमेशा सुरक्षित</strong> रहेंगे।</li>
                    <li>भविष्य में आवश्यकता पड़ने पर छात्र को <strong>पुनः सक्रिय</strong> किया जा सकता है।</li>
                  </ul>

                  <div className="mt-4 space-y-3">
                    <Label className="text-xs font-semibold">निष्क्रिय करने का कारण (अनिवार्य) *</Label>
                    <Input
                      placeholder="उदा. छात्र ने लाइब्रेरी छोड़ दी"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      className="text-xs"
                    />

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => setDeactivatingStudent(null)} className="cursor-pointer">
                        रद्द करें
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          deactivateMutation.mutate({
                            studentIdCode: deactivatingStudent.studentIdCode,
                            reason: modalReason,
                          })
                        }
                        disabled={deactivateMutation.isPending || modalReason.trim().length < 5}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {deactivateMutation.isPending ? "निष्क्रिय कर रहा है..." : "पुष्टि करें एवं निष्क्रिय करें"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 5: Option B - Permanent Deletion Dialog */}
            {deletingStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-rose-500 bg-card p-6 shadow-2xl">
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                    <Trash2 className="h-5 w-5" /> स्थाई विलोपन (Permanent Delete)
                  </div>
                  <p className="mt-2 text-xs text-foreground font-semibold">
                    सावधानी: यह एक अपरिवर्तनीय क्रिया है!
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    आप छात्र <strong>{deletingStudent.fullName}</strong> ({deletingStudent.studentIdCode}) को सक्रिय डेटाबेस से स्थाई रूप से हटाने जा रहे हैं।
                  </p>

                  <div className="mt-3 rounded-lg bg-rose-50 border border-rose-200 p-3 text-[11px] text-rose-800 space-y-1">
                    <p>• आवंटित सीट तुरंत खाली हो जाएगी।</p>
                    <p>• वित्तीय और ऑडिट नियमों के अनुपालन हेतु पूर्व भुगतान और उपस्थिति पर "हटाया गया खाता" चिन्हित कर ऑडिट ट्रेल में सुरक्षित रखा जाएगा।</p>
                  </div>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <Label className="text-xs font-semibold text-rose-700">
                        पुष्टि कोड: सटीक छात्र आईडी दर्ज करें (<strong>{deletingStudent.studentIdCode}</strong>) *
                      </Label>
                      <Input
                        placeholder={deletingStudent.studentIdCode}
                        value={deleteConfirmationCode}
                        onChange={(e) => setDeleteConfirmationCode(e.target.value)}
                        className="mt-1 font-mono uppercase text-xs"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">स्थाई हटाने का अनिवार्य कारण *</Label>
                      <Input
                        placeholder="उदा. गलत प्रविष्टि / छात्र अनुरोध पर स्थाई विलोपन"
                        value={modalReason}
                        onChange={(e) => setModalReason(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => setDeletingStudent(null)} className="cursor-pointer">
                        रद्द करें
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          deletePermanentMutation.mutate({
                            studentIdCode: deletingStudent.studentIdCode,
                            confirmationCode: deleteConfirmationCode,
                            reason: modalReason,
                          })
                        }
                        disabled={
                          deletePermanentMutation.isPending ||
                          deleteConfirmationCode.trim().toUpperCase() !== deletingStudent.studentIdCode.toUpperCase() ||
                          modalReason.trim().length < 5
                        }
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        {deletePermanentMutation.isPending ? "हटाया जा रहा है..." : "स्थाई रूप से हटाएं"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 6: Reassign Seat Dialog */}
            {reassigningStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <h3 className="font-bold text-base text-foreground">
                    सीट पुनर्वितरण (Seat Reassignment)
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    छात्र: {reassigningStudent.fullName} | वर्तमान सीट: {reassigningStudent.assignedSeatNumber}
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div>
                      <Label className="text-xs font-semibold">नई सीट चुनें (Seat 01 - Seat 20)</Label>
                      <select
                        aria-label="नई सीट चुनें"
                        value={targetSeat}
                        onChange={(e) => setTargetSeat(e.target.value)}
                        className="mt-1 h-8 w-full text-xs rounded-md border border-input bg-background px-2"
                      >
                        {PHYSICAL_SEATS.map((s) => (
                          <option key={s.number} value={s.number}>{s.number}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">सीट बदलने का कारण</Label>
                      <Input
                        placeholder="उदा. छात्र का विशेष अनुरोध"
                        value={modalReason}
                        onChange={(e) => setModalReason(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => setReassigningStudent(null)} className="cursor-pointer">
                        रद्द करें
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          reassignSeatMutation.mutate({
                            studentIdCode: reassigningStudent.studentIdCode,
                            newSeatNumber: targetSeat,
                            reason: modalReason || "Admin Reassigned",
                          })
                        }
                        disabled={reassignSeatMutation.isPending}
                        className="bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
                      >
                        सीट बदलें
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 7: Cancel Booking Dialog */}
            {cancellingBooking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <h3 className="font-bold text-base text-foreground">
                    सीट बुकिंग निरस्तीकरण
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    बुकिंग कोड: {cancellingBooking.bookingCode} | सीट: {cancellingBooking.seat}
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <Label className="text-xs font-semibold">रद्द करने का अनिवार्य कारण *</Label>
                    <Input
                      placeholder="उदा. छात्र ने अनुपस्थिति की सूचना दी"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      className="text-xs"
                    />

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => setCancellingBooking(null)} className="cursor-pointer">
                        वापस जाएं
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          cancelBookingMutation.mutate({
                            bookingCode: cancellingBooking.bookingCode,
                            reason: modalReason,
                          })
                        }
                        disabled={cancelBookingMutation.isPending || modalReason.trim().length < 3}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        बुकिंग रद्द करें
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 8: Reject Admission Dialog */}
            {rejectingAdmission && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <h3 className="font-bold text-base text-foreground">
                    एडमिशन अस्वीकृति ({rejectingAdmission.studentIdCode})
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rejectingAdmission.fullName} का एडमिशन आवेदन अस्वीकृत करने का कारण दर्ज करें:
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <Input
                      placeholder="उदा. पहचान पत्र अस्पष्ट अथवा शुल्क असत्यापित"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      className="text-xs"
                    />

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => setRejectingAdmission(null)} className="cursor-pointer">
                        रद्द करें
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          admissionMutation.mutate({
                            studentIdCode: rejectingAdmission.studentIdCode,
                            status: "rejected",
                            reason: modalReason || "अस्पष्ट दस्तावेज",
                          })
                        }
                        disabled={admissionMutation.isPending}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        अस्वीकृत करें
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 9: Payment Screenshot Inspection Modal */}
            {previewPayment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground">
                        पेमेंट रसीद / स्क्रीनशॉट (UTR: {previewPayment.utr})
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        छात्र: {previewPayment.studentName} | राशि: {formatPrice(previewPayment.amount)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setPreviewPayment(null)} className="cursor-pointer">
                      ✕
                    </Button>
                  </div>

                  {/* Anti-auto approval warning */}
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>
                      <strong>चेतावनी:</strong> कृपया बैंक खाते अथवा UPI स्टेटमेंट से UTR और राशि का मिलान करने के बाद ही सत्यापित करें। केवल स्क्रीनशॉट पर भरोसा न करें।
                    </span>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <img
                      src={previewPayment.screenshotUrl!}
                      alt="Payment Screenshot"
                      className="max-h-[50vh] rounded-lg object-contain border border-border"
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    {previewPayment.status !== "verified" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          paymentMutation.mutate({
                            paymentId: previewPayment.id,
                            status: "verified",
                            note: "Verified after in-modal screenshot inspection",
                          });
                          setPreviewPayment(null);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        सत्यापित करें (Mark Verified)
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setPreviewPayment(null)} className="text-xs cursor-pointer">
                      बंद करें
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL 10: Payment Rejection Dialog */}
            {rejectingPayment && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
                  <h3 className="font-bold text-base text-foreground">
                    भुगतान अस्वीकृति (UTR: {rejectingPayment.utr})
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    छात्र: {rejectingPayment.studentName} | राशि: {formatPrice(rejectingPayment.amount)}
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <Label className="text-xs font-semibold">अस्वीकृति का कारण दर्ज करें *</Label>
                    <Input
                      placeholder="उदा. बैंक खाते में राशि प्राप्त नहीं हुई अथवा UTR अमान्य"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      className="text-xs"
                    />

                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" onClick={() => setRejectingPayment(null)} className="cursor-pointer">
                        रद्द करें
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          paymentMutation.mutate({
                            paymentId: rejectingPayment.id,
                            status: "rejected",
                            note: modalReason || "बैंक खाते में राशि प्राप्त नहीं हुई",
                          })
                        }
                        disabled={paymentMutation.isPending}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        भुगतान अस्वीकृत करें
                      </Button>
                    </div>
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

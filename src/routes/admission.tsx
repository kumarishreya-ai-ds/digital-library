import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  Upload,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Camera,
  BookOpen,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LIBRARY,
  MEMBERSHIP_PLANS,
  PHYSICAL_SEATS,
  formatPrice,
  type SlotType,
} from "@/lib/library";
import { createAdmissionFn, getSeatAvailabilityFn } from "@/lib/library.functions";
import type { StudentRecord } from "@/lib/server-store";

export const Route = createFileRoute("/admission")({
  validateSearch: (search: Record<string, unknown>) => ({
    seat: typeof search["seat"] === "string" ? search["seat"] : undefined,
    slot: typeof search["slot"] === "string" ? (search["slot"] as SlotType) : undefined,
    date: typeof search["date"] === "string" ? search["date"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "लाइब्रेरी प्रवेश फॉर्म (Admission Form) | " + LIBRARY.nameEn },
      {
        name: "description",
        content:
          "श्री गणेश डिजिटल लाइब्रेरी में नए छात्र प्रवेश फॉर्म भरें। फोटो, डिजिटल हस्ताक्षर और आईडी प्रूफ अपलोड करें।",
      },
    ],
  }),
  component: AdmissionPage,
});

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("फ़ाइल पढ़ी नहीं जा सकी"));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("अमान्य फ़ाइल डेटा"));
    };
    reader.readAsDataURL(file);
  });
}

function AdmissionPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    parentName: "",
    mobile: "",
    email: "",
    address: "",
    examGoal: "BPSC / Bihar State Exams",
    customExamGoal: "",
    selectedPlan: search.slot || "morning_half",
    assignedSeatNumber: search.seat || "Seat 01",
    admissionDate: search.date || new Date().toISOString().slice(0, 10),
    termsAccepted: false,
  });

  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>("");
  const [photoMode, setPhotoMode] = useState<"upload" | "camera">("upload");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [idProofBase64, setIdProofBase64] = useState<string | null>(null);
  const [idProofName, setIdProofName] = useState<string>("");

  const [createdStudent, setCreatedStudent] = useState<StudentRecord | null>(null);

  const fetchAvailability = useServerFn(getSeatAvailabilityFn);
  const submitAdmission = useServerFn(createAdmissionFn);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setCameraStream(s);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      toast.info("कैमरा शुरू हो गया");
    } catch {
      toast.error("कैमरा एक्सेस नहीं मिला। कृपया फ़ाइल अपलोड विकल्प का उपयोग करें।");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPhotoBase64(dataUrl);
    setPhotoName("webcam-photo.jpg");
    stopCamera();
    toast.success("लाइव फोटो सफलतापूर्वक ले ली गई!");
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const { data: seats = [] } = useQuery({
    queryKey: ["admission-seat-check", form.admissionDate, form.selectedPlan],
    queryFn: () =>
      fetchAvailability({
        data: {
          date: form.admissionDate,
          slot: form.selectedPlan as SlotType,
        },
      }),
  });

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("फोटो का आकार 5MB से कम होना चाहिए");
      return;
    }
    try {
      const b64 = await readFileAsBase64(file);
      setPhotoBase64(b64);
      setPhotoName(file.name);
      toast.success("छात्र फोटो अपलोड हो गई");
    } catch {
      toast.error("फोटो अपलोड विफल रही");
    }
  };

  const handleIdProofUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("आईडी प्रूफ का आकार 5MB से कम होना चाहिए");
      return;
    }
    try {
      const b64 = await readFileAsBase64(file);
      setIdProofBase64(b64);
      setIdProofName(file.name);
      toast.success("आईडी प्रूफ अपलोड हो गया");
    } catch {
      toast.error("आईडी प्रूफ अपलोड विफल रहा");
    }
  };

  const finalExamGoal =
    form.examGoal === "Other" && form.customExamGoal.trim()
      ? form.customExamGoal.trim()
      : form.examGoal;

  const mutation = useMutation({
    mutationFn: () =>
      submitAdmission({
        data: {
          fullName: form.fullName.trim(),
          parentName: form.parentName.trim() || undefined,
          mobile: form.mobile.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
          examGoal: finalExamGoal,
          termsAccepted: form.termsAccepted,
          selectedPlan: form.selectedPlan as SlotType,
          assignedSeatNumber: form.assignedSeatNumber,
          admissionDate: form.admissionDate,
          photoUrl: photoBase64,
          signatureUrl: signatureBase64,
          idProofUrl: idProofBase64,
        },
      }),
    onSuccess: (student) => {
      setCreatedStudent(student);
      toast.success(`एडमिशन आवेदन दर्ज! छात्र आईडी: ${student.studentIdCode}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "एडमिशन फॉर्म जमा नहीं हो सका");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      toast.error("कृपया पूरा नाम लिखें");
      return;
    }
    if (!form.parentName.trim() || form.parentName.trim().length < 3) {
      toast.error("कृपया पिता या अभिभावक का नाम दर्ज करें");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) {
      toast.error("कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("कृपया वैध ईमेल आईडी दर्ज करें");
      return;
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      toast.error("कृपया पूरा आवासीय पता लिखें");
      return;
    }
    if (!form.termsAccepted) {
      toast.error("कृपया पुस्तकालय के नियमों एवं अनुशासन की स्वीकृति दें");
      return;
    }
    if (!signatureBase64) {
      toast.error("कृपया डिजिटल हस्ताक्षर पैड पर साइन करके 'Save Signature' पर क्लिक करें");
      return;
    }

    mutation.mutate();
  };

  const currentPlan = MEMBERSHIP_PLANS[form.selectedPlan as SlotType];

  // Success view
  if (createdStudent) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-xl border-2 border-emerald-500/30 bg-card p-6 shadow-lg">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8 shrink-0" />
              <div>
                <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                  एडमिशन आवेदन सफलतापूर्वक दर्ज!
                </h1>
                <p className="text-xs text-muted-foreground">
                  श्री गणेश डिजिटल लाइब्रेरी में आपका स्वागत है।
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  आपकी छात्र आईडी (Student ID)
                </span>
                <span className="font-mono text-lg font-bold text-primary">
                  {createdStudent.studentIdCode}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">विद्यार्थी का नाम:</dt>
                  <dd className="font-semibold text-foreground">{createdStudent.fullName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">मोबाइल नंबर:</dt>
                  <dd className="font-medium text-foreground">{createdStudent.mobile}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">चुना गया स्लॉट:</dt>
                  <dd className="font-medium text-foreground">
                    {MEMBERSHIP_PLANS[createdStudent.selectedPlan].nameEn}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">आबंटित सीट:</dt>
                  <dd className="font-mono font-bold text-foreground">
                    {createdStudent.assignedSeatNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">मासिक शुल्क:</dt>
                  <dd className="font-heading font-bold text-emerald-700">
                    {formatPrice(MEMBERSHIP_PLANS[createdStudent.selectedPlan].priceMonthly)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">एडमिशन स्थिति:</dt>
                  <dd className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <Clock className="h-3.5 w-3.5" /> Pending (सत्यापन बाकी)
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50/70 p-4 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-bold">महत्वपूर्ण अगला कदम (Next Step):</p>
              <p className="mt-1">
                अपनी सीट कन्फर्म करने के लिए कृपया UPI से ₹{MEMBERSHIP_PLANS[createdStudent.selectedPlan].priceMonthly} का भुगतान करें और ट्रांजैक्शन आईडी (UTR) दर्ज करें।
              </p>
              <p className="mt-2 font-semibold">
                UPI ID: {LIBRARY.upiId}
              </p>
              <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                {LIBRARY.upiInstruction}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: "/payment",
                    search: { code: createdStudent.studentIdCode },
                  })
                }
                className="flex-1 font-semibold"
              >
                <CreditCard className="mr-2 h-4 w-4" /> अभी शुल्क भुगतान करें (Pay Now)
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/student",
                    search: { id: createdStudent.studentIdCode },
                  })
                }
              >
                स्टूडेंट पोर्टल देखें
              </Button>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="border-b border-border pb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> आधिकारिक प्रवेश पत्र (Official Admission)
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold text-primary sm:text-3xl">
            विद्यार्थी प्रवेश फॉर्म (Student Admission Form)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            कृपया अपनी सही जानकारी, फोटो, डिजिटल हस्ताक्षर और पहचान पत्र संलग्न करें।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Section 1: Personal Details */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <User className="h-4 w-4 text-primary" />
              1. व्यक्तिगत विवरण (Personal Information)
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="full-name" className="text-xs font-semibold">
                  छात्र का पूरा नाम (Applicant Full Name) *
                </Label>
                <Input
                  id="full-name"
                  required
                  placeholder="उदा. राहुल कुमार"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="parent-name" className="text-xs font-semibold">
                  पिता / अभिभावक का नाम (Father / Guardian Name) *
                </Label>
                <Input
                  id="parent-name"
                  required
                  placeholder="उदा. श्री सुरेश सिंह"
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="mobile" className="text-xs font-semibold">
                  मोबाइल नंबर (Mobile Number) *
                </Label>
                <Input
                  id="mobile"
                  required
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold">
                  ईमेल पता (Email Address) *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="exam-goal" className="text-xs font-semibold">
                  प्रतियोगी परीक्षा / अध्ययन लक्ष्य (Preparation Goal) *
                </Label>
                <select
                  id="exam-goal"
                  aria-label="प्रतियोगी परीक्षा या अध्ययन लक्ष्य"
                  value={form.examGoal}
                  onChange={(e) => setForm({ ...form, examGoal: e.target.value })}
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="BPSC / Bihar State Exams">BPSC / Bihar State Exams (बीपीएससी / दारोगा)</option>
                  <option value="UPSC Civil Services">UPSC / Civil Services (सिविल सर्विसेज)</option>
                  <option value="SSC (CGL, CHSL, MTS, GD)">SSC (CGL, CHSL, MTS, GD)</option>
                  <option value="Banking / IBPS / SBI PO & Clerk">Banking / IBPS / SBI PO & Clerk</option>
                  <option value="Railways (RRB NTPC, Group D, ALP)">Railways (RRB NTPC, Group D, ALP)</option>
                  <option value="NEET / Medical Entrance">NEET / Medical Entrance</option>
                  <option value="JEE / Engineering Entrance">JEE / Engineering Entrance</option>
                  <option value="UGC NET / CTET / Teaching">UGC NET / CTET / Teaching Exams</option>
                  <option value="College / University Degree">College / University Degree Studies</option>
                  <option value="Other">अन्य (कृपया नीचे लिखें / Other)</option>
                </select>
                {form.examGoal === "Other" && (
                  <Input
                    placeholder="अपनी परीक्षा या अध्ययन का नाम लिखें"
                    value={form.customExamGoal}
                    onChange={(e) => setForm({ ...form, customExamGoal: e.target.value })}
                    className="mt-2 text-sm"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="adm-date" className="text-xs font-semibold">
                  प्रवेश तिथि (Admission Date) *
                </Label>
                <Input
                  id="adm-date"
                  type="date"
                  required
                  value={form.admissionDate}
                  onChange={(e) => setForm({ ...form, admissionDate: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="address" className="text-xs font-semibold">
                  पूरा आवासीय पता (Complete Residential Address) *
                </Label>
                <Input
                  id="address"
                  required
                  placeholder="ग्राम/मोहल्ला, पोस्ट, थाना, पचलखी, सीवान, बिहार"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Plan & Seat Selection */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              2. स्लॉट एवं सीट चयन (Plan & Seat Selection)
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">सदस्यता स्लॉट (Membership Slot) *</Label>
                <select
                  aria-label="सदस्यता स्लॉट"
                  value={form.selectedPlan}
                  onChange={(e) => setForm({ ...form, selectedPlan: e.target.value as SlotType })}
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="morning_half">मॉर्निंग हाफ (7:00 AM–12:00 PM) - ₹400/माह</option>
                  <option value="second_half">सेकंड हाफ (12:00 PM–5:00 PM) - ₹400/माह</option>
                  <option value="full_time">फुल-टाइम (7:00 AM–5:00 PM) - ₹700/माह</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">आबंटित सीट (Seat Number 01-20) *</Label>
                <select
                  aria-label="आबंटित सीट"
                  value={form.assignedSeatNumber}
                  onChange={(e) => setForm({ ...form, assignedSeatNumber: e.target.value })}
                  className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PHYSICAL_SEATS.map((seat) => {
                    const status = seats.find((s) => s.number === seat.number);
                    const isAvail = status ? status.isAvailable : true;
                    return (
                      <option key={seat.number} value={seat.number} disabled={!isAvail}>
                        {seat.number} {!isAvail ? "(अनुपलब्ध / Booked)" : "(उपलब्ध / Free)"}
                      </option>
                    );
                  })}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  नक्शा देखकर सीट बदलने के लिए{" "}
                  <Link to="/book" className="text-primary underline">
                    सीट नक्शा पेज
                  </Link>{" "}
                  पर जाएं।
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-foreground">चयनित योजना: </span>
                <span className="text-muted-foreground">{currentPlan.nameEn} ({currentPlan.timing})</span>
              </div>
              <div className="font-heading font-bold text-base text-primary">
                मासिक शुल्क: {formatPrice(currentPlan.priceMonthly)}
              </div>
            </div>
          </div>

          {/* Section 3: Document Uploads & Signature */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-6">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <Upload className="h-4 w-4 text-primary" />
              3. फोटो, डिजिटल हस्ताक्षर एवं पहचान पत्र (Documents & Signature)
            </h2>

            {/* Photo Section with Live Camera Option */}
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs font-semibold">
                  छात्र पासपोर्ट फोटो (Student Photo) *
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={photoMode === "upload" ? "default" : "outline"}
                    onClick={() => {
                      stopCamera();
                      setPhotoMode("upload");
                    }}
                    className="h-7 text-xs"
                  >
                    <Upload className="mr-1 h-3 w-3" /> फ़ाइल अपलोड
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={photoMode === "camera" ? "default" : "outline"}
                    onClick={() => {
                      setPhotoMode("camera");
                      if (!isCameraActive) startCamera();
                    }}
                    className="h-7 text-xs"
                  >
                    <Camera className="mr-1 h-3 w-3" /> लाइव वेबकैम
                  </Button>
                </div>
              </div>

              {photoMode === "upload" ? (
                <div className="flex items-center gap-3">
                  {photoBase64 ? (
                    <img
                      src={photoBase64}
                      alt="Student Preview"
                      className="h-20 w-20 rounded-md border border-border object-cover shadow-xs"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="student-photo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoUpload}
                      className="text-xs file:text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {photoName ? `अपलोड: ${photoName}` : "पासपोर्ट साइज रंगीन फोटो (JPG, PNG, max 5MB)"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {isCameraActive ? (
                    <div className="overflow-hidden rounded-lg border-2 border-primary bg-black max-w-sm mx-auto">
                      <video ref={videoRef} autoPlay playsInline className="h-56 w-full object-cover" />
                      <div className="flex justify-center gap-2 p-2 bg-card">
                        <Button
                          type="button"
                          size="sm"
                          onClick={capturePhoto}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <Camera className="mr-1.5 h-4 w-4" /> फोटो खींचें (Capture)
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={stopCamera}
                        >
                          कैमरा बंद करें
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      {photoBase64 && (
                        <div className="mb-3">
                          <img
                            src={photoBase64}
                            alt="Captured"
                            className="mx-auto h-24 w-24 rounded-md border-2 border-emerald-500 object-cover"
                          />
                          <p className="mt-1 text-xs text-emerald-700 font-semibold">फोटो सफलतापूर्वक ली गई</p>
                        </div>
                      )}
                      <Button type="button" size="sm" onClick={startCamera}>
                        <Camera className="mr-1.5 h-4 w-4" /> कैमरा दोबारा चालू करें
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ID Proof Upload */}
            <div className="space-y-2">
              <Label htmlFor="id-proof" className="text-xs font-semibold">
                पहचान पत्र (Aadhaar / Voter ID / College ID) *
              </Label>
              <Input
                id="id-proof"
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={handleIdProofUpload}
                className="text-xs file:text-xs"
              />
              <span className="text-[10px] text-muted-foreground">
                {idProofName ? `संलग्न: ${idProofName}` : "आधार कार्ड, वोटर कार्ड या कॉलेज आईडी (Max 5MB)"}
              </span>
            </div>

            {/* Digital Signature Pad */}
            <div className="border-t border-border pt-4">
              <SignaturePad
                savedSignature={signatureBase64}
                onSave={(dataUrl) => setSignatureBase64(dataUrl)}
              />
            </div>
          </div>

          {/* Section 4: Terms Acceptance & Submission CTA */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div
              onClick={() => setForm({ ...form, termsAccepted: !form.termsAccepted })}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
            >
              <div className="mt-0.5 text-primary">
                {form.termsAccepted ? (
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="text-xs">
                <p className="font-bold text-foreground">
                  पुस्तकालय नियमों एवं अनुशासन की स्वीकृति (Acceptance of Rules) *
                </p>
                <p className="mt-1 text-muted-foreground leading-relaxed">
                  मैं श्री गणेश डिजिटल लाइब्रेरी के सभी नियमों का पालन करने की सहमति देता/देती हूँ: अध्ययन कक्ष में पूर्ण शांति बनाए रखना, मोबाइल को मूक (Silent) मोड में रखना, परिसर को स्वच्छ रखना एवं फर्नीचर व बिजली उपकरणों की सुरक्षा करना।
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full text-base font-semibold py-6"
            >
              {mutation.isPending ? "एडमिशन दर्ज हो रहा है…" : "एडमिशन फॉर्म जमा करें (Submit Admission)"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </SiteLayout>
  );
}

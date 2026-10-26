import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Copy,
  Check,
  CreditCard,
  MessageSquare,
  QrCode as QrIcon,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileCheck2,
  ExternalLink,
  Search,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { ReceiptCard } from "@/components/ReceiptCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LIBRARY,
  MEMBERSHIP_PLANS,
  buildUpiLink,
  formatPrice,
  type SlotType,
} from "@/lib/library";
import {
  getPublicSettings,
  getStudentProfileFn,
  submitPaymentNewFn,
} from "@/lib/library.functions";

export const Route = createFileRoute("/payment")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search["code"] === "string" && search["code"] ? search["code"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "शुल्क भुगतान एवं सत्यापन | " + LIBRARY.nameEn },
      {
        name: "description",
        content:
          "श्री गणेश डिजिटल लाइब्रेरी - आधिकारिक UPI ID (7061038932-p36a@ibl) पर फीस भुगतान करें एवं UTR जमा करें।",
      },
    ],
  }),
  component: PaymentPage,
});

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("स्क्रीनशॉट पढ़ा नहीं जा सका"));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("अमान्य स्क्रीनशॉट फ़ाइल"));
    };
    reader.readAsDataURL(file);
  });
}

function PaymentPage() {
  const search = Route.useSearch();
  const [studentIdInput, setStudentIdInput] = useState(search.code || "SGDL-2026-00001");
  const [activeCode, setActiveCode] = useState(search.code || "SGDL-2026-00001");

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const [utrInput, setUtrInput] = useState("");
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>("");

  const lookupProfile = useServerFn(getStudentProfileFn);
  const sendPayment = useServerFn(submitPaymentNewFn);

  // Student Profile Query
  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch,
  } = useQuery({
    queryKey: ["student-payment-profile", activeCode],
    queryFn: () => lookupProfile({ data: { studentIdCode: activeCode } }),
    enabled: Boolean(activeCode),
  });

  const student = profileData?.student;
  const latestPayment = profileData?.payments?.[0];
  const plan = student ? MEMBERSHIP_PLANS[student.selectedPlan] : MEMBERSHIP_PLANS.morning_half;
  const amount = plan.priceMonthly;

  // Generate dynamic QR Code for UPI
  useEffect(() => {
    const upiUri = buildUpiLink({
      upiId: LIBRARY.upiId,
      receiverName: LIBRARY.nameEn,
      amount,
      note: student ? `Fee-${student.studentIdCode}` : "Library Fee",
    });

    QRCode.toDataURL(upiUri, { width: 260, margin: 1 })
      .then(setQrDataUrl)
      .catch((err) => console.error("QR Code generation error", err));
  }, [amount, student]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(LIBRARY.upiId);
    setCopied(true);
    toast.success("UPI ID क्लिपबोर्ड पर कॉपी हो गया!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScreenshotChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("स्क्रीनशॉट का आकार 5MB से कम होना चाहिए");
      return;
    }
    try {
      const b64 = await readFileAsBase64(file);
      setScreenshotBase64(b64);
      setScreenshotName(file.name);
      toast.success("स्क्रीनशॉट अपलोड हो गया");
    } catch {
      toast.error("स्क्रीनशॉट पढ़ा नहीं जा सका");
    }
  };

  const paymentMutation = useMutation({
    mutationFn: () =>
      sendPayment({
        data: {
          studentIdCode: activeCode,
          utr: utrInput.trim(),
          screenshotUrl: screenshotBase64,
        },
      }),
    onSuccess: () => {
      toast.success("भुगतान विवरण सफलतापूर्वक जमा! व्यवस्थापक सत्यापन का इंतज़ार करें।");
      setUtrInput("");
      setScreenshotBase64(null);
      setScreenshotName("");
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || "भुगतान विवरण जमा नहीं हो सका");
    },
  });

  const handleSubmitPayment = (e: FormEvent) => {
    e.preventDefault();
    if (!activeCode) {
      toast.error("कृपया पहले अपनी छात्र आईडी दर्ज करें");
      return;
    }
    if (!utrInput.trim() || utrInput.trim().length < 6) {
      toast.error("कृपया कम से कम 6 अंकों का सही UTR / Transaction ID दर्ज करें");
      return;
    }
    paymentMutation.mutate();
  };

  const whatsappMessage = encodeURIComponent(
    `नमस्ते, मैंने श्री गणेश डिजिटल लाइब्रेरी की फीस जमा कर दी है।\nछात्र आईडी: ${student?.studentIdCode || activeCode}\nनाम: ${student?.fullName || ""}\nसीट: ${student?.assignedSeatNumber || ""}\nराशि: ₹${amount}\nकृपया मेरा भुगतान सत्यापित (Verify) कर दें। धन्यवाद।`,
  );

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" /> आधिकारिक शुल्क भुगतान (Official UPI Payment)
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold text-primary sm:text-3xl">
            लाइब्रेरी शुल्क भुगतान एवं सत्यापन
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            अपने एडमिशन स्लॉट के अनुसार नीचे दिए गए आधिकारिक UPI पर भुगतान करें। भुगतान के पश्चात स्क्रीनशॉट एवं UTR नंबर जमा करें।
          </p>
        </div>

        {/* Lookup Box */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveCode(studentIdInput.trim().toUpperCase());
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <Label htmlFor="search-id" className="text-xs font-semibold">
                छात्र आईडी या मोबाइल नंबर खोजें (Student ID / Mobile)
              </Label>
              <Input
                id="search-id"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="उदा. SGDL-2026-00001 या मोबाइल नंबर"
                className="mt-1 font-mono uppercase text-sm"
              />
            </div>
            <Button type="submit" className="sm:self-end">
              <Search className="mr-1.5 h-4 w-4" /> खोजें (Lookup)
            </Button>
          </form>
        </div>

        {isProfileLoading ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            छात्र एवं भुगतान विवरण लोड हो रहा है…
          </div>
        ) : !student ? (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-600 mb-2" />
            <p className="font-semibold">छात्र रिकॉर्ड नहीं मिला</p>
            <p className="mt-1 text-xs text-muted-foreground">
              कृपया अपनी छात्र आईडी (जैसे SGDL-2026-00001) जांचें, अथवा पहले{" "}
              <Link to="/admission" className="text-primary underline font-medium">
                एडमिशन फॉर्म
              </Link>{" "}
              भरें।
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Student Overview Box */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <span className="text-xs text-muted-foreground">विद्यार्थी का नाम</span>
                  <h2 className="text-lg font-bold text-foreground">{student.fullName}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">छात्र आईडी</span>
                  <p className="font-mono text-base font-bold text-primary">
                    {student.studentIdCode}
                  </p>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">आबंटित सीट:</dt>
                  <dd className="font-mono font-bold text-foreground">
                    {student.assignedSeatNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">स्लॉट:</dt>
                  <dd className="font-semibold text-foreground">{plan.nameEn}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">समय अवधि:</dt>
                  <dd className="font-medium text-foreground">{plan.timing}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">मासिक देय शुल्क:</dt>
                  <dd className="font-heading font-bold text-base text-emerald-700 dark:text-emerald-400">
                    {formatPrice(amount)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Official UPI Payment Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* QR Code & Direct UPI Card */}
              <div className="flex flex-col items-center rounded-xl border-2 border-primary/20 bg-card p-6 text-center shadow-xs">
                <span className="text-xs font-bold tracking-wider text-primary uppercase">
                  स्कैन करके भुगतान करें (Scan & Pay)
                </span>

                <div className="mt-4 rounded-xl border-2 border-dashed border-border bg-white p-3 shadow-inner">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="UPI Payment QR Code"
                      width={240}
                      height={240}
                      className="h-56 w-56 object-contain"
                    />
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center text-xs text-muted-foreground">
                      QR कोड लोड हो रहा है…
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs font-semibold text-foreground">
                  किसी भी UPI ऐप (GPay, PhonePe, Paytm, BHIM) से स्कैन करें
                </p>

                {/* Mobile direct UPI Link */}
                <a
                  href={buildUpiLink({
                    upiId: LIBRARY.upiId,
                    receiverName: LIBRARY.nameEn,
                    amount,
                    note: `Fee-${student.studentIdCode}`,
                  })}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <CreditCard className="h-4 w-4" /> मोबाइल UPI ऐप से सीधे भुगतान करें
                </a>
              </div>

              {/* UPI ID & Explicit WhatsApp Instruction Card */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground">
                      आधिकारिक UPI आईडी (Official UPI ID)
                    </Label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 rounded-lg border border-input bg-muted/40 px-3.5 py-2.5 font-mono text-base font-bold text-foreground select-all">
                        {LIBRARY.upiId}
                      </div>
                      <Button
                        type="button"
                        onClick={handleCopyUpi}
                        variant="outline"
                        className="gap-1.5 font-medium"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  {/* MANDATORY PROMPT INSTRUCTION BOX DIRECTLY UNDER UPI ID */}
                  <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-50/70 p-4 shadow-xs dark:bg-emerald-950/30">
                    <div className="flex items-start gap-2.5">
                      <MessageSquare className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                          महत्वपूर्ण निर्देश (Mandatory Instruction):
                        </p>
                        <p className="mt-1 text-sm font-bold text-emerald-950 dark:text-emerald-100 leading-snug">
                          “{LIBRARY.upiInstruction}”
                        </p>
                      </div>
                    </div>

                    <a
                      href={`${LIBRARY.whatsappUrl}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                    >
                      <MessageSquare className="h-4 w-4" /> व्हाट्सएप पर स्क्रीनशॉट भेजें (WhatsApp Now)
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                <div className="border-t border-border pt-4 text-xs text-muted-foreground">
                  <p>
                    <strong>प्राप्तकर्ता का नाम:</strong> {LIBRARY.nameEn}
                  </p>
                  <p className="mt-1">
                    <strong>हेल्पलाइन फोन:</strong> {LIBRARY.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Submission Section */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h3 className="font-heading text-lg font-bold text-foreground">
                भुगतान रसीद एवं UTR जमा करें (Submit Payment Proof)
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                UPI भुगतान के बाद मिलने वाला 12-अंकों का UTR / Transaction Ref ID यहाँ दर्ज करें।
              </p>

              <form onSubmit={handleSubmitPayment} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="utr-input" className="text-xs font-semibold">
                      UTR / Transaction ID *
                    </Label>
                    <Input
                      id="utr-input"
                      required
                      placeholder="उदा. 428912345678"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      className="mt-1.5 font-mono text-sm uppercase"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      UPI ऐप में 12 अंकों का UTR देखें।
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="pay-date-input" className="text-xs font-semibold">
                      भुगतान तिथि (Payment Date) *
                    </Label>
                    <Input
                      id="pay-date-input"
                      type="date"
                      required
                      value={paymentDateInput}
                      onChange={(e) => setPaymentDateInput(e.target.value)}
                      className="mt-1.5 text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      जिस दिन UPI से पैसे भेजे गए।
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="screenshot-input" className="text-xs font-semibold">
                      पेमेंट स्क्रीनशॉट (Screenshot)
                    </Label>
                    <Input
                      id="screenshot-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleScreenshotChange}
                      className="mt-1.5 text-xs file:text-xs"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {screenshotName ? `संलग्न: ${screenshotName}` : "JPG, PNG (Max 5MB)"}
                    </span>
                  </div>
                </div>

                {/* Important Security Notice */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <p className="font-semibold">⚠️ महत्वपूर्ण सुरक्षा नियम:</p>
                  <p className="mt-0.5">
                    स्क्रीनशॉट अथवा UTR जमा करने से भुगतान स्वचालित रूप से सत्यापित (Verify) नहीं होता। पुस्तकालय व्यवस्थापक द्वारा बैंक खाते में राशि की पुष्टि के उपरांत ही 'Verified' रसीद जारी की जाएगी।
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={paymentMutation.isPending}
                  className="w-full font-semibold"
                >
                  {paymentMutation.isPending ? "जमा हो रहा है…" : "भुगतान विवरण जमा करें (Submit Verification Details)"}
                </Button>
              </form>
            </div>

            {/* Current Payment Status & Verified Receipt Display */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <h3 className="font-heading text-lg font-bold text-foreground">
                वर्तमान भुगतान स्थिति (Payment Status)
              </h3>

              {!latestPayment ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  अभी तक कोई भुगतान जमा नहीं किया गया है। ऊपर दिए गए फॉर्म से विवरण जमा करें।
                </p>
              ) : latestPayment.status === "verified" ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50/80 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <FileCheck2 className="h-5 w-5 text-emerald-600" />
                      भुगतान सत्यापित हो चुका है (Payment Verified & Seat Confirmed)!
                    </div>
                    <p className="mt-1 text-xs">
                      आपकी फीस सत्यापित कर ली गई है। नीचे दी गई आधिकारिक रसीद प्रिंट करें अथवा सुरक्षित रखें।
                    </p>
                  </div>

                  {/* Render Verified Receipt */}
                  <ReceiptCard
                    studentIdCode={student.studentIdCode}
                    studentName={student.fullName}
                    studentMobile={student.mobile}
                    plan={student.selectedPlan}
                    assignedSeat={student.assignedSeatNumber}
                    amount={latestPayment.amount}
                    utr={latestPayment.utr || "N/A"}
                    paymentDate={latestPayment.createdAt}
                    verifiedBy={latestPayment.verifiedBy}
                    verifiedAt={latestPayment.verifiedAt}
                  />
                </div>
              ) : latestPayment.status === "pending" ? (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Clock className="h-5 w-5 text-amber-600 animate-spin" />
                    भुगतान सत्यापन प्रक्रिया में है (Pending Admin Verification)
                  </div>
                  <p className="mt-1 text-xs">
                    आपने UTR: <strong>{latestPayment.utr}</strong> जमा कर दिया है। व्यवस्थापक द्वारा बैंक खाते में राशि जांचने के बाद आपकी रसीद सक्रिय हो जाएगी।
                  </p>
                  <p className="mt-2 text-xs">
                    जल्द सत्यापन के लिए कृपया पेमेंट का स्क्रीनशॉट व्हाट्सएप पर भेजें:{" "}
                    <a
                      href={`${LIBRARY.whatsappUrl}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline"
                    >
                      WhatsApp 9852688787
                    </a>
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-rose-300 bg-rose-50/80 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                    भुगतान अस्वीकृत (Payment Rejected)
                  </div>
                  <p className="mt-1 text-xs">
                    व्यवस्थापक नोट: {latestPayment.adminNote || "बैंक में UTR मैच नहीं हुआ"}
                  </p>
                  <p className="mt-1 text-xs">
                    कृपया सही UTR नंबर पुनः दर्ज करें अथवा व्यवस्थापक से 9852688787 पर संपर्क करें।
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

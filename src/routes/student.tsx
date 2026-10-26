import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  User,
  ShieldCheck,
  CreditCard,
  Clock,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  MapPin,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
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
  getStudentProfileFn,
  requestRenewalFn,
} from "@/lib/library.functions";

export const Route = createFileRoute("/student")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search["id"] === "string" && search["id"] ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "विद्यार्थी डैशबोर्ड (Student Portal) | " + LIBRARY.nameEn },
      {
        name: "description",
        content: "श्री गणेश डिजिटल लाइब्रेरी - छात्र पोर्टल: सीट आवंटन, सदस्यता अवधि, फीस रसीद एवं उपस्थिति।",
      },
    ],
  }),
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  const search = Route.useSearch();
  const [studentIdInput, setStudentIdInput] = useState(search.id || "SGDL-2026-00001");
  const [mobileInput, setMobileInput] = useState("");
  const [loggedInCode, setLoggedInCode] = useState<string | null>(search.id || "SGDL-2026-00001");

  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "attendance" | "renewal">("overview");

  // Renewal form state
  const [renewalPlan, setRenewalPlan] = useState<SlotType>("morning_half");
  const [renewalUtr, setRenewalUtr] = useState("");

  const lookupProfile = useServerFn(getStudentProfileFn);
  const sendRenewal = useServerFn(requestRenewalFn);

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["student-portal-data", loggedInCode],
    queryFn: () => lookupProfile({ data: { studentIdCode: loggedInCode || undefined } }),
    enabled: Boolean(loggedInCode),
  });

  const student = profileData?.student;
  const payments = profileData?.payments || [];
  const attendance = profileData?.attendance || [];
  const daysRemaining = profileData?.daysRemaining ?? 0;
  const isExpired = profileData?.isExpired ?? false;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const query = studentIdInput.trim() || mobileInput.trim();
    if (!query) {
      toast.error("कृपया अपनी छात्र आईडी या 10 अंकों का मोबाइल नंबर दर्ज करें");
      return;
    }
    setLoggedInCode(query.toUpperCase());
  };

  const handleLogout = () => {
    setLoggedInCode(null);
    setStudentIdInput("");
    setMobileInput("");
    toast.info("लॉगआउट हो गया");
  };

  const renewalMutation = useMutation({
    mutationFn: () =>
      sendRenewal({
        data: {
          studentIdCode: student!.studentIdCode,
          requestedPlan: renewalPlan,
          utr: renewalUtr.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("नवीनीकरण अनुरोध जमा! व्यवस्थापक सत्यापन के बाद अवधि बढ़ा दी जाएगी।");
      setRenewalUtr("");
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || "नवीनीकरण अनुरोध विफल");
    },
  });

  const plan = student ? MEMBERSHIP_PLANS[student.selectedPlan] : MEMBERSHIP_PLANS.morning_half;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {!loggedInCode || !student ? (
          /* Login Card */
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-md">
            <div className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500 bg-amber-50 font-heading text-2xl font-bold text-primary">
                श्री
              </span>
              <h1 className="mt-3 font-heading text-xl font-bold text-primary">
                विद्यार्थी पोर्टल लॉगिन (Student Portal)
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                अपनी छात्र आईडी (Student ID) दर्ज करके डैशबोर्ड एक्सेस करें।
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="login-id" className="text-xs font-semibold">
                  छात्र आईडी (Student ID) *
                </Label>
                <Input
                  id="login-id"
                  required
                  placeholder="उदा. SGDL-2026-00001"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="mt-1.5 font-mono text-sm uppercase"
                />
              </div>

              <div>
                <Label htmlFor="login-mobile" className="text-xs font-semibold">
                  पंजीकृत मोबाइल नंबर (वैकल्पिक)
                </Label>
                <Input
                  id="login-mobile"
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value)}
                  className="mt-1.5 text-sm"
                />
              </div>

              <Button type="submit" className="w-full font-semibold">
                पोर्टल में प्रवेश करें (Enter Dashboard)
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
              नया छात्र?{" "}
              <Link to="/admission" className="font-semibold text-primary underline">
                नया एडमिशन फॉर्म भरें
              </Link>
            </div>
          </div>
        ) : (
          /* Authenticated Student Dashboard */
          <div className="space-y-6">
            {/* Top Bar with Profile Info & Logout */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center gap-4">
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="h-16 w-16 rounded-full border-2 border-primary object-cover shadow-xs"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-primary font-bold text-xl">
                    {student.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                      {student.fullName}
                    </h1>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        student.admissionStatus === "approved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {student.admissionStatus === "approved" ? "सत्यापित (Approved)" : "प्रतीक्षारत (Pending)"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                    छात्र आईडी: <strong className="text-primary">{student.studentIdCode}</strong> | मोबाइल: {student.mobile}
                  </p>
                  {student.parentName && (
                    <p className="text-xs text-muted-foreground">
                      अभिभावक: <strong className="text-foreground">{student.parentName}</strong>
                    </p>
                  )}
                  {student.examGoal && (
                    <p className="text-xs text-muted-foreground">
                      अध्ययन लक्ष्य: <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">{student.examGoal}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    पता: {student.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs text-muted-foreground">
                  <LogOut className="mr-1.5 h-3.5 w-3.5" /> लॉगआउट
                </Button>
              </div>
            </div>

            {/* Quick Membership Banner */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <span className="text-xs font-semibold text-muted-foreground">आबंटित फिजिकल सीट</span>
                <p className="mt-1 font-mono text-2xl font-bold text-primary">
                  {student.assignedSeatNumber}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  (पुस्तकालय अध्ययन कक्ष)
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <span className="text-xs font-semibold text-muted-foreground">सदस्यता स्लॉट एवं समय</span>
                <p className="mt-1 text-base font-bold text-foreground">
                  {plan.nameEn}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {plan.timing}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                <span className="text-xs font-semibold text-muted-foreground">सदस्यता वैधता (Validity)</span>
                <p className="mt-1 text-base font-bold text-foreground">
                  {new Date(student.membershipEndDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className={`mt-0.5 text-xs font-semibold ${isExpired ? "text-rose-600" : "text-emerald-700"}`}>
                  {isExpired ? "सदस्यता समाप्त (Expired)" : `${daysRemaining} दिन शेष (Days Left)`}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
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
                डैशबोर्ड अवलोकन (Overview)
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
                फीस रसीदें (Receipts & Payments)
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
                उपस्थिति लॉग (Attendance Log)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("renewal")}
                className={`py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "renewal"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                सदस्यता नवीनीकरण (Renew)
              </button>
            </div>

            {/* TAB CONTENT */}

            {/* Tab 1: Overview */}
            {activeTab === "overview" && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    त्वरित क्रियाएं (Quick Actions)
                  </h3>
                  <div className="grid gap-3">
                    <Link
                      to="/attendance"
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs font-bold text-foreground">दैनिक उपस्थिति (Attendance Punch)</p>
                          <p className="text-[11px] text-muted-foreground">लाइब्रेरी चेक-इन एवं चेक-आउट करें</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">जाएं →</span>
                    </Link>

                    <Link
                      to="/payment"
                      search={{ code: student.studentIdCode }}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-foreground">शुल्क भुगतान एवं UTR (Pay Fee)</p>
                          <p className="text-[11px] text-muted-foreground">UPI से भुगतान करें या स्क्रीनशॉट भेजें</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">जाएं →</span>
                    </Link>

                    <a
                      href={LIBRARY.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-xs font-bold text-foreground">व्हाट्सएप सहायता (WhatsApp Help)</p>
                          <p className="text-[11px] text-muted-foreground">सीट या फीस संबंधी प्रश्न पूछें (9852688787)</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">संपर्क →</span>
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="font-heading text-base font-bold text-foreground">
                    पुस्तकालय दिशानिर्देश (Guidelines)
                  </h3>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>अध्ययन कक्ष में पूर्ण शांति बनाए रखें। मोबाइल फोन को हमेशा साइलेंट मोड पर रखें।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>केवल अपनी आबंटित सीट (<strong>{student.assignedSeatNumber}</strong>) पर ही बैठें।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>आने पर चेक-इन और जाने पर चेक-आउट करना अनिवार्य है।</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>पुस्तकालय में शुद्ध पेयजल एवं हाई-स्पीड वाई-फाई की सुविधा उपलब्ध है।</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Payments & Receipts */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                {payments.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
                    कोई भुगतान रिकॉर्ड नहीं मिला।{" "}
                    <Link to="/payment" search={{ code: student.studentIdCode }} className="text-primary underline font-semibold">
                      फीस जमा करें
                    </Link>
                  </div>
                ) : (
                  payments.map((p) => (
                    <div key={p.id} className="space-y-4">
                      {p.status === "verified" ? (
                        <ReceiptCard
                          studentIdCode={student.studentIdCode}
                          studentName={student.fullName}
                          studentMobile={student.mobile}
                          plan={student.selectedPlan}
                          assignedSeat={student.assignedSeatNumber}
                          amount={p.amount}
                          utr={p.utr || "N/A"}
                          paymentDate={p.createdAt}
                          verifiedBy={p.verifiedBy}
                          verifiedAt={p.verifiedAt}
                        />
                      ) : (
                        <div className="rounded-xl border border-border bg-card p-4 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-foreground">भुगतान राशि: {formatPrice(p.amount)}</span>
                            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              Pending Verification
                            </span>
                          </div>
                          <p className="mt-1 text-muted-foreground font-mono">UTR: {p.utr || "जमा नहीं"}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Attendance */}
            {activeTab === "attendance" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
                <h3 className="font-heading text-base font-bold text-foreground border-b border-border pb-3">
                  दैनिक उपस्थिति विवरण (कुल उपस्थित: {attendance.length} दिन)
                </h3>
                {attendance.length === 0 ? (
                  <p className="mt-4 text-xs text-muted-foreground text-center py-4">
                    अभी तक कोई उपस्थिति दर्ज नहीं है।
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                          <th className="py-2.5 px-3">तारीख</th>
                          <th className="py-2.5 px-3">सीट</th>
                          <th className="py-2.5 px-3">चेक-इन</th>
                          <th className="py-2.5 px-3">चेक-आउट</th>
                          <th className="py-2.5 px-3">स्थिति</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {attendance.map((a) => (
                          <tr key={a.id}>
                            <td className="py-2.5 px-3 font-medium">{a.attendanceDate}</td>
                            <td className="py-2.5 px-3 font-mono">{a.assignedSeat}</td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700">
                              {new Date(a.checkInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {a.checkOutAt ? new Date(a.checkOutAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-emerald-700">Present</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Renewal */}
            {activeTab === "renewal" && (
              <div className="rounded-xl border border-border bg-card p-6 shadow-xs max-w-xl mx-auto space-y-4">
                <h3 className="font-heading text-base font-bold text-foreground">
                  सदस्यता नवीनीकरण अनुरोध (Membership Renewal)
                </h3>
                <p className="text-xs text-muted-foreground">
                  अगले 1 माह के लिए अपनी सदस्यता आगे बढ़ाएं। नीचे स्लॉट चुनें और UPI भुगतान का UTR दर्ज करें।
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs font-semibold">नवीनीकरण स्लॉट चुनें</Label>
                    <select
                      value={renewalPlan}
                      onChange={(e) => setRenewalPlan(e.target.value as SlotType)}
                      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="morning_half">मॉर्निंग हाफ (7 AM - 12 PM) - ₹400/माह</option>
                      <option value="second_half">सेकंड हाफ (12 PM - 5 PM) - ₹400/माह</option>
                      <option value="full_time">फुल-टाइम (7 AM - 5 PM) - ₹700/माह</option>
                    </select>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                    <p className="font-semibold">UPI ID: {LIBRARY.upiId}</p>
                    <p className="mt-0.5">{LIBRARY.upiInstruction}</p>
                  </div>

                  <div>
                    <Label htmlFor="ren-utr" className="text-xs font-semibold">
                      भुगतान UTR / Transaction ID *
                    </Label>
                    <Input
                      id="ren-utr"
                      required
                      placeholder="12 अंकों का UTR"
                      value={renewalUtr}
                      onChange={(e) => setRenewalUtr(e.target.value)}
                      className="mt-1 font-mono uppercase text-sm"
                    />
                  </div>

                  <Button
                    onClick={() => renewalMutation.mutate()}
                    disabled={renewalMutation.isPending || !renewalUtr.trim()}
                    className="w-full font-semibold"
                  >
                    {renewalMutation.isPending ? "अनुरोध भेजा जा रहा है…" : "नवीनीकरण अनुरोध जमा करें"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

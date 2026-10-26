import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  LogOut,
  LogIn,
  Search,
  Calendar,
  AlertCircle,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LIBRARY } from "@/lib/library";
import {
  checkInAttendanceFn,
  checkOutAttendanceFn,
  getStudentProfileFn,
} from "@/lib/library.functions";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "लाइब्रेरी उपस्थिति (Attendance Management) | " + LIBRARY.nameEn },
      {
        name: "description",
        content: "श्री गणेश डिजिटल लाइब्रेरी - छात्र डिजिटल चेक-इन एवं चेक-आउट उपस्थिति प्रणाली।",
      },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const [studentIdInput, setStudentIdInput] = useState("SGDL-2026-00001");
  const [activeCode, setActiveCode] = useState("SGDL-2026-00001");
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString("en-IN"));

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("en-IN"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const lookupProfile = useServerFn(getStudentProfileFn);
  const checkInFn = useServerFn(checkInAttendanceFn);
  const checkOutFn = useServerFn(checkOutAttendanceFn);

  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["attendance-profile", activeCode],
    queryFn: () => lookupProfile({ data: { studentIdCode: activeCode } }),
    enabled: Boolean(activeCode),
  });

  const student = profileData?.student;
  const todayRecord = profileData?.todayAttendance;
  const attendanceHistory = profileData?.attendance || [];

  const checkInMutation = useMutation({
    mutationFn: () => checkInFn({ data: { studentIdCode: activeCode } }),
    onSuccess: () => {
      toast.success("चेक-इन सफल! आपकी उपस्थिति दर्ज हो गई है।");
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || "चेक-इन विफल रहा");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutFn({ data: { studentIdCode: activeCode } }),
    onSuccess: () => {
      toast.success("चेक-आउट सफल! अध्ययन समय सुरक्षित किया गया।");
      refetch();
    },
    onError: (err: Error) => {
      toast.error(err.message || "चेक-आउट विफल रहा");
    },
  });

  const formatIsoTime = (isoString?: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> डिजिटल उपस्थिति प्रणाली (Attendance Portal)
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold text-primary sm:text-3xl">
            विद्यार्थी उपस्थिति (Check-in & Check-out)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            लाइब्रेरी में प्रवेश करते समय चेक-इन करें तथा अध्ययन समाप्त होने पर चेक-आउट अवश्य करें।
          </p>
        </div>

        {/* Student ID Lookup Bar */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveCode(studentIdInput.trim().toUpperCase());
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <Label htmlFor="att-search" className="text-xs font-semibold">
                छात्र आईडी या मोबाइल नंबर (Student ID or Mobile Number)
              </Label>
              <Input
                id="att-search"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="उदा. SGDL-2026-00001 या 9876543210"
                className="mt-1 font-mono uppercase text-sm"
              />
            </div>
            <Button type="submit" className="sm:self-end">
              <Search className="mr-1.5 h-4 w-4" /> छात्र खोजें
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            उपस्थिति विवरण लोड हो रहा है…
          </div>
        ) : !student ? (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50/50 p-6 text-center text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-600 mb-2" />
            <p className="font-semibold">छात्र रिकॉर्ड नहीं मिला</p>
            <p className="mt-1 text-xs text-muted-foreground">
              कृपया अपनी सही छात्र आईडी (जैसे SGDL-2026-00001) अथवा पंजीकृत 10 अंकों का मोबाइल नंबर दर्ज करें।
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {/* Live Clock & Action Card */}
            <div className="rounded-xl border-2 border-primary/20 bg-card p-6 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <span className="text-xs text-muted-foreground">विद्यार्थी का नाम</span>
                  <h2 className="text-xl font-bold text-foreground">{student.fullName}</h2>
                  <p className="text-xs text-muted-foreground font-mono">
                    आईडी: <strong className="text-primary">{student.studentIdCode}</strong> | आबंटित सीट: <strong>{student.assignedSeatNumber}</strong>
                  </p>
                  {student.examGoal && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      लक्ष्य: <span className="font-semibold text-primary">{student.examGoal}</span>
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground">वर्तमान भारतीय समय (IST)</span>
                  <p className="font-mono text-2xl font-bold text-primary">{currentTime}</p>
                  <p className="text-xs text-muted-foreground">
                    तारीख: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
                  </p>
                </div>
              </div>

              {/* Today's Attendance State Box */}
              <div className="mt-6">
                {!todayRecord ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                    <LogIn className="mx-auto h-10 w-10 text-primary mb-2" />
                    <h3 className="text-base font-bold text-foreground">आज चेक-इन नहीं किया गया है</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      लाइब्रेरी में प्रवेश करने पर नीचे दिए गए बटन से अपनी उपस्थिति दर्ज करें।
                    </p>
                    <Button
                      onClick={() => checkInMutation.mutate()}
                      disabled={checkInMutation.isPending || student.admissionStatus !== "approved"}
                      size="lg"
                      className="mt-4 font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                    >
                      <LogIn className="mr-2 h-5 w-5" /> चेक-इन करें (Punch Check-In)
                    </Button>
                    {student.admissionStatus !== "approved" && (
                      <p className="mt-2 text-xs text-rose-600 font-medium">
                        (एडमिशन स्वीकृत होने के बाद ही उपस्थिति दर्ज की जा सकती है)
                      </p>
                    )}
                  </div>
                ) : todayRecord.checkOutAt === null ? (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/20">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      वर्तमान स्थिति: अध्ययन कक्ष के अंदर (Inside Library)
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      चेक-इन समय: <span className="font-mono text-emerald-700">{formatIsoTime(todayRecord.checkInAt)}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      लाइब्रेरी से बाहर जाते समय चेक-आउट बटन अवश्य दबाएं।
                    </p>
                    <Button
                      onClick={() => checkOutMutation.mutate()}
                      disabled={checkOutMutation.isPending}
                      variant="outline"
                      size="lg"
                      className="mt-4 font-bold border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 px-8"
                    >
                      <LogOut className="mr-2 h-5 w-5" /> चेक-आउट करें (Punch Check-Out)
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-secondary/50 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
                    <h3 className="text-base font-bold text-foreground">
                      आज की उपस्थिति पूर्ण हो चुकी है (Completed Today)
                    </h3>
                    <div className="mt-3 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground font-mono">
                      <span>चेक-इन: <strong className="text-foreground">{formatIsoTime(todayRecord.checkInAt)}</strong></span>
                      <span>चेक-आउट: <strong className="text-foreground">{formatIsoTime(todayRecord.checkOutAt)}</strong></span>
                      <span>स्थिति: <strong className="text-emerald-700">Present (पूर्ण)</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance History Table */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-heading text-lg font-bold text-foreground">
                  आपकी उपस्थिति का इतिहास (Attendance History)
                </h3>
                <span className="text-xs text-muted-foreground font-medium">
                  कुल उपस्थित दिन: {attendanceHistory.length}
                </span>
              </div>

              {attendanceHistory.length === 0 ? (
                <p className="mt-4 text-xs text-muted-foreground text-center py-4">
                  अभी तक कोई पूर्व उपस्थिति रिकॉर्ड नहीं है।
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">तारीख (Date)</th>
                        <th className="py-2.5 px-3">सीट</th>
                        <th className="py-2.5 px-3">चेक-इन</th>
                        <th className="py-2.5 px-3">चेक-आउट</th>
                        <th className="py-2.5 px-3">स्थिति</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {attendanceHistory.map((rec) => (
                        <tr key={rec.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {rec.attendanceDate}
                          </td>
                          <td className="py-2.5 px-3 font-mono">{rec.assignedSeat}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700">
                            {formatIsoTime(rec.checkInAt)}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {formatIsoTime(rec.checkOutAt)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                rec.status === "present"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {rec.status === "present" ? "Present" : "Incomplete"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

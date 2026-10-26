import { Printer, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LIBRARY, MEMBERSHIP_PLANS, formatPrice, type SlotType } from "@/lib/library";

interface ReceiptCardProps {
  studentIdCode: string;
  studentName: string;
  studentMobile: string;
  plan: SlotType;
  assignedSeat: string;
  amount: number;
  utr: string;
  paymentDate: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export function ReceiptCard({
  studentIdCode,
  studentName,
  studentMobile,
  plan,
  assignedSeat,
  amount,
  utr,
  paymentDate,
  verifiedBy,
  verifiedAt,
}: ReceiptCardProps) {
  const planInfo = MEMBERSHIP_PLANS[plan];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl border-2 border-primary/20 bg-card p-6 shadow-md print:border-none print:shadow-none">
      {/* Receipt Header */}
      <div className="border-b border-border pb-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-500 bg-amber-50 font-heading text-lg font-bold text-primary">
            श्री
          </span>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-primary">
            {LIBRARY.nameEn}
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{LIBRARY.address}</p>
        <p className="text-xs text-muted-foreground">
          फोन/व्हाट्सएप: {LIBRARY.phone} | ईमेल: {LIBRARY.email}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          आधिकारिक सदस्यता एवं शुल्क रसीद (Official Fee Receipt)
        </div>
      </div>

      {/* Details Grid */}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">छात्र आईडी (Student ID)</dt>
          <dd className="font-mono text-base font-bold text-primary">{studentIdCode}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">आबंटित सीट (Assigned Seat)</dt>
          <dd className="font-mono text-base font-bold text-foreground">{assignedSeat}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground">विद्यार्थी का नाम (Name)</dt>
          <dd className="font-medium text-foreground">{studentName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">मोबाइल नंबर (Mobile)</dt>
          <dd className="font-medium text-foreground">{studentMobile}</dd>
        </div>

        <div className="col-span-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">सदस्यता स्लॉट (Plan & Slot)</dt>
              <dd className="font-semibold text-foreground">
                {planInfo.nameEn} ({planInfo.timing})
              </dd>
            </div>
            <div className="text-right">
              <dt className="text-xs font-medium text-muted-foreground">मासिक शुल्क (Amount Paid)</dt>
              <dd className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                {formatPrice(amount)}
              </dd>
            </div>
          </div>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground">भुगतान माध्यम (Method)</dt>
          <dd className="font-medium text-foreground">UPI Transfer</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">UTR / Transaction ID</dt>
          <dd className="font-mono text-xs font-bold text-foreground">{utr}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium text-muted-foreground">भुगतान तिथि (Date)</dt>
          <dd className="text-xs text-foreground">
            {new Date(paymentDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">सत्यापन स्थिति (Status)</dt>
          <dd className="flex items-center gap-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED (सत्यापित)
          </dd>
        </div>

        {verifiedBy && (
          <div className="col-span-2 border-t border-border pt-2 text-[11px] text-muted-foreground">
            सत्यापित अधिकारी: {verifiedBy} | समय: {verifiedAt ? new Date(verifiedAt).toLocaleString("en-IN") : ""}
          </div>
        )}
      </dl>

      {/* Footer / Print CTA */}
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 print:hidden">
        <span className="text-xs text-muted-foreground">
          यह डिजिटल रूप से मान्य रसीद है। पुस्तकालय प्रवेश के समय मान्य।
        </span>
        <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" /> रसीद प्रिंट करें (Print)
        </Button>
      </div>
    </div>
  );
}

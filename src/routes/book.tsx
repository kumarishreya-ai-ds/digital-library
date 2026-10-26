import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { SeatGrid } from "@/components/SeatGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LIBRARY,
  MEMBERSHIP_PLANS,
  formatPrice,
  type SlotType,
} from "@/lib/library";
import { getSeatAvailabilityFn } from "@/lib/library.functions";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "20 सीट उपलब्धता एवं बुकिंग | " + LIBRARY.nameEn },
      {
        name: "description",
        content:
          "श्री गणेश डिजिटल लाइब्रेरी में अपनी पसंदीदा सीट (Seat 01 से Seat 20) चुनें। मॉर्निंग, सेकंड हाफ एवं फुल-टाइम स्लॉट्स उपलब्ध।",
      },
    ],
  }),
  component: BookSeatPage,
});

const todayIso = () => new Date().toISOString().slice(0, 10);

function BookSeatPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [selectedSlot, setSelectedSlot] = useState<SlotType>("morning_half");
  const [selectedSeat, setSelectedSeat] = useState<string | null>("Seat 01");

  const fetchAvailability = useServerFn(getSeatAvailabilityFn);

  const {
    data: seatStatuses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["seat-availability", selectedDate, selectedSlot],
    queryFn: () =>
      fetchAvailability({
        data: {
          date: selectedDate,
          slot: selectedSlot,
        },
      }),
  });

  const plan = MEMBERSHIP_PLANS[selectedSlot];
  const currentSeatStatus = seatStatuses.find((s) => s.number === selectedSeat);
  const isCurrentSeatAvailable = currentSeatStatus ? currentSeatStatus.isAvailable : true;

  const handleSeatClick = (seatNumber: string) => {
    setSelectedSeat(seatNumber);
    toast.success(`${seatNumber} चुनी गई`);
  };

  const handleProceedAdmission = () => {
    if (!selectedSeat) {
      toast.error("कृपया पहले एक सीट चुनें");
      return;
    }
    // Navigate to admission with pre-selected slot and seat
    navigate({
      to: "/admission",
      search: {
        seat: selectedSeat,
        slot: selectedSlot,
        date: selectedDate,
      },
    });
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Page Header */}
        <div className="border-b border-border pb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" /> 20 Physical Seats Management
          </span>
          <h1 className="mt-3 font-heading text-2xl font-bold text-primary sm:text-3xl">
            सीट चुनें एवं बुकिंग करें (Seat Booking)
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            लाइब्रेरी में कुल 20 फिजिकल सीटें (Seat 01 से Seat 20) हैं। अपनी अध्ययन तारीख और समय स्लॉट के अनुसार उपलब्ध सीट चुनें।
          </p>
        </div>

        {/* Slot & Date Controls */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Controls Column */}
          <div className="space-y-6 md:col-span-1">
            {/* Date Selection */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <Label htmlFor="booking-date" className="flex items-center gap-2 text-sm font-semibold">
                <CalendarIcon className="h-4 w-4 text-primary" />
                अध्ययन तारीख (Study Date)
              </Label>
              <Input
                id="booking-date"
                type="date"
                min={todayIso()}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSeat(null);
                }}
                className="mt-2 text-sm"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                आज या भविष्य की कोई भी तारीख चुनें।
              </p>
            </div>

            {/* Slot Choice */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                समय स्लॉट एवं शुल्क (Shift / Slot)
              </Label>

              <div className="mt-3 space-y-2.5">
                {(Object.keys(MEMBERSHIP_PLANS) as SlotType[]).map((slotKey) => {
                  const p = MEMBERSHIP_PLANS[slotKey];
                  const isChecked = selectedSlot === slotKey;
                  return (
                    <button
                      key={slotKey}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slotKey);
                        setSelectedSeat(null);
                      }}
                      className={`flex w-full flex-col rounded-lg border-2 p-3 text-left transition-all ${
                        isChecked
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                          : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{p.nameEn}</span>
                        <span className="font-heading text-sm font-bold text-primary">
                          {formatPrice(p.priceMonthly)}/माह
                        </span>
                      </div>
                      <span className="mt-0.5 text-xs text-muted-foreground">{p.timing}</span>
                      <span className="mt-1 text-[11px] text-muted-foreground/80">{p.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Seat Summary Card */}
            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 shadow-xs">
              <h3 className="text-xs font-bold tracking-wider text-primary uppercase">
                चयन सारांश (Selected Summary)
              </h3>
              <dl className="mt-3 divide-y divide-border/60 text-xs">
                <div className="flex justify-between py-1.5">
                  <dt className="text-muted-foreground">सीट संख्या:</dt>
                  <dd className="font-mono font-bold text-foreground">{selectedSeat || "कोई नहीं चुनी"}</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-muted-foreground">स्लॉट:</dt>
                  <dd className="font-medium text-foreground">{plan.nameEn}</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-muted-foreground">समय:</dt>
                  <dd className="font-medium text-foreground">{plan.timing}</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-muted-foreground">मासिक शुल्क:</dt>
                  <dd className="font-heading font-bold text-base text-primary">
                    {formatPrice(plan.priceMonthly)}
                  </dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-muted-foreground">स्थिति:</dt>
                  <dd className={`font-semibold ${isCurrentSeatAvailable ? "text-emerald-700" : "text-rose-700"}`}>
                    {isCurrentSeatAvailable ? "उपलब्ध (Available)" : "अनुपलब्ध (Occupied)"}
                  </dd>
                </div>
              </dl>

              {!isCurrentSeatAvailable && currentSeatStatus?.occupiedReason && (
                <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                  ⚠️ <strong>सीट टकराव (Conflict):</strong> {currentSeatStatus.occupiedReason}
                </div>
              )}

              {isCurrentSeatAvailable && selectedSeat && (
                <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50/70 p-2 text-[11px] text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                  ⏱️ <strong>होल्ड रिज़र्वेशन:</strong> एडमिशन फॉर्म पूरा करने हेतु 15 मिनट का अस्थाई होल्ड उपलब्ध।
                </div>
              )}

              <div className="mt-4 space-y-2">
                <Button
                  type="button"
                  disabled={!selectedSeat || !isCurrentSeatAvailable}
                  onClick={handleProceedAdmission}
                  className="w-full font-semibold"
                >
                  <UserCheck className="mr-2 h-4 w-4" /> एडमिशन फॉर्म भरें
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  सीट चुनकर छात्र एडमिशन फॉर्म भरें और तुरंत स्टूडेंट आईडी पाएं।
                </p>
              </div>
            </div>
          </div>

          {/* Seat Grid Column */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  पुस्तकालय सीट नक्शा (Hall Layout)
                </h2>
                <p className="text-xs text-muted-foreground">
                  सीट पर क्लिक करके अपनी पसंदीदा सीट चुनें।
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs">
                ताज़ा करें (Refresh)
              </Button>
            </div>

            <SeatGrid
              seats={seatStatuses}
              selectedSeat={selectedSeat}
              onSelectSeat={handleSeatClick}
              isLoading={isLoading}
            />

            {/* Overlap & Conflict Rules Explanatory Box */}
            <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
              <h4 className="font-semibold text-foreground">📌 सीट बुकिंग एवं स्लॉट नियम:</h4>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>
                  <strong>मॉर्निंग हाफ</strong> (7 AM - 12 PM) और <strong>सेकंड हाफ</strong> (12 PM - 5 PM) का समय अलग-अलग है, इसलिए एक ही सीट दो अलग-अलग छात्रों द्वारा दोनों हाफ में ली जा सकती है।
                </li>
                <li>
                  <strong>फुल-टाइम</strong> (7 AM - 5 PM) चुनने पर वह सीट पूरे दिन के लिए ब्लॉक हो जाती है और दोनों हाफ लॉक हो जाते हैं।
                </li>
                <li>
                  सीट का पक्का आवंटन व्यवस्थापक द्वारा फीस सत्यापन के पश्चात ही मान्य होगा।
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

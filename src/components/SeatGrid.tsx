import { Armchair, Check, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SeatStatus {
  number: string; // e.g. "Seat 01"
  label: string;
  row: number;
  col: number;
  isAvailable: boolean;
  occupiedReason: string | null;
  holdExpiresAt?: string | null;
}

interface SeatGridProps {
  seats: SeatStatus[];
  selectedSeat: string | null;
  onSelectSeat: (seatNumber: string) => void;
  isLoading?: boolean;
}

export function SeatGrid({ seats, selectedSeat, onSelectSeat, isLoading }: SeatGridProps) {
  return (
    <div className="space-y-4">
      {/* Hall Front Indicator */}
      <div className="mx-auto flex max-w-md items-center justify-center rounded-md border border-dashed border-border bg-muted/40 py-1.5 text-xs font-medium text-muted-foreground">
        <span>📖 मुख्य अध्ययन कक्ष — प्रवेश द्वार (Front / Entrance)</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:gap-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex h-20 animate-pulse flex-col items-center justify-center rounded-lg border border-border bg-muted/50 p-2"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card/60 p-4 shadow-xs">
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:gap-3.5">
            {seats.map((seat) => {
              const isSelected = selectedSeat === seat.number;
              const isHold = !seat.isAvailable && Boolean(seat.holdExpiresAt);
              const isOccupied = !seat.isAvailable && !isHold;

              return (
                <button
                  key={seat.number}
                  type="button"
                  disabled={!seat.isAvailable}
                  onClick={() => onSelectSeat(seat.number)}
                  title={
                    isOccupied
                      ? seat.occupiedReason || "यह सीट बुक है"
                      : isHold
                        ? "यह सीट अस्थाई रूप से रिज़र्व है"
                        : "सीट उपलब्ध है (क्लिक करके चुनें)"
                  }
                  className={cn(
                    "group relative flex h-20 flex-col items-center justify-between rounded-lg border-2 p-2 text-center transition-all",
                    seat.isAvailable && !isSelected &&
                      "border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200",
                    isSelected &&
                      "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40",
                    isHold &&
                      "cursor-not-allowed border-amber-300 bg-amber-50/70 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
                    isOccupied &&
                      "cursor-not-allowed border-rose-200 bg-rose-50/60 text-rose-800 opacity-80 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-mono text-xs font-bold tracking-tight">
                      {seat.number.replace("Seat ", "S-")}
                    </span>
                    {isSelected ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-primary">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    ) : isHold ? (
                      <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                    ) : isOccupied ? (
                      <Lock className="h-3.5 w-3.5 text-rose-600" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  <Armchair
                    className={cn(
                      "h-6 w-6 transition-transform group-hover:scale-105",
                      isSelected && "text-primary-foreground",
                      seat.isAvailable && !isSelected && "text-emerald-700 dark:text-emerald-400",
                      isHold && "text-amber-700 dark:text-amber-400",
                      isOccupied && "text-rose-600/80 dark:text-rose-400/80",
                    )}
                  />

                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {isSelected
                      ? "Selected"
                      : isHold
                        ? "Hold"
                        : isOccupied
                          ? "Booked"
                          : "Free"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Central Aisle / Walkway note */}
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <span className="inline-block h-1.5 w-12 rounded-full bg-border" />
            <span>बीच का रास्ता (Central Walkway / Aisle)</span>
            <span className="inline-block h-1.5 w-12 rounded-full bg-border" />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
          <span className="h-3 w-3 rounded-sm border border-emerald-500 bg-emerald-100 dark:bg-emerald-950" />
          उपलब्ध (Available)
        </div>
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <span className="h-3 w-3 rounded-sm border border-primary bg-primary" />
          चुनी गई (Selected)
        </div>
        <div className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
          <span className="h-3 w-3 rounded-sm border border-amber-400 bg-amber-100 dark:bg-amber-950" />
          अस्थाई होल्ड (Hold)
        </div>
        <div className="flex items-center gap-1.5 font-medium text-rose-800 dark:text-rose-300">
          <span className="h-3 w-3 rounded-sm border border-rose-400 bg-rose-100 dark:bg-rose-950" />
          बुक / आरक्षित (Booked)
        </div>
      </div>
    </div>
  );
}

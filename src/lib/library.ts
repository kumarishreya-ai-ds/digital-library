export const LIBRARY = {
  nameHi: "श्री गणेश लाइब्रेरी",
  nameEn: "Shri Ganesh Library",
  tagline: "नया रूप, नई सुविधाएं!",
  building: "खुद्रा लाइट ऑफ इंडिया भवन",
  phone: "9852688787",
  subtext: "शांत, सुरक्षित और सुविधाजनक अध्ययन वातावरण",
} as const;

export const FACILITIES = [
  { hi: "AC / Cooler", en: "ठंडा और आरामदायक माहौल" },
  { hi: "CCTV Security", en: "पूरे परिसर में CCTV निगरानी" },
  { hi: "Free Wi-Fi", en: "पढ़ाई के लिए मुफ्त इंटरनेट" },
  { hi: "Comfortable Seating", en: "आरामदायक कुर्सी और टेबल" },
  { hi: "शांत अध्ययन वातावरण", en: "बिना शोर, एकाग्र पढ़ाई" },
  { hi: "Spacious Study Area", en: "खुला और बड़ा अध्ययन कक्ष" },
] as const;

export const ENTRY_TYPE_LABEL: Record<"half_day" | "full_day", string> = {
  half_day: "Half Day (आधा दिन)",
  full_day: "Full Day (पूरा दिन)",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending – verification बाकी",
  verified: "Verified",
  rejected: "Rejected",
};

export function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  return `₹${Number(value).toFixed(0)}`;
}

export function buildUpiLink(opts: {
  upiId: string;
  receiverName: string | null;
  amount: number | null;
  note?: string;
}) {
  const params = new URLSearchParams();
  params.set("pa", opts.upiId);
  params.set("pn", opts.receiverName || "Shri Ganesh Library");
  params.set("cu", "INR");
  if (opts.amount !== null && opts.amount !== undefined && opts.amount > 0) {
    params.set("am", Number(opts.amount).toFixed(2));
  }
  if (opts.note) params.set("tn", opts.note);
  return `upi://pay?${params.toString()}`;
}

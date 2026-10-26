export const LIBRARY = {
  nameHi: "श्री गणेश डिजिटल लाइब्रेरी",
  nameEn: "Shree Ganesh Digital Library",
  tagline: "नया रूप, नई सुविधाएं!",
  building: "खुद्रा, पचलखी, सीवान, बिहार",
  address: "Khudra, Pachlakhi, Siwan, Bihar, India",
  phone: "9852688787",
  email: "kumarishreya70610@gmail.com",
  upiId: "7061038932-p36a@ibl",
  upiInstruction: "Payment karne ke baad, kripya payment ka screenshot WhatsApp par 9852688787 par bhej dein.",
  whatsappUrl: "https://wa.me/919852688787",
  subtext: "शांत, सुरक्षित और सुविधाजनक अध्ययन वातावरण — डिजिटल सुविधाओं के साथ",
} as const;

export type SlotType = "morning_half" | "second_half" | "full_time";

export interface MembershipPlan {
  id: SlotType;
  nameHi: string;
  nameEn: string;
  timing: string;
  priceMonthly: number;
  description: string;
}

export const MEMBERSHIP_PLANS: Record<SlotType, MembershipPlan> = {
  morning_half: {
    id: "morning_half",
    nameHi: "मॉर्निंग हाफ स्लॉट",
    nameEn: "Morning Half Slot",
    timing: "7:00 AM – 12:00 PM",
    priceMonthly: 400,
    description: "सुबह 7 बजे से दोपहर 12 बजे तक — शांत और ताज़ा अध्ययन माहौल।",
  },
  second_half: {
    id: "second_half",
    nameHi: "सेकंड हाफ स्लॉट",
    nameEn: "Second Half Slot",
    timing: "12:00 PM – 5:00 PM",
    priceMonthly: 400,
    description: "दोपहर 12 बजे से शाम 5 बजे तक — दोपहर और शाम की केंद्रित पढ़ाई।",
  },
  full_time: {
    id: "full_time",
    nameHi: "फुल-टाइम स्लॉट",
    nameEn: "Full-Time Slot",
    timing: "7:00 AM – 5:00 PM",
    priceMonthly: 700,
    description: "पूरे दिन सुबह 7 से शाम 5 बजे तक निर्बाध अध्ययन के लिए सर्वश्रेष्ठ।",
  },
};

/** All 20 physical seats */
export const PHYSICAL_SEATS = Array.from({ length: 20 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, "0");
  return {
    id: `seat-${num}`,
    number: `Seat ${num}`,
    label: `Seat ${num}`,
    row: Math.floor(i / 5) + 1,
    col: (i % 5) + 1,
  };
});

export const FACILITIES = [
  { hi: "Quiet Study Environment", en: "शांत एवं एकाग्र वातावरण", desc: "शोर-शराबे से दूर पूर्ण एकाग्रता के साथ अध्ययन।" },
  { hi: "AC / Cooler", en: "ठंडा और आरामदायक माहौल", desc: "गर्मी के मौसम में भी कूलिंग और वेंटिलेशन की सुविधा।" },
  { hi: "CCTV Security", en: "24x7 CCTV निगरानी", desc: "परिसर में छात्र-छात्राओं की सुरक्षा के लिए कैमरे।" },
  { hi: "High-Speed Free Wi-Fi", en: "हाई-स्पीड मुफ्त इंटरनेट", desc: "ऑनलाइन लेक्चर्स और स्टडी मैटेरियल डाउनलोड करने हेतु।" },
  { hi: "Comfortable Seating", en: "आरामदायक कुर्सी और टेबल", desc: "लंबे समय तक पढ़ाई के लिए आरामदायक अध्ययन डेस्क।" },
  { hi: "Spacious Study Area", en: "खुला और बड़ा अध्ययन कक्ष", desc: "व्यक्तिगत स्पेस और पर्याप्त रोशनी के साथ।" },
  { hi: "RO Drinking Water", en: "स्वच्छ आरओ पेयजल", desc: "हमेशा शुद्ध और ठंडा पेयजल उपलब्ध।" },
  { hi: "Charging Point", en: "हर डेस्क पर चार्जिंग सॉकेट", desc: "लैपटॉप और मोबाइल चार्जिंग की सीधी सुविधा।" },
] as const;

export const ENTRY_TYPE_LABEL: Record<string, string> = {
  morning_half: "Morning Half (7:00 AM–12:00 PM)",
  second_half: "Second Half (12:00 PM–5:00 PM)",
  full_time: "Full-Time (7:00 AM–5:00 PM)",
  half_day: "Half Day Slot (₹400/month)",
  full_day: "Full-Time Slot (₹700/month)",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Pending – सत्यापन बाकी",
  verified: "Verified – स्वीकृत",
  rejected: "Rejected – अस्वीकृत",
};

export function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return `₹${Number(value).toFixed(0)}`;
}

export function buildUpiLink(opts: {
  upiId?: string;
  receiverName?: string | null;
  amount: number | null;
  note?: string;
}) {
  const params = new URLSearchParams();
  params.set("pa", opts.upiId || LIBRARY.upiId);
  params.set("pn", opts.receiverName || LIBRARY.nameEn);
  params.set("cu", "INR");
  if (opts.amount !== null && opts.amount !== undefined && opts.amount > 0) {
    params.set("am", Number(opts.amount).toFixed(2));
  }
  if (opts.note) params.set("tn", opts.note);
  return `upi://pay?${params.toString()}`;
}

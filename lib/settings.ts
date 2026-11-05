import type { HoursDay } from "./open-now";

export type ShopSettings = {
  businessName: string;
  ownerName: string;
  town: string;
  region: string;
  country: string;
  currency: string;
  locale: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  mapUrl: string;
  hours: HoursDay[];
  announcement: string;
  announcementLive: boolean;
  heroHeadline: string;
  heroText: string;
  heroImage: string;
  heroFocalX: number;
  heroFocalY: number;
  story: string;
  ownerPhoto: string;
  paymentNote: string;
  responseNote: string;
  whatsappChannel: string;
  instagram: string;
  facebook: string;
  enquiryRetentionDays: number;
  copyNeedsApproval: boolean;
  lastBackupAt: string;
  policies: { buying: string; collection: string; returns: string };
  leadTime: string;
  holds: string;
  commissions: string;
  faqs: { q: string; a: string }[];
  theme: "walnut" | "clay" | "ink";
  fontPair: "fraunces" | "newsreader";
  checklist: Record<string, boolean>;
};

export const defaultSettings: ShopSettings = {
  businessName: "Ajja",
  ownerName: "Ajja",
  town: "Collegeville",
  region: "Pennsylvania",
  country: "United States",
  currency: "USD",
  locale: "en",
  whatsapp: "",
  phone: "",
  email: "",
  address: "",
  mapUrl: "https://maps.google.com/?q=Collegeville%2C%20Pennsylvania",
  hours: [],
  announcement: "",
  announcementLive: false,
  heroHeadline: "Objects shaped by patience, poured pigment, and timber.",
  heroText:
    "A family studio in Collegeville, Pennsylvania. Every piece is photographed as it is and held in the studio until collected. Nothing is bought on this site — you ask, we answer.",
  heroImage: "",
  heroFocalX: 0.5,
  heroFocalY: 0.45,
  story:
    "Every piece here is made by hand in Collegeville. The photographs are the listing — a piece with no price is simply a piece you ask about.",
  ownerPhoto: "",
  paymentNote: "Payment is arranged with me directly. This website does not take payment.",
  responseNote: "",
  whatsappChannel: "",
  instagram: "",
  facebook: "",
  enquiryRetentionDays: 365,
  copyNeedsApproval: true,
  lastBackupAt: "",
  policies: {
    buying:
      "You ask first. I confirm the price and whether the piece is still here. Nothing is paid through this website.",
    collection:
      "Pieces can be collected in Collegeville once we agree a time. Shipping only happens if we arrange it.",
    returns:
      "These are single pieces. A sale is final once you have the piece, unless we agree otherwise in writing.",
  },
  leadTime: "",
  holds: "",
  commissions: "",
  faqs: [
    {
      q: "How do I buy a piece?",
      a: "Send a message. I tell you the price and whether it is still here. You do not pay on this website.",
    },
    {
      q: "Where is the studio?",
      a: "Private studio in Collegeville, Pennsylvania. Studio viewings are welcomed by appointment. Inquire below to arrange a visit.",
    },
  ],
  theme: "walnut",
  fontPair: "fraunces",
  checklist: {},
};

export function withDefaults(value: unknown): ShopSettings {
  const raw = value && typeof value === "object" ? (value as Partial<ShopSettings>) : {};
  return {
    ...defaultSettings,
    ...raw,
    policies: { ...defaultSettings.policies, ...(raw.policies ?? {}) },
    faqs: Array.isArray(raw.faqs) ? raw.faqs : defaultSettings.faqs,
    leadTime: raw.leadTime ?? "",
    holds: raw.holds ?? "",
    commissions: raw.commissions ?? "",
    hours: raw.hours ?? [],
    checklist: raw.checklist ?? {},
  };
}

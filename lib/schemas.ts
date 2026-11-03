import { z } from "zod";

export const enquirySchema = z.object({
  name: z.string().trim().min(1, "Add your name.").max(120),
  contact: z
    .string()
    .trim()
    .min(3, "Add a phone number or email.")
    .max(200)
    .refine((value) => value.includes("@") || value.replace(/\D/g, "").length >= 7, "Add a phone number or email."),
  subject: z.string().trim().max(300).optional().default(""),
  message: z.string().trim().min(1, "Write a short message.").max(2000),
  giftNote: z.string().trim().max(500).optional().default(""),
  quantity: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(1).max(999).optional(),
  ),
  bulk: z.boolean().optional().default(false),
  productId: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().uuid().optional(),
  ),
  company: z.string().optional().default(""),
});

export const pieceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(160).default(""),
  description: z.string().trim().max(5000).default(""),
  price: z.string().trim().max(20).default(""),
  compare: z.string().trim().max(20).default(""),
  categoryId: z.string().uuid().or(z.literal("")).default(""),
  condition: z.string().trim().max(40).default(""),
  size: z.string().trim().max(120).default(""),
  details: z.string().trim().max(2000).default(""),
  quantity: z.string().trim().max(6).default(""),
  sku: z.string().trim().max(60).default(""),
  tags: z.string().trim().max(300).default(""),
  status: z.enum(["draft", "scheduled", "published", "sold", "hidden"]),
  publishAt: z.string().trim().default(""),
  featured: z.boolean().default(false),
  showInStudio: z.boolean().default(true),
  internalNotes: z.string().trim().max(5000).default(""),
});

export const passwordSignInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter an email address.").max(200),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const passwordChangeSchema = z
  .object({
    current: z.string().max(200).default(""),
    next: z.string().min(12, "Use at least 12 characters.").max(200),
    confirm: z.string().max(200),
  })
  .refine((value) => value.next === value.confirm, { message: "The two new passwords are different.", path: ["confirm"] });

import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
});

const productionKeys = ["ADMIN_PATH", "SESSION_SECRET", "CRON_SECRET", "BLOB_READ_WRITE_TOKEN"] as const;

export function assertEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Shop environment is incomplete: DATABASE_URL.");
  }
  if (process.env.NODE_ENV !== "production") return;
  const missing = productionKeys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing production environment: ${missing.join(", ")}`);
  }
}

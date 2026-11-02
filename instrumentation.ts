export async function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { assertEnv } = await import("./lib/env");
  assertEnv();
}

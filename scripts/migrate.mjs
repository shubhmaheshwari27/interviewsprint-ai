// Runs `prisma migrate deploy` during the build.
// If the database was originally created with `prisma db push` (no migration
// history, Prisma error P3005), the first migration is marked as already
// applied ("baselined") and the deploy is retried, so only the new migrations run.
import { execSync } from "node:child_process"

const run = (cmd) => execSync(cmd, { stdio: "pipe", encoding: "utf8" })

if (!process.env.DATABASE_URL) {
  console.log("[migrate] DATABASE_URL not set - skipping migrations.")
  process.exit(0)
}

try {
  console.log(run("npx prisma migrate deploy"))
} catch (error) {
  const output = `${error.stdout ?? ""}${error.stderr ?? ""}`
  if (!output.includes("P3005")) {
    console.error(output)
    process.exit(1)
  }
  console.log("[migrate] Existing database without migration history - baselining the initial migration.")
  console.log(run("npx prisma migrate resolve --applied 20260507110243_init"))
  console.log(run("npx prisma migrate deploy"))
}

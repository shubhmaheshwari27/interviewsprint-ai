# SECURITY_GUIDELINES.md

## Purpose

Defines all security requirements and implementation patterns for InterviewSprint AI. Every item listed here must be implemented. This is not aspirational — it's required.

---

## Authentication Security

### Password Hashing

Passwords are hashed with **bcryptjs** at 10 rounds before storage. Plaintext passwords are NEVER stored.

```typescript
import bcrypt from "bcryptjs"

// Registration
const hashedPassword = await bcrypt.hash(password, 10)

// Login verification
const isValid = await bcrypt.compare(inputPassword, storedHash)
```

### JWT Secret Strength

`AUTH_SECRET` must be at minimum 32 characters. Generate with:

```bash
openssl rand -base64 32
```

The `AUTH_SECRET` is used to sign JWT tokens. If compromised, all sessions are invalidated by rotating the secret.

### Session Expiration

Auth.js default JWT session maxAge is 30 days. This is acceptable for a personal productivity app. No change needed.

---

## Authorization: Data Isolation

**Every database query that reads or mutates user data MUST include `userId` in the `where` clause.**

This prevents horizontal privilege escalation (user A accessing user B's data).

```typescript
// ✅ Correct: userId in where clause
await prisma.application.findFirst({
  where: { id: applicationId, userId: session.user.id }
})

// ❌ Wrong: only filtering by id
await prisma.application.findUnique({
  where: { id: applicationId }
})
```

Use `findFirst` (not `findUnique`) when filtering by both `id` and `userId`, since `findUnique` only works with unique fields.

Use `updateMany`/`deleteMany` instead of `update`/`delete` to enforce ownership in a single query:

```typescript
// Safe update — only updates if userId matches
const result = await prisma.application.updateMany({
  where: { id, userId: session.user.id },
  data: updatedFields,
})
// result.count === 0 means not found or not owned
```

---

## Input Validation

All external inputs are validated with **Zod** before any processing.

Validation points:
1. Server Actions — validate `FormData` before DB write.
2. Route Handler bodies — validate JSON body before processing.
3. URL search params — sanitize in Server Components before Prisma queries.

```typescript
// URL param sanitization
const rawStatus = searchParams.status
const status = ApplicationStatusEnum.safeParse(rawStatus).success
  ? (rawStatus as ApplicationStatus)
  : undefined

const rawPage = parseInt(searchParams.page ?? "1", 10)
const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
```

---

## Environment Variables

| Variable | Exposure | Validation |
|---|---|---|
| `DATABASE_URL` | Server only | Must not be committed |
| `AUTH_SECRET` | Server only | Minimum 32 characters |
| `AUTH_GOOGLE_ID` | Server only | Required for OAuth |
| `AUTH_GOOGLE_SECRET` | Server only | Required for OAuth |
| `GEMINI_API_KEY` | Server only | Required for AI features |
| `NEXT_PUBLIC_APP_URL` | Client + server | OK to expose |

`.env.local` is listed in `.gitignore` and MUST NOT be committed to the repository.

`.env.example` lists all required variables with placeholder values and IS committed:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/interviewsprint"
AUTH_SECRET="REPLACE_WITH_32_CHAR_SECRET"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="REPLACE_WITH_GOOGLE_CLIENT_ID"
AUTH_GOOGLE_SECRET="REPLACE_WITH_GOOGLE_CLIENT_SECRET"
GEMINI_API_KEY="REPLACE_WITH_GEMINI_API_KEY"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## CSRF Protection

Auth.js automatically handles CSRF protection for credential login via a hidden CSRF token included in the sign-in form. No manual implementation required.

Server Actions are protected against CSRF by Next.js via the `Origin` header check. Server Actions only accept requests from the same origin.

---

## Rate Limiting (AI Endpoint)

The `/api/ai/analyze` endpoint is rate-limited to 5 requests per user per 60 seconds using an in-memory token bucket (see `lib/rate-limiter.ts`).

Purpose: Prevent abuse of the Gemini API quota.

Implementation details are in `AI_FEATURES.md`.

---

## HTTP Headers

Next.js sets security headers by default. Add the following to `next.config.ts` for additional coverage:

```typescript
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}

export default nextConfig
```

---

## Logging and Error Exposure

- Server errors are logged to console (visible in Vercel logs) but NEVER returned raw to the client.
- Stack traces are never included in API responses.
- User-facing error messages are generic for unexpected errors: "Something went wrong. Please try again."
- Specific, actionable messages are used for expected errors (validation, not found, etc.).

---

## SQL Injection

Prisma uses parameterized queries by default. Raw SQL is NOT used anywhere in this project.

Do not use `prisma.$queryRaw` or `prisma.$executeRaw` unless absolutely necessary. If used, always use tagged template literals (Prisma's safe API):

```typescript
// ✅ Safe: Prisma parameterizes this automatically
prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`

// ❌ Unsafe: never do this
prisma.$queryRawUnsafe(`SELECT * FROM users WHERE id = '${userId}'`)
```

---

## Dependency Security

Run `npm audit` periodically to check for known vulnerabilities in dependencies. Fix `high` and `critical` severity issues before deployment.

---

## Google OAuth Security

- Authorized redirect URIs must be configured in Google Cloud Console to only allow:
  - `http://localhost:3000/api/auth/callback/google` (development)
  - `https://your-production-domain.vercel.app/api/auth/callback/google` (production)
- Do not add wildcard redirect URIs.

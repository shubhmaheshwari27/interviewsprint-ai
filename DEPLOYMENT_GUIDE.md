# DEPLOYMENT_GUIDE.md

## Purpose

Defines the complete deployment process for InterviewSprint AI on Vercel. Covers production database setup, environment variable configuration, CI/CD pipeline, and post-deployment verification.

---

## Deployment Stack

| Concern | Service |
|---|---|
| Hosting | Vercel |
| Database | Neon (PostgreSQL, serverless) |
| CI/CD | GitHub → Vercel automatic deployment |
| Domain | Vercel subdomain (or custom) |

**Neon** is the recommended PostgreSQL provider because:
- Free tier is generous.
- Serverless connection pooling works well with Vercel serverless functions.
- Direct `DATABASE_URL` connection string compatible with Prisma.

Alternative: **Railway** or **Supabase** (use the direct connection string, not the connection pooler URL, for Prisma compatibility).

---

## Step 1: Database Setup (Neon)

1. Create a free account at [neon.tech](https://neon.tech).
2. Create a new project named `interviewsprint`.
3. Copy the **connection string** from the dashboard. It looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this as `DATABASE_URL` in Vercel environment variables (Step 3).

---

## Step 2: GitHub Repository

1. Create a new GitHub repository.
2. Push the project code:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/your-username/interviewsprint-ai.git
   git push -u origin main
   ```

---

## Step 3: Vercel Project Setup

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import the GitHub repository.
3. Framework: **Next.js** (auto-detected).
4. Build command: `npx prisma generate && next build`
   - Configure in Vercel project settings → Build & Development Settings → Override Build Command.
5. Add all environment variables in **Settings → Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` for a value |
| `AUTH_URL` | `https://your-project.vercel.app` |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `GEMINI_API_KEY` | Gemini API key from Google AI Studio |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |

6. Click **Deploy**.

---

## Step 4: Run Database Migrations

After first deployment, run migrations against the production database:

**Option A:** Run locally with production `DATABASE_URL`

```bash
DATABASE_URL="your-neon-connection-string" npx prisma migrate deploy
```

**Option B:** Add migration to build command

In Vercel project settings → Build & Development Settings → Build Command:

```
npx prisma generate && npx prisma migrate deploy && next build
```

`migrate deploy` applies pending migrations to the production database. It does NOT reset data.

---

## Step 5: Google OAuth — Update Authorized Redirect URIs

In [Google Cloud Console](https://console.cloud.google.com):

1. Navigate to APIs & Services → Credentials → Your OAuth 2.0 Client.
2. Add to **Authorized JavaScript origins**:
   - `https://your-project.vercel.app`
3. Add to **Authorized redirect URIs**:
   - `https://your-project.vercel.app/api/auth/callback/google`
4. Save.

---

## CI/CD Pipeline

Vercel auto-deploys on every push to `main`:

```
Developer pushes to main
    ↓
GitHub webhook triggers Vercel
    ↓
Vercel runs: npx prisma generate && next build
    ↓
Deployment completes (typically < 2 minutes)
    ↓
New version live at production URL
```

**Preview deployments:** Vercel also creates preview deployments for every pull request. These use the same environment variables (or can have separate ones configured in Vercel).

---

## Post-Deployment Verification Checklist

After each production deployment, verify:

- [ ] Landing page loads at production URL.
- [ ] Google OAuth login works (redirect to Google → callback to dashboard).
- [ ] Email/password login works with test credentials.
- [ ] Creating a new application works.
- [ ] Application list shows with correct data.
- [ ] AI analysis returns results (requires `GEMINI_API_KEY` is set correctly).
- [ ] Dashboard charts render.
- [ ] Unauthenticated access to `/dashboard` redirects to `/login`.

---

## `vercel.json`

```json
{
  "buildCommand": "npx prisma generate && next build",
  "framework": "nextjs"
}
```

---

## `next.config.ts`

```typescript
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
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile images
      },
    ],
  },
}

export default nextConfig
```

---

## Environment Variable Notes

- `AUTH_URL` must be set to the exact production URL (no trailing slash) for Auth.js to generate correct callback URLs.
- If using Neon, append `?sslmode=require` to the `DATABASE_URL` if not already present.
- `AUTH_SECRET` must match between deployments. Changing it invalidates all existing sessions.

---

## Rollback

To roll back a broken deployment:

1. Go to Vercel Dashboard → Deployments.
2. Find the last working deployment.
3. Click the three-dot menu → **Promote to Production**.

This instantly switches production traffic to the previous build.

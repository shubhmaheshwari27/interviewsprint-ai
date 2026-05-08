# Deployment Guide - InterviewSprint AI

This guide covers the steps required to deploy the InterviewSprint AI platform to a production environment.

## 🚀 Recommended Platform: Vercel

Vercel is the recommended deployment platform for Next.js applications due to its seamless integration and support for edge features.

### 1. Database Setup

- Provision a managed PostgreSQL database (e.g., [Neon](https://neon.tech/), [Supabase](https://supabase.com/)).
- Copy the connection string (DATABASE_URL).

### 2. Environment Variables

Configure the following environment variables in your Vercel project:

```env
# Database
DATABASE_URL="your-production-db-url"

# Auth.js
AUTH_SECRET="your-generated-secret"
AUTH_URL="https://your-domain.vercel.app"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# AI
OPENAI_API_KEY="your-openai-api-key"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### 3. Google OAuth Configuration

- Go to the [Google Cloud Console](https://console.cloud.google.com/).
- In "APIs & Services" > "Credentials", update your OAuth 2.0 Client ID:
  - **Authorized JavaScript origins**: `https://your-domain.vercel.app`
  - **Authorized redirect URIs**: `https://your-domain.vercel.app/api/auth/callback/google`

### 4. Build Configuration

Ensure your build command in Vercel is set to:
`npx prisma generate && next build`

## 🛠️ Post-Deployment

### Database Migrations

Run the following command once to initialize your production database schema:
`npx prisma migrate deploy`

### Monitoring

- Use **Vercel Logs** to monitor server-side errors.
- Check the **Prisma Studio** (if accessible) or your database provider's dashboard to verify data persistence.

## 🏁 Success!

Your AI-powered career assistant is now live and ready to help users land their dream jobs.

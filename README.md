# 🚀 InterviewSprint AI

**InterviewSprint AI** is a professional, full-stack career management platform designed to streamline the job search process. By combining robust application tracking with advanced AI insights, it helps job seekers stay organized and prepare effectively for their next big role.

![Banner Section](https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=2000)

## ✨ Core Features

- **📊 Centralized Dashboard**: Real-time analytics on your application status distribution and recent activity.
- **📝 Application Management**: Full CRUD operations for job applications with detailed tracking (Role, Company, Salary, Tech Stack).
- **📅 Interview Timeline**: Manage multiple interview rounds per application with status updates and notes.
- **🤖 AI-Powered Analysis**: Leverage **OpenAI GPT-4o** to:
  - Generate customized interview questions based on the Job Description (JD).
  - Identify skill gaps and receive actionable improvement advice.
  - Create a 4-week preparation roadmap tailored to the specific role.
- **🔐 Secure Authentication**: Integrated Auth.js v5 supporting both Google OAuth and traditional credentials.
- **🔍 Advanced Filtering**: Search and filter applications by status, company name, or role title.

## 🛠️ Technical Architecture

Built with a modern, scalable stack focusing on performance and type safety:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Auth.js v5](https://authjs.dev/) (NextAuth)
- **AI Integration**: [OpenAI API](https://openai.com/)
- **Validation**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- **Visualizations**: [Recharts](https://recharts.org/)

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL instance (Local or [Neon](https://neon.tech/))
- Google Cloud Project (for OAuth)
- OpenAI API Key

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/interviewsprint-ai.git
   cd interviewsprint-ai
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/interviewsprint"

   # Auth.js
   AUTH_SECRET="your-32-char-secret"
   AUTH_URL="http://localhost:3000"

   # Google OAuth
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"

   # AI
   OPENAI_API_KEY="your-openai-api-key"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

3. **Database Migration**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Run Development**
   ```bash
   npm run dev
   ```

## 📐 Project Structure

```bash
├── app/                # Next.js App Router (Auth, Dashboard, API)
├── components/         # Reusable UI & Feature-specific components
├── actions/            # Server Actions for Mutations (Applications, AI, Rounds)
├── lib/                # Shared Utilities (Prisma, Auth Config, Schemas)
├── prisma/             # Database Schema & Migrations
├── public/             # Static Assets
└── types/              # Global TypeScript Definitions
```

## 🛡️ Security & Performance

- **Middleware Protection**: All `/dashboard` routes are strictly protected at the edge.
- **Server-Side Validation**: All mutations are validated using Zod schemas to ensure data integrity.
- **Surgical Updates**: Implemented specialized update logic to prevent accidental data overwrites during partial updates.
- **Optimized Data Fetching**: Utilizes React Server Components (RSC) to minimize client-side JavaScript and eliminate waterfalls.

## 🚀 Deployment

The project is optimized for deployment on **Vercel**.

1. Connect your GitHub repository to Vercel.
2. Add the environment variables defined in `.env.local`.
3. Vercel will automatically detect the Next.js project and handle the build process.
4. Ensure your build command includes Prisma generation: `npx prisma generate && next build`.

## 📜 License

This project is licensed under the MIT License.

---

Built with ❤️ by **Shubh Maheshwari**

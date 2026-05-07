# DATABASE_SCHEMA.md

## Purpose

Defines the complete PostgreSQL database schema for InterviewSprint AI using Prisma ORM. This is the authoritative reference for all table structures, relationships, enums, and indexes.

---

## Complete Prisma Schema

File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth.js Required Models ───────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // null for OAuth-only users
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  applications  Application[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─── Application Domain Models ─────────────────────────────────────────────

enum ApplicationStatus {
  APPLIED
  SCREENING
  INTERVIEWING
  OFFER
  REJECTED
  WITHDRAWN
}

enum InterviewRoundType {
  PHONE
  TECHNICAL
  SYSTEM_DESIGN
  BEHAVIORAL
  HR
  ONSITE
}

enum InterviewRoundOutcome {
  PASSED
  FAILED
  PENDING
  CANCELLED
}

model Application {
  id              String            @id @default(cuid())
  userId          String
  companyName     String            @db.VarChar(100)
  roleTitle       String            @db.VarChar(100)
  jobDescription  String?           @db.Text
  status          ApplicationStatus @default(APPLIED)
  applicationDate DateTime          @default(now())
  techStack       String?           @db.VarChar(500)
  notes           String?           @db.Text
  salaryRange     String?           @db.VarChar(50)
  interviewStage  String?           @db.VarChar(200)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  interviewRounds InterviewRound[]
  aiAnalysis      AIAnalysis?

  @@index([userId])
  @@index([userId, status])
  @@index([userId, applicationDate(sort: Desc)])
  @@index([userId, createdAt(sort: Desc)])
  @@map("applications")
}

model InterviewRound {
  id            String                 @id @default(cuid())
  applicationId String
  name          String                 @db.VarChar(100)
  scheduledAt   DateTime?
  type          InterviewRoundType
  outcome       InterviewRoundOutcome  @default(PENDING)
  notes         String?                @db.Text
  createdAt     DateTime               @default(now())
  updatedAt     DateTime               @updatedAt

  application   Application            @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@index([applicationId])
  @@map("interview_rounds")
}

model AIAnalysis {
  id                  String   @id @default(cuid())
  applicationId       String   @unique
  interviewQuestions  Json     // Array of { category: string, question: string }
  skillGaps           Json     // Array of { skill: string, importance: string, reason: string }
  resumeTips          Json     // Array of strings
  preparationRoadmap  Json     // Array of { week: number, focus: string, resources: string[] }
  generatedAt         DateTime @default(now())
  updatedAt           DateTime @updatedAt

  application         Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  @@map("ai_analyses")
}
```

---

## Entity Relationship Summary

```
User
 └── Account (one-to-many, OAuth provider links)
 └── Session (one-to-many, Auth.js session tokens)
 └── Application (one-to-many, user's job applications)
       └── InterviewRound (one-to-many, interview stages)
       └── AIAnalysis (one-to-one, AI result for this application)
```

---

## Key Design Decisions

### `password` field is nullable on `User`

OAuth users (Google) do not have a password. Credentials users will have a bcrypt hash stored here. The field is `String?` — nullable.

### `AIAnalysis` is one-to-one with `Application`

Re-running AI analysis overwrites the existing record via `upsert` on `applicationId`. The `@@unique` on `applicationId` enforces this.

### `Json` type for AI output fields

AI output is structured but variable-length. Storing as JSON columns avoids over-normalizing for a demo-scale application. Reading and writing uses Prisma's `JsonValue` type.

### Cascade deletes

All child records cascade delete when a parent is deleted:
- Deleting a `User` deletes their `Account`, `Session`, and `Application` records.
- Deleting an `Application` deletes its `InterviewRound` and `AIAnalysis` records.

### Indexes

| Index | Purpose |
|---|---|
| `Application(userId)` | All queries filter by the authenticated user's ID |
| `Application(userId, status)` | Status filter on applications list |
| `Application(userId, createdAt DESC)` | Default sort by most recent |
| `InterviewRound(applicationId)` | Fetch rounds for a given application |

---

## Database Migrations

### Initial migration

```bash
npx prisma migrate dev --name init
```

### Production migration

```bash
npx prisma migrate deploy
```

### Resetting in development

```bash
npx prisma migrate reset
```

### Seeding (optional dev data)

File: `prisma/seed.ts`

```typescript
import { prisma } from "../lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const password = await bcrypt.hash("password123", 10)

  const user = await prisma.user.upsert({
    where: { email: "demo@interviewsprint.dev" },
    update: {},
    create: {
      email: "demo@interviewsprint.dev",
      name: "Demo User",
      password,
      applications: {
        create: [
          {
            companyName: "Stripe",
            roleTitle: "Senior Software Engineer",
            status: "INTERVIEWING",
            applicationDate: new Date("2024-01-15"),
            techStack: "React, Node.js, TypeScript, PostgreSQL",
            jobDescription: "We are looking for a senior engineer...",
            notes: "Applied via referral from John.",
          },
          {
            companyName: "Vercel",
            roleTitle: "Frontend Engineer",
            status: "APPLIED",
            applicationDate: new Date("2024-01-20"),
            techStack: "Next.js, React, TypeScript",
          },
        ],
      },
    },
  })

  console.log("Seed complete:", user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add to `package.json`:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

---

## Type Exports from Prisma

Use Prisma-generated types throughout the application:

```typescript
import type { Application, InterviewRound, AIAnalysis, ApplicationStatus } from "@prisma/client"
```

For composite types used in components:

```typescript
// types/index.ts
import type { Application, InterviewRound, AIAnalysis } from "@prisma/client"

export type ApplicationWithRelations = Application & {
  interviewRounds: InterviewRound[]
  aiAnalysis: AIAnalysis | null
}
```

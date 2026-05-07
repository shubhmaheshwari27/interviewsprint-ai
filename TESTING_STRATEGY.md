# TESTING_STRATEGY.md

## Purpose

Defines the testing strategy for InterviewSprint AI. Scope is intentionally realistic for a 4-day, single-developer build. Tests focus on critical paths: Server Actions, API validation, and key component behavior.

---

## Test Scope

| Area | Test Type | Priority |
|---|---|---|
| Server Action validation (Zod schemas) | Unit test | High |
| AI response validation schema | Unit test | High |
| Auth flow (register, login) | Integration test | High |
| Application CRUD Server Actions | Integration test | High |
| AI analyze Route Handler | Integration test | Medium |
| `ApplicationStatusBadge` rendering | Component test | Medium |
| `SearchFilterBar` URL param behavior | Component test | Medium |
| 404 handling for missing application | Integration test | Medium |

---

## Test Setup

### Install testing dependencies

```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-node
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
```

### `jest.config.ts`

```typescript
import type { Config } from "jest"

const config: Config = {
  projects: [
    {
      displayName: "node",
      testEnvironment: "node",
      testMatch: ["**/__tests__/**/*.test.ts"],
      transform: { "^.+\\.tsx?$": ["ts-jest", {}] },
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
    },
    {
      displayName: "jsdom",
      testEnvironment: "jsdom",
      testMatch: ["**/__tests__/**/*.test.tsx"],
      transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }] },
      setupFilesAfterFramework: ["@testing-library/jest-dom"],
      moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
    },
  ],
}

export default config
```

---

## Unit Tests: Validation Schemas

File: `__tests__/validation/application-schema.test.ts`

```typescript
import { CreateApplicationSchema } from "@/actions/applications"

describe("CreateApplicationSchema", () => {
  it("accepts valid data", () => {
    const result = CreateApplicationSchema.safeParse({
      companyName: "Stripe",
      roleTitle: "Engineer",
      status: "APPLIED",
      applicationDate: "2024-01-15",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty company name", () => {
    const result = CreateApplicationSchema.safeParse({
      companyName: "",
      roleTitle: "Engineer",
      status: "APPLIED",
      applicationDate: "2024-01-15",
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe("Company name is required")
  })

  it("rejects invalid status", () => {
    const result = CreateApplicationSchema.safeParse({
      companyName: "Stripe",
      roleTitle: "Engineer",
      status: "HIRED",
      applicationDate: "2024-01-15",
    })
    expect(result.success).toBe(false)
  })

  it("rejects jobDescription over 10000 chars", () => {
    const result = CreateApplicationSchema.safeParse({
      companyName: "Stripe",
      roleTitle: "Engineer",
      status: "APPLIED",
      applicationDate: "2024-01-15",
      jobDescription: "a".repeat(10001),
    })
    expect(result.success).toBe(false)
  })
})
```

---

## Unit Tests: AI Response Validation

File: `__tests__/validation/ai-schema.test.ts`

```typescript
import { AIAnalysisResponseSchema } from "@/lib/ai-validation"

const validAnalysis = {
  interviewQuestions: [
    { category: "Technical", question: "How does React reconciliation work?" },
  ],
  skillGaps: [
    { skill: "Kubernetes", importance: "High", reason: "Required in JD." },
  ],
  resumeTips: ["Quantify your project impact with metrics."],
  preparationRoadmap: [
    { week: 1, focus: "TypeScript deep dive", resources: ["TypeScript Handbook"] },
  ],
}

describe("AIAnalysisResponseSchema", () => {
  it("accepts valid analysis", () => {
    expect(AIAnalysisResponseSchema.safeParse(validAnalysis).success).toBe(true)
  })

  it("rejects invalid importance value", () => {
    const invalid = {
      ...validAnalysis,
      skillGaps: [{ skill: "Docker", importance: "Critical", reason: "..." }],
    }
    expect(AIAnalysisResponseSchema.safeParse(invalid).success).toBe(false)
  })

  it("rejects missing interviewQuestions", () => {
    const { interviewQuestions, ...missing } = validAnalysis
    expect(AIAnalysisResponseSchema.safeParse(missing).success).toBe(false)
  })
})
```

---

## Component Tests: ApplicationStatusBadge

File: `__tests__/components/ApplicationStatusBadge.test.tsx`

```typescript
import { render, screen } from "@testing-library/react"
import { ApplicationStatusBadge } from "@/components/applications/ApplicationStatusBadge"

describe("ApplicationStatusBadge", () => {
  it("renders 'Applied' for APPLIED status", () => {
    render(<ApplicationStatusBadge status="APPLIED" />)
    expect(screen.getByText("Applied")).toBeInTheDocument()
  })

  it("renders 'Offer' for OFFER status", () => {
    render(<ApplicationStatusBadge status="OFFER" />)
    expect(screen.getByText("Offer")).toBeInTheDocument()
  })

  it("renders 'Rejected' for REJECTED status", () => {
    render(<ApplicationStatusBadge status="REJECTED" />)
    expect(screen.getByText("Rejected")).toBeInTheDocument()
  })
})
```

---

## Integration Tests: Route Handlers

File: `__tests__/api/ai-analyze.test.ts`

These tests use a mocked Prisma client and mocked Gemini client.

```typescript
// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findFirst: jest.fn(),
    },
    aIAnalysis: {
      upsert: jest.fn(),
    },
  },
}))

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}))

jest.mock("@/lib/gemini", () => ({
  geminiModel: {
    generateContent: jest.fn(),
  },
}))
```

Test cases:
- Returns 401 when no session.
- Returns 400 when `applicationId` is missing.
- Returns 404 when application not found.
- Returns 400 when job description is empty.
- Returns 200 with analysis when Gemini succeeds.
- Returns 500 when Gemini throws.

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

---

## What NOT to Test

Given the 4-day scope, the following are explicitly not tested:
- Database migrations (tested implicitly via development workflow).
- Prisma queries directly (unit-tested via schema validation instead).
- Full E2E browser flows (Playwright/Cypress adds significant setup time).
- Auth.js internals (Auth.js is a tested library, not custom code).
- shadcn/ui components (tested by the shadcn/ui library itself).

---

## Test File Location Convention

```
__tests__/
├── validation/
│   ├── application-schema.test.ts
│   └── ai-schema.test.ts
├── components/
│   ├── ApplicationStatusBadge.test.tsx
│   └── SearchFilterBar.test.tsx
└── api/
    └── ai-analyze.test.ts
```

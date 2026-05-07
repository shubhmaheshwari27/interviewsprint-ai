# AUTH_FLOW.md

## Purpose

Defines the complete authentication and authorization implementation for InterviewSprint AI using Auth.js v5. Covers configuration, credential flow, Google OAuth flow, session handling, and route protection.

---

## Auth Stack

| Concern | Implementation |
|---|---|
| Library | Auth.js v5 (`next-auth@^5.0.0-beta`) |
| Adapter | `@auth/prisma-adapter` |
| Session strategy | JWT (stateless) |
| Providers | Google OAuth + Credentials |
| Password hashing | `bcryptjs` |
| Route protection | `middleware.ts` |

---

## Auth.js Configuration

File: `lib/auth.ts`

```typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(parsed.data.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
```

---

## Auth Route Handler

File: `app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

---

## TypeScript Session Augmentation

File: `types/next-auth.d.ts`

```typescript
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
```

This ensures `session.user.id` is typed correctly throughout the app.

---

## User Registration Flow

Registration is handled via a Server Action (not Auth.js directly, since Credentials provider doesn't include a signup flow by default).

File: `actions/auth.ts`

```typescript
"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { signIn } from "@/lib/auth"
import type { ActionResult } from "@/types/actions"

const RegisterSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

export async function registerUser(
  formData: FormData
): Promise<ActionResult<void>> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: "An account with this email already exists." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  // Automatically sign in after registration
  await signIn("credentials", { email, password, redirectTo: "/dashboard" })

  return { success: true }
}
```

---

## Login Page

File: `app/(auth)/login/page.tsx`

- Server Component wrapper
- Renders `<LoginForm />` Client Component
- Redirects to `/dashboard` if already authenticated (checked via `auth()`)

File: `components/auth/LoginForm.tsx` — Client Component

```typescript
"use client"

import { useFormState } from "react-dom"
import { signIn } from "next-auth/react"

// Two options displayed:
// 1. "Continue with Google" button → calls signIn("google")
// 2. Email/password form → calls signIn("credentials", { email, password, redirectTo: "/dashboard" })
```

**Error handling:** Auth.js redirects to `/login?error=CredentialsSignin` on failure. The login page reads `searchParams.error` and displays a user-friendly message.

> [!IMPORTANT]
> **Auth.js v5 Sign-In Imports:**
> - In **Server Actions** or **Server Components**, use `signIn` from `@/lib/auth`.
> - In **Client Components**, use `signIn` from `next-auth/react`.


---

## Register Page

File: `app/(auth)/register/page.tsx`

- Renders `<RegisterForm />` Client Component
- Calls `registerUser` Server Action on submit

---

## Route Protection via Middleware

File: `middleware.ts` (root of project)

```typescript
export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/dashboard/:path*"],
}
```

**Behavior:**
- Auth.js middleware checks for a valid JWT token in the request cookie.
- If token is missing or expired, the user is redirected to `/login`.
- The `redirectTo` param is set so users return to their intended page after login.
- No manual redirect logic needed — Auth.js handles this via the `pages.signIn` config.

---

## Session Access in Server Components

```typescript
import { auth } from "@/lib/auth"

// Inside a Server Component or Server Action:
const session = await auth()

if (!session?.user?.id) {
  redirect("/login")
}

const userId = session.user.id
```

---

## Session Access in Client Components

```typescript
"use client"
import { useSession } from "next-auth/react"

export function ProfileAvatar() {
  const { data: session } = useSession()
  return <img src={session?.user?.image ?? "/default-avatar.png"} alt="Avatar" />
}
```

The `SessionProvider` must wrap the app layout.

File: `app/layout.tsx`

```typescript
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"

export default async function RootLayout({ children }) {
  const session = await auth()

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

---

## Sign Out

```typescript
// Server Action
import { signOut } from "@/lib/auth"

export async function handleSignOut() {
  await signOut({ redirectTo: "/" })
}
```

Trigger from a Client Component button:

```tsx
<form action={handleSignOut}>
  <button type="submit">Sign out</button>
</form>
```

---

## Auth Error Messages

| Auth.js Error Code | Display Message |
|---|---|
| `CredentialsSignin` | "Invalid email or password." |
| `OAuthAccountNotLinked` | "This email is linked to a different sign-in method." |
| `Default` | "Something went wrong. Please try again." |

Read from `searchParams.error` in the login page and map to these messages.

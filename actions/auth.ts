"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { signIn } from "@/lib/auth"
import type { ActionResult } from "@/types/actions"

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
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

  try {
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    })

    // Automatically sign in after registration
    // Note: In Server Actions, we use signIn from @/lib/auth
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Failed to create account. Please try again." }
  }
}

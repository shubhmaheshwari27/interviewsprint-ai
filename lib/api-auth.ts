import { prisma } from "@/lib/prisma"
import { sha256 } from "@/lib/crypto"

/**
 * Bearer-token auth for the browser extension API.
 * Tokens are personal access tokens created in Settings; only their SHA-256
 * hash is stored. Each token is rate-limited in memory (per server instance).
 */
export type TokenUser = { id: string; name: string | null; skills: string[]; isDemo: boolean }

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60
const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimited(key: string): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_REQUESTS
}

export async function authenticateToken(request: Request): Promise<{ user: TokenUser } | { error: string; status: number }> {
  const header = request.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
  if (!token.startsWith("isp_")) return { error: "Missing or invalid token. Create one in Settings → Browser extension.", status: 401 }

  const hash = sha256(token)
  if (rateLimited(hash)) return { error: "Too many requests. Please wait a minute.", status: 429 }

  const row = await prisma.apiToken.findUnique({
    where: { tokenHash: hash },
    select: { id: true, revokedAt: true, lastUsedAt: true, user: { select: { id: true, name: true, skills: true, isDemo: true } } },
  })
  if (!row || row.revokedAt) return { error: "This token was revoked or does not exist.", status: 401 }
  if (row.user.isDemo) return { error: "The demo account can't be used with the extension.", status: 403 }

  // Record usage at most once a minute.
  if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000) {
    await prisma.apiToken.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } }).catch(() => {})
  }
  return { user: row.user }
}

/** CORS headers for chrome-extension:// origins (the extension also has host permissions). */
export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin") ?? ""
  return origin.startsWith("chrome-extension://") || origin.startsWith("moz-extension://")
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      }
    : {}
}

export function json(request: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders(request) })
}

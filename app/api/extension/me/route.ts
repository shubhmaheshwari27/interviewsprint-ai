import { authenticateToken, corsHeaders, json } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

/** Used by the extension to check its token and show who is signed in. */
export async function GET(request: Request) {
  const auth = await authenticateToken(request)
  if ("error" in auth) return json(request, { error: auth.error }, auth.status)
  return json(request, { name: auth.user.name, skills: auth.user.skills })
}

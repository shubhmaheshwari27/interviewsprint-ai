import { beforeAll, describe, expect, it } from "vitest"
import { decryptSecret, encryptSecret, keyHint, newApiToken, sha256 } from "@/lib/crypto"
import { canonicalJobUrl, fitScore, jobExternalKey, portalFromUrl, ExtensionJobSchema } from "@/lib/extension-jobs"
import { describeProviderError } from "@/lib/ai/providers"

beforeAll(() => {
  process.env.AUTH_SECRET = "test-auth-secret-that-is-long-enough-123456"
  delete process.env.ENCRYPTION_KEY
})

describe("secret encryption", () => {
  it("round-trips and never stores the plain key", () => {
    const stored = encryptSecret("sk-test-1234567890abcd")
    expect(stored.startsWith("v1:")).toBe(true)
    expect(stored).not.toContain("1234567890")
    expect(decryptSecret(stored)).toBe("sk-test-1234567890abcd")
  })

  it("uses a fresh IV every time", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"))
  })

  it("detects tampering", () => {
    const [v, iv, tag, data] = encryptSecret("secret").split(":")
    const flipped = Buffer.from(data, "base64")
    flipped[0] ^= 1
    expect(() => decryptSecret([v, iv, tag, flipped.toString("base64")].join(":"))).toThrow()
  })

  it("makes safe hints and opaque tokens", () => {
    expect(keyHint("AIzaSyD-abcdef9xY2")).toBe("…9xY2")
    const token = newApiToken()
    expect(token).toMatch(/^isp_[\w-]{32}$/)
    expect(sha256(token)).toHaveLength(64)
  })
})

describe("extension job helpers", () => {
  it("strips tracking parameters so the same job gets the same key", () => {
    const a = "https://www.linkedin.com/jobs/view/123/?trackingId=abc&refId=x"
    const b = "https://www.linkedin.com/jobs/view/123"
    expect(canonicalJobUrl(a)).toBe(canonicalJobUrl(b))
    expect(jobExternalKey(a)).toBe(jobExternalKey(b))
    expect(canonicalJobUrl("https://www.indeed.com/viewjob?jk=9f2&from=serp")).toBe("https://www.indeed.com/viewjob?jk=9f2")
  })

  it("recognises portals from the URL", () => {
    expect(portalFromUrl("https://www.naukri.com/job-listings-x")).toBe("Naukri")
    expect(portalFromUrl("https://boards.greenhouse.io/acme/jobs/1")).toBe("Company site")
    expect(portalFromUrl("https://example.com", "LinkedIn Easy Apply")).toBe("LinkedIn")
  })

  it("scores the fit against the user's skills", () => {
    const fit = fitScore("React developer with Node.js, Docker and Kubernetes", ["React", "Node.js", "Docker"])
    expect(fit.matched).toEqual(["Docker", "Node.js", "React"])
    expect(fit.missing).toEqual(["Kubernetes"])
    expect(fit.matchPct).toBe(75)
    expect(fitScore("", []).matchPct).toBeNull()
  })

  it("validates the payload", () => {
    expect(ExtensionJobSchema.safeParse({ title: "x", company: "y", url: "not a url" }).success).toBe(false)
    const ok = ExtensionJobSchema.parse({ title: "Dev", company: "Acme", url: "https://acme.dev/jobs/1" })
    expect(ok.status).toBe("SAVED")
    expect(ok.analyze).toBe(false)
  })
})

describe("provider errors", () => {
  it("turns provider failures into safe, user-facing messages", () => {
    expect(describeProviderError({ status: 401 }).message).toMatch(/rejected/)
    expect(describeProviderError({ status: 429 }).retryable).toBe(true)
    expect(describeProviderError({ status: 404 }).message).toMatch(/model/)
    expect(describeProviderError({ status: 503 }).message).toMatch(/problems/)
    expect(describeProviderError(new SyntaxError("bad json")).message).toMatch(/unusable/)
  })
})

import { describe, expect, it } from "vitest"
import { parseCsv } from "@/lib/csv"
import { mapMarketRows, mapTrackerRows, normalisePortal } from "@/lib/import"

describe("parseCsv", () => {
  it("handles BOM, quotes, commas and newlines inside quotes, and CRLF", () => {
    const rows = parseCsv('﻿Date,Company,Notes\r\n2026-11-10,"Acme, Inc","line 1\nline ""2"""\r\n\r\n')
    expect(rows).toEqual([{ date: "2026-11-10", company: "Acme, Inc", notes: 'line 1\nline "2"' }])
  })
})

describe("normalisePortal", () => {
  it("maps tracker portal labels to clean names and channels", () => {
    expect(normalisePortal("Email (someone@x.com)")).toEqual({ portal: "Email", channel: "EMAIL" })
    expect(normalisePortal("LinkedIn Easy Apply")).toEqual({ portal: "LinkedIn", channel: "PORTAL" })
    expect(normalisePortal("Remote-abroad: Wellfound").portal).toBe("Wellfound")
    expect(normalisePortal("Careers: Atlassian").portal).toBe("Company site")
    expect(normalisePortal("").portal).toBe("Other")
  })
})

describe("mapTrackerRows", () => {
  it("keeps applied-type rows, carries dates forward, dedupes and maps statuses", () => {
    const apps = mapTrackerRows([
      { date: "2026-11-10", portal: "Naukri", company: "Acme", role: "SDE 1", status: "Applied" },
      { date: "", portal: "Naukri", company: "Beta", role: "Frontend Dev", status: "Replied" },
      { date: "2026-11-11", portal: "LinkedIn", company: "", role: "x", status: "Invite sent" },
      { date: "2026-11-11", portal: "Naukri", company: "Acme", role: "SDE 1", status: "Applied" },
      { date: "2026-11-12", portal: "Naukri", company: "Gamma", role: "Backend", status: "Skipped" },
    ])
    expect(apps.map((a) => a.companyName)).toEqual(["Acme", "Beta"])
    expect(apps[1].applicationDate.toISOString().slice(0, 10)).toBe("2026-11-10")
    expect(apps[1].status).toBe("SCREENING")
    expect(apps[0].externalKey).toHaveLength(24)
  })
})

describe("mapMarketRows", () => {
  it("parses skills, decision and experience band", () => {
    const [s] = mapMarketRows([
      { date: "2026-11-20", portal: "Naukri", company: "Acme", role: "React Developer", exp_min: "2", decision: "Skipped", blocker: "Skills", skills: "react;Node.js" },
    ])
    expect(s.decision).toBe("SKIPPED")
    expect(s.expBand).toBe("2–3 yrs")
    expect(s.skills).toEqual(["Node.js", "React"])
  })

  it("detects skills from the role title when none are listed", () => {
    const [s] = mapMarketRows([{ date: "2026-11-20", portal: "Naukri", role: "Java Spring Boot Developer", decision: "Applied" }])
    expect(s.skills).toEqual(["Java", "Spring Boot"])
    expect(s.blocker).toBe("None (applied)")
  })
})

import { describe, expect, it } from "vitest"
import { createRequire } from "node:module"
import { JSDOM } from "jsdom"

const require = createRequire(import.meta.url)
const { extractJobFromDocument } = require("../extension/extractor.js") as {
  extractJobFromDocument: (doc: Document, href: string, selection?: string) => Record<string, string>
}

const page = (html: string) => new JSDOM(html).window.document

describe("extension extractor", () => {
  it("reads schema.org JobPosting structured data", () => {
    const doc = page(`<html><head><script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Organization", name: "Ignore me" },
        {
          "@type": "JobPosting",
          title: "Frontend Engineer",
          hiringOrganization: { "@type": "Organization", name: "Acme Labs" },
          jobLocation: { "@type": "Place", address: { addressLocality: "Pune", addressCountry: "IN" } },
          description: "<p>Build UIs with <b>React</b> and TypeScript.</p><ul><li>REST APIs</li></ul>",
          baseSalary: { currency: "INR", value: { minValue: 600000, maxValue: 900000, unitText: "YEAR" } },
        },
      ],
    })}</script></head><body><h1>Other heading</h1></body></html>`)
    const job = extractJobFromDocument(doc, "https://careers.acme.dev/jobs/123?utm_source=x")
    expect(job.title).toBe("Frontend Engineer")
    expect(job.company).toBe("Acme Labs")
    expect(job.location).toBe("Pune, IN")
    expect(job.salary).toBe("INR 600000-900000 / year")
    expect(job.description).toContain("Build UIs with React and TypeScript.")
    expect(job.description).toContain("REST APIs")
    expect(job.source).toBe("structured data")
  })

  it("uses LinkedIn selectors and builds a clean job URL from currentJobId", () => {
    const doc = page(`<body>
      <div class="job-details-jobs-unified-top-card__job-title"><h1>Software Engineer I</h1></div>
      <div class="job-details-jobs-unified-top-card__company-name"><a>Globex</a></div>
      <div id="job-details">We use Node.js, React and SQL. ${"Details. ".repeat(10)}</div>
    </body>`)
    const job = extractJobFromDocument(doc, "https://www.linkedin.com/jobs/search/?currentJobId=4485065088&keywords=react&refId=abc")
    expect(job).toMatchObject({ title: "Software Engineer I", company: "Globex", portal: "LinkedIn" })
    expect(job.url).toBe("https://www.linkedin.com/jobs/view/4485065088/")
    expect(job.description).toContain("Node.js, React and SQL")
  })

  it("uses Naukri's hashed class names", () => {
    const doc = page(`<body>
      <h1 class="styles_jd-header-title__rZwM1">React Developer</h1>
      <div class="styles_jd-header-comp-name__MvqAI"><a>Initech</a></div>
      <span class="styles_jhc__location__W_pVs">Bengaluru</span>
      <span class="styles_jhc__salary__jdfEC">6-9 Lacs P.A.</span>
      <div class="styles_JDC__dang-inner-html__h0K4t">React, Redux, JavaScript</div>
    </body>`)
    const job = extractJobFromDocument(doc, "https://www.naukri.com/job-listings-react-developer-initech-123")
    expect(job).toMatchObject({ title: "React Developer", company: "Initech", location: "Bengaluru", salary: "6-9 Lacs P.A.", portal: "Naukri" })
  })

  it("falls back to the page title and selected text on unknown sites", () => {
    const doc = page(`<html><head><title>Backend Developer at Hooli | Careers</title></head><body><p>short</p></body></html>`)
    const selected = "We are hiring a backend developer with Java and Spring Boot. ".repeat(5)
    const job = extractJobFromDocument(doc, "https://hooli.example/careers/42", selected)
    expect(job.title).toBe("Backend Developer")
    expect(job.company).toBe("Hooli")
    expect(job.description).toContain("Java and Spring Boot")
    expect(job.portal).toBe("")
  })
})

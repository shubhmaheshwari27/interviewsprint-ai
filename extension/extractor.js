/*
 * Extracts job details from the page the user is viewing. Injected into the
 * active tab only when the user clicks the extension (activeTab permission);
 * it reads the page and returns data, it never changes the page.
 *
 * Order: structured data (schema.org JobPosting, used by many job sites),
 * then site-specific selectors (LinkedIn, Naukri, Indeed, Instahyre,
 * Wellfound, Cutshort), then generic fallbacks. Text the user has selected on
 * the page is used as the description when nothing better is found.
 */
;(function () {
  const clean = (s) => (s || "").replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim()
  const one = (s) => clean(s).replace(/\s*\n\s*/g, " ")

  function htmlToText(html, doc) {
    const div = doc.createElement("div")
    div.innerHTML = String(html || "").replace(/<\s*(br|\/p|\/li|\/h\d)\s*\/?>/gi, "\n$&")
    return clean(div.textContent || "")
  }

  function text(doc, selectors) {
    for (const sel of selectors) {
      const el = doc.querySelector(sel)
      const value = el && clean(el.innerText !== undefined && el.innerText !== "" ? el.innerText : el.textContent)
      if (value) return value
    }
    return ""
  }

  function meta(doc, name) {
    const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`)
    return el ? one(el.getAttribute("content")) : ""
  }

  function findJobPosting(node) {
    if (!node || typeof node !== "object") return null
    if (Array.isArray(node)) {
      for (const n of node) {
        const found = findJobPosting(n)
        if (found) return found
      }
      return null
    }
    const type = node["@type"]
    if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return node
    return findJobPosting(node["@graph"])
  }

  function fromJsonLd(doc) {
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
      let data
      try {
        data = JSON.parse(script.textContent || "")
      } catch {
        continue
      }
      const job = findJobPosting(data)
      if (!job) continue
      const org = Array.isArray(job.hiringOrganization) ? job.hiringOrganization[0] : job.hiringOrganization
      const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation
      const addr = (loc && loc.address) || {}
      const location = [addr.addressLocality, addr.addressRegion, addr.addressCountry && (addr.addressCountry.name || addr.addressCountry)]
        .filter((x) => typeof x === "string" && x)
        .join(", ")
      const remote = job.jobLocationType === "TELECOMMUTE" ? "Remote" : ""
      let salary = ""
      const bs = job.baseSalary
      if (bs && bs.value) {
        const v = bs.value
        const range = v.minValue && v.maxValue ? `${v.minValue}-${v.maxValue}` : v.value || v.minValue || ""
        salary = range ? `${bs.currency || ""} ${range}${v.unitText ? " / " + String(v.unitText).toLowerCase() : ""}`.trim() : ""
      }
      return {
        title: one(job.title),
        company: one(org && (org.name || org)),
        location: one(location || remote),
        description: htmlToText(job.description, doc),
        salary: one(salary),
      }
    }
    return null
  }

  const SITES = [
    {
      portal: "LinkedIn",
      match: /linkedin\.com\/jobs/,
      title: [".job-details-jobs-unified-top-card__job-title h1", ".job-details-jobs-unified-top-card__job-title", ".top-card-layout__title", "h1.t-24", "h1"],
      company: [".job-details-jobs-unified-top-card__company-name a", ".job-details-jobs-unified-top-card__company-name", ".topcard__org-name-link", ".top-card-layout__second-subline a"],
      location: [".job-details-jobs-unified-top-card__primary-description-container .tvm__text", ".job-details-jobs-unified-top-card__bullet", ".topcard__flavor--bullet"],
      description: ["#job-details", ".jobs-description__content", ".jobs-box__html-content", ".show-more-less-html__markup", ".description__text"],
      url(u) {
        const id = u.searchParams.get("currentJobId") || (u.pathname.match(/\/jobs\/view\/(\d+)/) || [])[1]
        return id ? `https://www.linkedin.com/jobs/view/${id}/` : u.href
      },
    },
    {
      portal: "Naukri",
      match: /naukri\.com/,
      title: ['[class*="jd-header-title"]', "h1"],
      company: ['[class*="jd-header-comp-name"] a', '[class*="jd-header-comp-name"]'],
      location: ['[class*="jhc__location"]', '[class*="location"] a'],
      salary: ['[class*="jhc__salary"]'],
      description: ['[class*="dang-inner-html"]', '[class*="job-desc"]', "section[class*='JDC']"],
    },
    {
      portal: "Indeed",
      match: /indeed\./,
      title: ['[data-testid="jobsearch-JobInfoHeader-title"]', "h1"],
      company: ['[data-testid="inlineHeader-companyName"]', '[data-company-name="true"]'],
      location: ['[data-testid="inlineHeader-companyLocation"]', '[data-testid="job-location"]'],
      salary: ["#salaryInfoAndJobType"],
      description: ["#jobDescriptionText"],
    },
    {
      portal: "Instahyre",
      match: /instahyre\.com/,
      title: [".job-title", "h1"],
      company: [".company-name", ".employer-name"],
      location: [".job-locations", ".location"],
      description: [".job-description", "#job-description", ".description"],
    },
    {
      portal: "Wellfound",
      match: /wellfound\.com|angel\.co/,
      title: ["h1"],
      company: ['a[href*="/company/"] h2', 'a[href*="/company/"]'],
      location: ['[class*="location"]'],
      description: ['[class*="description"]', "#job-description"],
    },
    {
      portal: "Cutshort",
      match: /cutshort\.io/,
      title: ["h1"],
      company: ['a[href*="/company/"]', '[class*="company"]'],
      location: ['[class*="location"]'],
      description: ['[class*="description"]', '[class*="jobDescription"]'],
    },
  ]

  function largestTextBlock(doc) {
    let best = ""
    for (const el of doc.querySelectorAll("article, main, section, [class*='description'], [id*='description']")) {
      const t = clean(el.innerText !== undefined && el.innerText !== "" ? el.innerText : el.textContent)
      if (t.length > best.length && t.length < 20000) best = t
    }
    return best.length > 200 ? best : ""
  }

  function extractJobFromDocument(doc, href, selection) {
    const u = new URL(href)
    const site = SITES.find((s) => s.match.test(href))
    const ld = fromJsonLd(doc) || {}
    const pick = (key) => (site && site[key] ? text(doc, site[key]) : "")

    const title = one(ld.title || pick("title") || meta(doc, "og:title") || text(doc, ["h1"]) || doc.title)
    let company = one(ld.company || pick("company") || meta(doc, "og:site_name"))
    const location = one(ld.location || pick("location"))
    const salary = one(ld.salary || pick("salary"))
    const selected = clean(selection || "")
    let description = selected.length > 200 ? selected : ld.description || pick("description") || largestTextBlock(doc) || meta(doc, "og:description")

    // "Software Engineer at Acme" style titles without a company field
    let finalTitle = title
    const at = title.match(/^(.*?)\s+(?:at|@|-|\|)\s+(.+?)(?:\s+[|-].*)?$/i)
    if (!company && at) {
      finalTitle = at[1]
      company = at[2]
    }

    return {
      title: finalTitle.slice(0, 100),
      company: company.slice(0, 100),
      location: location.slice(0, 150),
      salary: salary.slice(0, 50),
      description: clean(description).slice(0, 10000),
      url: site && site.url ? site.url(u) : u.origin + u.pathname + u.search,
      portal: site ? site.portal : "",
      source: ld.title ? "structured data" : site ? site.portal + " page" : "page",
    }
  }

  globalThis.__interviewSprintExtract = extractJobFromDocument
  if (typeof module !== "undefined" && module.exports) module.exports = { extractJobFromDocument }
})()

// When injected with chrome.scripting.executeScript({ files }), the value of the
// last expression is returned to the popup.
typeof document !== "undefined" && typeof module === "undefined"
  ? globalThis.__interviewSprintExtract(document, location.href, String(getSelection ? getSelection() : ""))
  : null

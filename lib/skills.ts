/**
 * Skill dictionary shared by the offline JD analysis and the Market Gap page.
 * Each entry maps a canonical skill name to a case-insensitive pattern that
 * finds it in free text (job descriptions, role titles).
 */
export const SKILL_PATTERNS: Record<string, RegExp> = {
  JavaScript: /\bjavascript\b|\bjs\b|\bes6\b/i,
  TypeScript: /\btypescript\b|\bts\b/i,
  React: /\breact(?:\.?js)?\b(?!\s*native)/i,
  "Next.js": /\bnext\.?js\b/i,
  "Node.js": /\bnode(?:\.?js)?\b/i,
  Express: /\bexpress(?:\.?js)?\b/i,
  Java: /\bjava\b(?!\s*script)/i,
  "Spring Boot": /\bspring\b/i,
  Python: /\bpython\b/i,
  "Django/FastAPI/Flask": /\bdjango\b|\bfastapi\b|\bflask\b/i,
  ".NET/C#": /\.net\b|\bc#|\basp\.net\b/i,
  "PHP/Laravel": /\bphp\b|\blaravel\b/i,
  Angular: /\bangular\b/i,
  Vue: /\bvue(?:\.?js)?\b/i,
  "React Native": /\breact\s*native\b/i,
  "Flutter/Dart": /\bflutter\b|\bdart\b/i,
  "Android/Kotlin": /\bandroid\b|\bkotlin\b/i,
  "iOS/Swift": /\bios\b|\bswift\b/i,
  Go: /\bgolang\b/i,
  "C++": /c\+\+/i,
  SQL: /\bsql\b|\bmysql\b|\bpostgres(?:ql)?\b|\boracle\b/i,
  MongoDB: /\bmongo(?:db)?\b/i,
  Redis: /\bredis\b/i,
  AWS: /\baws\b|\blambda\b|\bec2\b|\bs3\b/i,
  Azure: /\bazure\b/i,
  GCP: /\bgcp\b|google cloud/i,
  Docker: /\bdocker\b/i,
  Kubernetes: /\bkubernetes\b|\bk8s\b/i,
  "CI/CD": /ci\/cd|\bjenkins\b|github actions/i,
  Microservices: /\bmicroservices?\b/i,
  GraphQL: /\bgraphql\b/i,
  "Kafka/RabbitMQ": /\bkafka\b|\brabbitmq\b/i,
  Tailwind: /\btailwind\b/i,
  Redux: /\bredux\b/i,
  "GenAI/LLM": /\bllms?\b|\bgenai\b|generative ai|\brag\b|\blangchain\b|\bagentic\b/i,
  "Testing/QA automation": /\bselenium\b|\bplaywright\b|\bcypress\b|\bjest\b|test automation/i,
  DevOps: /\bdevops\b|\bterraform\b|\bansible\b/i,
  "Data/ML": /machine learning|\bml\b|\bpandas\b|\bspark\b|data engineer/i,
}

export const ALL_SKILLS = Object.keys(SKILL_PATTERNS)

/** Canonical skills mentioned in a piece of text, sorted by name. */
export function detectSkills(text: string | null | undefined): string[] {
  const t = text ?? ""
  return ALL_SKILLS.filter((skill) => SKILL_PATTERNS[skill].test(t)).sort()
}

/**
 * Normalise free-form skills a user typed ("reactjs", "Node", "Postgres") to the
 * canonical names above so they can be compared with detected job skills.
 */
export function normaliseSkills(input: string[]): string[] {
  const out = new Set<string>()
  for (const raw of input) {
    const value = raw.trim()
    if (!value) continue
    const canonical = ALL_SKILLS.find((s) => s.toLowerCase() === value.toLowerCase())
    if (canonical) {
      out.add(canonical)
      continue
    }
    const detected = detectSkills(value)
    if (detected.length) detected.forEach((s) => out.add(s))
    else out.add(value)
  }
  return [...out].sort()
}

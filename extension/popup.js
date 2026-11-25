/* Popup logic: connect with a personal access token, extract the job from the
 * active tab, show the skill match, and save it to the user's account. */
const DEFAULT_BASE = "https://interviewsprint-ai.vercel.app"
const $ = (id) => document.getElementById(id)
let settings = { token: "", baseUrl: DEFAULT_BASE }
let job = null

function show(section) {
  for (const id of ["setup", "job", "message"]) $(id).hidden = id !== section
}

function message(text) {
  $("message-text").textContent = text
  show("message")
}

async function api(path, options = {}) {
  const res = await fetch(`${settings.baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${settings.token}`, ...(options.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`)
  return body
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(["token", "baseUrl"])
  settings = { token: stored.token || "", baseUrl: (stored.baseUrl || DEFAULT_BASE).replace(/\/$/, "") }
}

function openSetup(status = "") {
  $("token").value = settings.token
  $("base-url").value = settings.baseUrl
  $("setup-status").textContent = status
  show("setup")
}

async function connect() {
  const token = $("token").value.trim()
  const baseUrl = ($("base-url").value.trim() || DEFAULT_BASE).replace(/\/$/, "")
  if (!token.startsWith("isp_")) return ($("setup-status").textContent = "That doesn't look like an InterviewSprint token.")
  settings = { token, baseUrl }
  $("setup-status").textContent = "Checking…"
  try {
    const me = await api("/api/extension/me")
    await chrome.storage.local.set({ token, baseUrl })
    $("setup-status").textContent = `Connected as ${me.name || "you"}.`
    await start()
  } catch (e) {
    $("setup-status").textContent = e.message
  }
}

async function disconnect() {
  await chrome.storage.local.remove(["token"])
  settings.token = ""
  openSetup("Disconnected.")
}

function renderFit(fit) {
  const box = $("fit")
  box.replaceChildren()
  if (!fit || !fit.skills || fit.skills.length === 0) return (box.hidden = true)
  const head = document.createElement("div")
  if (fit.hasProfileSkills && fit.matchPct !== null) {
    const pct = document.createElement("b")
    pct.textContent = `${fit.matchPct}% match`
    head.append(pct, document.createTextNode(` · ${fit.matched.length} of ${fit.skills.length} skills`))
  } else {
    head.textContent = "Skills in this job (add yours in Settings to see your match):"
  }
  box.append(head)
  for (const s of fit.skills) {
    const chip = document.createElement("span")
    const have = fit.matched.includes(s)
    chip.className = `chip ${fit.hasProfileSkills ? (have ? "have" : "miss") : ""}`
    chip.textContent = fit.hasProfileSkills && !have ? `${s} (missing)` : s
    box.append(chip)
  }
  box.hidden = false
}

async function extract() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !/^https?:/.test(tab.url || "")) throw new Error("Open a job posting page first.")
  const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["extractor.js"] })
  if (!result || !result.result) throw new Error("Couldn't read this page.")
  return result.result
}

function fillForm(data) {
  $("f-title").value = data.title || ""
  $("f-company").value = data.company || ""
  $("f-location").value = data.location || ""
  $("f-salary").value = data.salary || ""
  $("f-description").value = data.description || ""
  $("desc-len").textContent = data.description ? `(${data.description.length.toLocaleString()} chars, from ${data.source})` : "(not found)"
}

async function save(status) {
  const payload = {
    title: $("f-title").value.trim(),
    company: $("f-company").value.trim(),
    location: $("f-location").value.trim(),
    salary: $("f-salary").value.trim(),
    description: $("f-description").value.trim(),
    url: job.url,
    portal: job.portal,
    status,
    analyze: $("f-analyze").checked,
  }
  if (!payload.title || !payload.company) return ($("result").textContent = "Role and company are required.")
  for (const b of document.querySelectorAll("#job button")) b.disabled = true
  $("result").textContent = payload.analyze && payload.description ? "Saving and generating AI prep…" : "Saving…"
  try {
    const saved = await api("/api/extension/jobs", { method: "POST", body: JSON.stringify(payload) })
    const link = document.createElement("a")
    link.href = saved.url
    link.target = "_blank"
    link.textContent = "Open in InterviewSprint"
    const note = saved.analysis
      ? saved.analysis.source === "RULES"
        ? " Offline AI prep added (set up an AI key in Settings for full AI)."
        : " AI prep is ready."
      : ""
    $("result").replaceChildren(document.createTextNode(`${saved.created ? "Saved" : "Updated"} as ${saved.status.toLowerCase()}.${note} `), link)
  } catch (e) {
    $("result").textContent = e.message
  } finally {
    for (const b of document.querySelectorAll("#job button")) b.disabled = false
  }
}

async function start() {
  if (!settings.token) return openSetup()
  try {
    job = await extract()
  } catch (e) {
    return message(e.message)
  }
  fillForm(job)
  $("who").textContent = `Saving to ${new URL(settings.baseUrl).host}`
  show("job")
  try {
    const preview = await api("/api/extension/preview", {
      method: "POST",
      body: JSON.stringify({ title: job.title, description: job.description, url: job.url }),
    })
    renderFit(preview)
    if (preview.alreadySaved) {
      $("already").textContent = `Already in your account (${preview.alreadySaved.status.toLowerCase()}). Saving again updates it.`
      $("already").hidden = false
    }
  } catch (e) {
    if (/token/i.test(e.message)) openSetup(e.message)
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  $("save-token").addEventListener("click", connect)
  $("disconnect").addEventListener("click", disconnect)
  $("open-settings").addEventListener("click", () => openSetup())
  $("save-saved").addEventListener("click", () => save("SAVED"))
  $("save-applied").addEventListener("click", () => save("APPLIED"))
  $("f-description").addEventListener("input", (e) => ($("desc-len").textContent = `(${e.target.value.length.toLocaleString()} chars)`))
  await loadSettings()
  await start()
})

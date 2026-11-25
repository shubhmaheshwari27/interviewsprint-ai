import Link from "next/link"

export const metadata = { title: "Privacy · InterviewSprint AI" }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-6 text-slate-700 dark:text-slate-300">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Privacy policy</h1>
      <p>Last updated: 26 November 2026</p>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">What InterviewSprint stores</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Your account details (name, email, password hash or Google sign-in).</li>
        <li>The job applications, interview rounds, skills and market data you add or import.</li>
        <li>AI analyses generated for your applications, with the provider, model and token count used.</li>
        <li>
          If you add your own AI provider key: the key, encrypted with AES-256-GCM. It is only decrypted on the server to call
          that provider for you, and it is never sent back to your browser.
        </li>
        <li>If you use the browser extension: a hash of each access token you create (not the token itself) and when it was last used.</li>
      </ul>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">The Chrome extension</h2>
      <p>
        The extension only runs when you click its icon. It then reads the job posting on the page you are viewing (role,
        company, location, salary, description and link) and, when you press Save, sends those details to your InterviewSprint
        account using the access token you pasted. It does not read other tabs, your browsing history or any page you have not
        clicked it on, and it stores only your token and the app address in Chrome's extension storage.
      </p>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">AI providers</h2>
      <p>
        When you generate AI interview prep, the job description is sent to the AI provider you chose (Google Gemini, OpenAI or
        Anthropic Claude) under your own key and that provider's terms. If no provider is available, an offline analysis is
        generated on the server and nothing is sent to an AI provider.
      </p>

      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Sharing and deletion</h2>
      <p>
        Your data is not sold or shared with anyone. You can delete applications, AI keys and access tokens at any time in the
        app; deleting your account removes all of your data.
      </p>

      <p>
        <Link href="/" className="text-primary underline">Back to InterviewSprint AI</Link>
      </p>
    </main>
  )
}

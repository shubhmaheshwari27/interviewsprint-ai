import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, Bot, Chrome, Palette, Sparkles, Upload, Wrench } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { prisma } from "@/lib/prisma"
import { getSessionUser, DEMO_READ_ONLY_MESSAGE } from "@/lib/session-user"
import { PROVIDERS, PROVIDER_IDS } from "@/lib/ai/providers"
import { ImportData } from "@/components/settings/ImportData"
import { SkillsForm } from "@/components/settings/SkillsForm"
import { AIProviders } from "@/components/settings/AIProviders"
import { ExtensionTokens } from "@/components/settings/ExtensionTokens"

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const [keys, tokens] = await Promise.all([
    prisma.aIProviderKey.findMany({
      where: { userId: user.id },
      orderBy: { priority: "asc" },
      select: { id: true, provider: true, keyHint: true, model: true, lastStatus: true, lastTestedAt: true },
    }),
    prisma.apiToken.findMany({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true },
    }),
  ])
  const providers = PROVIDER_IDS.map((id) => ({ id, ...PROVIDERS[id] }))

  return (
    <div className="space-y-10">
      <div className="space-y-1.5">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your skills, import job-hunt data, and set app preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" /> Your skills
            </CardTitle>
            <CardDescription>
              Used for the skill-gap analysis on the Market Gap page and in the offline JD analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SkillsForm initialSkills={user.skills} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Import job-hunt data
            </CardTitle>
            <CardDescription>
              {user.isDemo ? DEMO_READ_ONLY_MESSAGE : "Bring in applications and screened jobs from a spreadsheet or tracker."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportData />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800" id="ai-providers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> AI provider (bring your own key)
            </CardTitle>
            <CardDescription>
              {user.isDemo
                ? DEMO_READ_ONLY_MESSAGE
                : "Use your own Gemini, OpenAI or Claude key for AI interview prep. Gemini has a free tier."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIProviders
              providers={providers}
              disabled={user.isDemo}
              keys={keys.map((k) => ({ ...k, lastTestedAt: k.lastTestedAt?.toISOString() ?? null }))}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800" id="extension">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-primary" /> Browser extension
            </CardTitle>
            <CardDescription>
              {user.isDemo
                ? DEMO_READ_ONLY_MESSAGE
                : "Save any job you are viewing (LinkedIn, Naukri, Instahyre, Wellfound, Indeed, company sites) with one click."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExtensionTokens
              disabled={user.isDemo}
              tokens={tokens.map((t) => ({ ...t, createdAt: t.createdAt.toISOString(), lastUsedAt: t.lastUsedAt?.toISOString() ?? null }))}
            />
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Customize how InterviewSprint AI looks on your device.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Interface Theme</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark mode.</p>
              </div>
              <ModeToggle />
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Compact Mode</Label>
                <p className="text-sm text-muted-foreground">Density of the dashboard interface.</p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Preferences
            </CardTitle>
            <CardDescription>Control how AI features assist your job search.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Analysis</Label>
                <p className="text-sm text-muted-foreground">Automatically analyze JD when a new application is added.</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Strict Matching</Label>
                <p className="text-sm text-muted-foreground">Use high precision for AI skill gap analysis.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>Manage how you receive alerts and updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Interview Reminders</Label>
                <p className="text-sm text-muted-foreground">Receive alerts 24h before an interview round.</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">Get a summary of your application progress every week.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

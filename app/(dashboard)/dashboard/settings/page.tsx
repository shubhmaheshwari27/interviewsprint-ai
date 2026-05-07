import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { Settings, Bell, Palette, Sparkles, Sliders } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="space-y-10">
      <div className="space-y-1.5">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your app preferences, appearance, and notifications.
        </p>
      </div>

      <div className="grid gap-6">
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

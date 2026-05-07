import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Mail, Shield, BadgeCheck, MapPin, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="space-y-10">
      <div className="space-y-1.5">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Your Profile</h1>
        <p className="text-lg text-muted-foreground">
          View and manage your professional identity and account details.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <CardContent className="pt-0 -mt-12 text-center">
              <div className="inline-block rounded-full border-4 border-white dark:border-slate-950 shadow-xl mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback className="text-2xl">{session.user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-2xl font-bold">{session.user.name}</h2>
              <p className="text-muted-foreground text-sm mb-4">{session.user.email}</p>
              <div className="flex justify-center gap-2">
                <Badge variant="secondary" className="rounded-full">Pro User</Badge>
                <Badge variant="outline" className="rounded-full flex gap-1">
                  <BadgeCheck className="h-3 w-3 text-primary" /> Verified
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium">May 2026</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">Early Adopter</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
              <CardDescription>Public and private details about your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5" /> Full Name
                  </p>
                  <p className="font-semibold">{session.user.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> Email Address
                  </p>
                  <p className="font-semibold">{session.user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </p>
                  <p className="font-semibold text-muted-foreground italic">Not specified</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" /> Timezone
                  </p>
                  <p className="font-semibold">UTC-07:00 (Pacific Time)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Authentication
              </CardTitle>
              <CardDescription>Connected accounts and security providers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    {session.user.image?.includes('googleusercontent') ? (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    ) : (
                      <Mail className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {session.user.image?.includes('googleusercontent') ? "Google Account" : "Credentials"}
                    </p>
                    <p className="text-xs text-muted-foreground italic">Primary authentication method</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-tighter">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

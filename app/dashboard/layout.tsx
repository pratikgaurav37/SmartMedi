import { Sidebar } from '@/components/dashboard/sidebar'
import { BottomNav } from '@/components/dashboard/bottom-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-slate-50/50 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 pb-24 md:pb-8 relative overflow-hidden">
        {/* Background ambient effects */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto max-w-5xl">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}

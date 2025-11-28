'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Pill, Plus, Activity, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Pill, label: 'Meds', href: '/dashboard/medications' },
  { icon: null, label: 'Add', href: '/dashboard/add-medication', isFab: true },
  { icon: Activity, label: 'Stats', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <nav className="glass rounded-2xl shadow-2xl shadow-black/10 flex items-center justify-between px-2 py-2 pointer-events-auto mx-auto max-w-sm">
        {navItems.map((item) => {
          if (item.isFab) {
            return (
              <div key="fab" className="-mt-8 relative">
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 text-primary-foreground"
                  >
                    <Plus className="w-7 h-7" />
                  </motion.div>
                </Link>
              </div>
            )
          }

          const isActive = pathname === item.href
          const Icon = item.icon!

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("w-6 h-6 mb-1", isActive && "fill-current/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

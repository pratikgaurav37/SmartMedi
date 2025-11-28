'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Pill, Activity, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from '@/components/logout-button'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Pill, label: 'Medications', href: '/dashboard/medications' },
  { icon: Activity, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
		<aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-border glass">
			<div className="p-6">
				<h1 className="text-2xl font-bold text-gradient">Medi</h1>
				<p className="text-xs text-muted-foreground">
					Smart Medication Manager
				</p>
			</div>

			<nav className="flex-1 px-4 space-y-2">
				{navItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
								isActive
									? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
									: "hover:bg-secondary text-muted-foreground hover:text-foreground"
							)}
						>
							<item.icon
								className={cn(
									"w-5 h-5",
									isActive
										? "animate-pulse"
										: "group-hover:scale-110 transition-transform"
								)}
							/>
							<span className="font-medium">{item.label}</span>
						</Link>
					);
				})}
			</nav>

			<div className="p-4 border-t border-border/50">
				<LogoutButton  />
			</div>
		</aside>
	);
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Pill, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

const navItems = [
	{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
	{ icon: Pill, label: "Medications", href: "/dashboard/medications" },
	{ icon: Activity, label: "Analytics", href: "/dashboard/analytics" },
	{ icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-slate-950 border-r border-slate-200/60 dark:border-slate-800/60">
			{/* Header */}
			<div className="px-6 py-8">
				<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
					Medi
				</h1>
				<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
					Smart Medication Manager
				</p>
			</div>

			{/* Navigation */}
			<nav className="flex-1 px-3 space-y-1">
				{navItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 text-sm font-medium",
								isActive
									? "bg-primary text-primary-foreground"
									: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
							)}
						>
							<item.icon className="w-5 h-5 shrink-0" />
							<span>{item.label}</span>
						</Link>
					);
				})}
			</nav>

			{/* Footer */}
			<div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60">
				<LogoutButton />
			</div>
		</aside>
	);
}

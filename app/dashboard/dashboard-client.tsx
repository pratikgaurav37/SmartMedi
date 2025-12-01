"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Plus,
	Pill,
	Activity,
	Calendar,
	Sparkles,
	AlertTriangle,
	ArrowRight,
	Clock,
	Check,
	X,
} from "lucide-react";
import Link from "next/link";
import { Medication } from "@/lib/storage";
import { motion } from "framer-motion";

interface DashboardClientProps {
	user: { id: string; email?: string };
	profile: any;
	medications: Medication[];
	lowStockMeds: Medication[];
	greeting: string;
}

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export default function DashboardClient({
	user,
	profile,
	medications,
	lowStockMeds,
	greeting,
}: DashboardClientProps) {
	// Calculate stats
	const activeMeds = medications.length;
	// Placeholder for adherence - in a real app this would be calculated from logs
	const adherenceScore = 85;
	const streakDays = 3;

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="show"
			className="space-y-8 pb-20 max-w-7xl mx-auto "
		>
			{/* Header Section */}
			<motion.div
				variants={item}
				className="flex flex-col md:flex-row md:items-end justify-between gap-4 "
			>
				<div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
						{greeting}, <br />
						<span className="text-primary">
							{profile?.name?.split(" ")[0] || "Friend"}
						</span>
					</h1>
					<p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
						Here's your daily health overview.
					</p>
				</div>
				<Link href="/dashboard/add-medication">
					<Button
						size="lg"
						className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-primary hover:bg-primary/90 text-white px-6"
					>
						<Plus className="w-5 h-5 mr-2" /> Add Medication
					</Button>
				</Link>
			</motion.div>

			{/* Low Stock Alerts */}
			{lowStockMeds.length > 0 && (
				<motion.div variants={item}>
					<div className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-4">
						<div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
							<AlertTriangle className="w-6 h-6" />
						</div>
						<div>
							<h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg">
								Low Stock Alert
							</h3>
							<p className="text-amber-700 dark:text-amber-300 mt-1">
								You are running low on:{" "}
								<span className="font-semibold">
									{lowStockMeds.map((m) => m.name).join(", ")}
								</span>
								. Please refill soon.
							</p>
						</div>
					</div>
				</motion.div>
			)}

			{/* Quick Stats Grid */}
			<motion.div
				variants={item}
				className="grid grid-cols-2 lg:grid-cols-4 gap-4"
			>
				{/* Adherence Card - Featured */}
				<div className="col-span-2 bg-primary text-primary-foreground rounded-2xl p-6 relative overflow-hidden shadow-md group">
					<div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
						<Activity className="w-32 h-32" />
					</div>
					<div className="relative z-10 h-full flex flex-col justify-between">
						<div className="bg-primary-foreground/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
							<Activity className="w-6 h-6 text-primary-foreground" />
						</div>
						<div>
							<div className="flex items-baseline gap-2">
								<span className="text-5xl font-bold tracking-tighter">
									{adherenceScore}%
								</span>
								<span className="text-primary-foreground/80 font-medium">
									Adherence
								</span>
							</div>
							<p className="text-primary-foreground/60 text-sm mt-2">
								Great job! You're consistent.
							</p>
						</div>
					</div>
				</div>

				{/* Active Meds */}
				<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-primary/50 transition-colors duration-300 group">
					<div className="h-full flex flex-col justify-between">
						<div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Pill className="w-6 h-6" />
						</div>
						<div>
							<span className="text-3xl font-bold text-slate-900 dark:text-white block mt-4">
								{activeMeds}
							</span>
							<span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
								Active Meds
							</span>
						</div>
					</div>
				</div>

				{/* Streak */}
				<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-primary/50 transition-colors duration-300 group">
					<div className="h-full flex flex-col justify-between">
						<div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
							<Sparkles className="w-6 h-6" />
						</div>
						<div>
							<span className="text-3xl font-bold text-slate-900 dark:text-white block mt-4">
								{streakDays}
							</span>
							<span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
								Day Streak
							</span>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Today's Schedule Section */}
			<motion.section variants={item} className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
						<Calendar className="w-6 h-6 text-primary" />
						Today's Schedule
					</h2>
					<Link href="/dashboard/analytics">
						<Button
							variant="ghost"
							className="text-primary hover:bg-primary/10 hover:text-primary font-medium"
						>
							View Calendar <ArrowRight className="w-4 h-4 ml-1" />
						</Button>
					</Link>
				</div>

				{medications.length === 0 ? (
					<div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center text-center bg-slate-50/50 dark:bg-slate-900/50">
						<div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
							<Pill className="w-10 h-10 text-slate-400" />
						</div>
						<h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
							No medications yet
						</h3>
						<p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
							Add your first medication to get started with your schedule and
							tracking.
						</p>
						<Link href="/dashboard/add-medication">
							<Button size="lg" className="rounded-xl shadow-sm">
								Add First Medication
							</Button>
						</Link>
					</div>
				) : (
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{medications.map((med, index) => (
							<motion.div
								key={med.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<Link href={`/dashboard/medications/${med.id}`}>
									<div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-primary/30">
										<div className="flex justify-between items-start mb-4">
											<div className="flex items-center gap-4">
												<div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
													<Pill className="w-6 h-6" />
												</div>
												<div>
													<h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors">
														{med.name}
													</h3>
													<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
														{med.dosage}
													</p>
												</div>
											</div>
											<div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300">
												{med.frequency}
											</div>
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
												<div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
													<Clock className="w-4 h-4" />
													<span>Next Dose</span>
												</div>
												<span className="font-bold text-slate-900 dark:text-white">
													{med.times[0] || "Anytime"}
												</span>
											</div>

											{med.currentSupply !== undefined && (
												<div className="space-y-1.5 px-1">
													<div className="flex justify-between text-xs font-medium">
														<span className="text-slate-500">Supply</span>
														<span
															className={
																med.currentSupply <=
																(med.lowStockThreshold || 5)
																	? "text-red-500"
																	: "text-emerald-600"
															}
														>
															{med.currentSupply} left
														</span>
													</div>
													<div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
														<div
															className={`h-full rounded-full ${
																med.currentSupply <=
																(med.lowStockThreshold || 5)
																	? "bg-red-500"
																	: "bg-emerald-500"
															}`}
															style={{
																width: `${Math.min(
																	(med.currentSupply / 100) * 100,
																	100
																)}%`,
															}}
														/>
													</div>
												</div>
											)}
										</div>
									</div>
								</Link>
							</motion.div>
						))}

						<Link href="/dashboard/add-medication">
							<div className="h-full min-h-[200px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300 cursor-pointer gap-3 group">
								<div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
									<Plus className="w-6 h-6" />
								</div>
								<span className="font-semibold">Add New Medication</span>
							</div>
						</Link>
					</div>
				)}
			</motion.section>
		</motion.div>
	);
}

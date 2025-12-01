"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import {
	ChevronLeft,
	Pill,
	Clock,
	Package,
	Trash2,
	Check,
	X,
	AlertCircle,
	Timer,
	Calendar,
	Activity,
	ArrowLeft,
} from "lucide-react";
import { Medication, DoseLog, DoseStatus } from "@/lib/storage";
import Link from "next/link";
import { toast } from "sonner";
import { DelayDoseDialog } from "@/components/delay-dose-dialog";
import { motion } from "framer-motion";
import {
	getLocalTodayDate,
	getLocalYesterdayDate,
	getTodayDateAtTime,
} from "@/lib/date-utils";

interface MedicationDetailClientProps {
	medication: Medication;
	doseLogs: DoseLog[];
	userId: string;
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

export default function MedicationDetailClient({
	medication: initialMedication,
	doseLogs: initialLogs,
	userId,
}: MedicationDetailClientProps) {
	const router = useRouter();
	const [medication, setMedication] = useState(initialMedication);
	const [doseLogs, setDoseLogs] = useState(initialLogs);
	const [loading, setLoading] = useState(false);
	const [delayDialogOpen, setDelayDialogOpen] = useState(false);
	const [selectedDoseTime, setSelectedDoseTime] = useState<string | null>(null);

	// Check for missed doses on mount
	useEffect(() => {
		const checkMissedDoses = async () => {
			const now = new Date();
			// Use local date for today
			const todayStr = getLocalTodayDate();

			// Check previous days or earlier times today
			// For simplicity in this view, we just check if there are any times in the past
			// that don't have a log or are "pending" (which implies no log)
			// However, since we only load "doseLogs" which are *existing* logs,
			// we need to infer missed doses from the schedule.

			// Actually, the requirement is "previous non taken and mark them missed".
			// We can iterate over the schedule for today and see if any time < now is missing a log.
			// For previous days, we'd need to know if the user visited the app.
			// If we only check "today" here, it covers the "open app during the day" case.
			// For "yesterday", we might need a broader check.

			// Let's implement a check for "Today's Missed Doses" first.

			const missedTimes: string[] = [];

			// Use local date for yesterday
			const yesterdayStr = getLocalYesterdayDate();

			// Check if yesterday has logs for all times
			const yesterdayLogs = doseLogs.filter((l) =>
				l.scheduledTime.startsWith(yesterdayStr)
			);

			const missingTimesYesterday = medication.times.filter((time) => {
				return !yesterdayLogs.find((l) => l.scheduledTime.includes(time));
			});

			if (missingTimesYesterday.length > 0) {
				await Promise.all(
					missingTimesYesterday.map(async (time) => {
						const [hours, minutes] = time.split(":").map(Number);
						// Construct yesterday's date object correctly
						const scheduledDate = new Date(yesterdayStr);
						scheduledDate.setHours(hours, minutes, 0, 0);

						const logId = `${medication.id}_${yesterdayStr}_${time}`;

						await fetch("/api/dose-logs/create", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								id: logId,
								medicationId: medication.id,
								scheduledTime: scheduledDate.toISOString(),
								status: "missed",
							}),
						});
					})
				);

				router.refresh();
			}
		};

		checkMissedDoses();
	}, [medication.id, medication.times, doseLogs, router]);

	const getTodayLog = (time: string) => {
		const todayStr = getLocalTodayDate();
		const logId = `${medication.id}_${todayStr}_${time}`;
		return doseLogs.find((l) => l.id === logId);
	};

	const getNextDoseTime = (currentTime: string) => {
		const currentIndex = medication.times.indexOf(currentTime);
		if (currentIndex === -1 || currentIndex === medication.times.length - 1) {
			return undefined;
		}
		return medication.times[currentIndex + 1];
	};

	const handleAction = async (
		status: DoseStatus,
		scheduledTime: string,
		delayedUntil?: string,
		delayReason?: string,
		currentDelayCount?: number
	) => {
		setLoading(true);
		try {
			const todayStr = getLocalTodayDate();
			const logId = `${medication.id}_${todayStr}_${scheduledTime}`;

			const scheduledDate = getTodayDateAtTime(scheduledTime);

			const response = await fetch("/api/dose-logs/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: logId,
					medicationId: medication.id,
					scheduledTime: scheduledDate.toISOString(),
					actualTime:
						status !== "delayed" ? new Date().toISOString() : undefined,
					status,
					delayedUntil,
					delayReason,
					delayCount:
						status === "delayed" ? (currentDelayCount || 0) + 1 : undefined,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to log dose");
			}

			const { data: newLog } = await response.json();

			// Update local state
			setDoseLogs((prev) => {
				const filtered = prev.filter((l) => l.id !== logId);
				return [newLog, ...filtered];
			});

			// Refresh to get updated medication (with decremented supply)
			router.refresh();

			const statusMessage =
				status === "delayed"
					? `Reminder set for ${new Date(delayedUntil!).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
					  })}`
					: `Marked as ${status}`;
			toast.success(statusMessage);
		} catch (error) {
			console.error("Error logging dose:", error);
			toast.error("Failed to log dose");
		} finally {
			setLoading(false);
		}
	};

	const handleDelayConfirm = (delayMinutes: number, reason?: string) => {
		if (!selectedDoseTime) return;

		const log = getTodayLog(selectedDoseTime);
		const currentDelayCount = log?.delayCount || 0;

		const scheduledDate = getTodayDateAtTime(selectedDoseTime);

		const delayedUntil = new Date(
			scheduledDate.getTime() + delayMinutes * 60000
		).toISOString();

		handleAction(
			"delayed",
			selectedDoseTime,
			delayedUntil,
			reason,
			currentDelayCount
		);
		setSelectedDoseTime(null);
	};

	const handleRemindLater = (time: string) => {
		setSelectedDoseTime(time);
		setDelayDialogOpen(true);
	};

	const handleDelete = async () => {
		if (!confirm("Are you sure you want to delete this medication?")) {
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`/api/medications/${medication.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete medication");
			}

			toast.success("Medication deleted");
			router.push("/dashboard");
		} catch (error) {
			console.error("Error deleting medication:", error);
			toast.error("Failed to delete medication");
			setLoading(false);
		}
	};

	const getStatusBadge = (log: DoseLog | undefined) => {
		if (!log) {
			return <Badge status="upcoming" />;
		}

		return <Badge status={log.status} />;
	};

	const isLowStock =
		medication.currentSupply !== undefined &&
		medication.lowStockThreshold !== undefined &&
		medication.currentSupply <= medication.lowStockThreshold;

	// Calculate adherence for this medication
	const takenDoses = doseLogs.filter((log) => log.status === "taken").length;
	const totalDoses = doseLogs.length;
	const adherencePercentage =
		totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

	// Calculate days active
	const startDate = new Date(medication.startDate);
	const today = new Date();
	const daysActive = Math.floor(
		(today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
	);

	return (
		<motion.div
			variants={container}
			initial="hidden"
			animate="show"
			className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20"
		>
			{/* Hero Header */}
			<div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-12 px-6 shadow-sm relative overflow-hidden rounded-lg">
				<div className="max-w-4xl mx-auto relative z-10">
					<div className="flex items-center justify-between mb-8">
						<Link href="/dashboard">
							<Button
								variant="ghost"
								size="icon"
								className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-full"
							>
								<ArrowLeft className="w-6 h-6" />
							</Button>
						</Link>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDelete}
							disabled={loading}
							className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
						>
							<Trash2 className="w-5 h-5" />
						</Button>
					</div>

					<motion.div
						variants={item}
						className="flex flex-col md:flex-row items-start md:items-center gap-6"
					>
						<div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
							<Pill className="w-10 h-10 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 dark:text-white">
								{medication.name}
							</h1>
							<div className="flex flex-wrap gap-3 text-slate-500 dark:text-slate-400">
								<span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm font-medium">
									{medication.dosage}
								</span>
								<span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm font-medium">
									{medication.type}
								</span>
								<span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
									<Clock className="w-3 h-3" /> {medication.times.length}x daily
								</span>
							</div>
						</div>
					</motion.div>
				</div>
			</div>

			<div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20 space-y-8">
				{/* Stats Grid */}
				<motion.div
					variants={item}
					className="grid grid-cols-1 md:grid-cols-3 gap-4"
				>
					<div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
						<div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
							<Clock className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
								Frequency
							</p>
							<p className="text-lg font-bold text-slate-900 dark:text-white">
								{medication.times.length} times/day
							</p>
						</div>
					</div>

					<div
						className={`bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border flex items-center gap-4 ${
							isLowStock
								? "border-red-200 dark:border-red-900/50"
								: "border-slate-200 dark:border-slate-800"
						}`}
					>
						<div
							className={`p-3 rounded-lg ${
								isLowStock
									? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
									: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
							}`}
						>
							<Package className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
								Current Supply
							</p>
							<p
								className={`text-lg font-bold ${
									isLowStock
										? "text-red-600 dark:text-red-400"
										: "text-slate-900 dark:text-white"
								}`}
							>
								{medication.currentSupply} {medication.supplyUnit || "units"}
							</p>
						</div>
					</div>

					<div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
						<div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
							<Calendar className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
								Days Active
							</p>
							<p className="text-lg font-bold text-slate-900 dark:text-white">
								{daysActive} days
							</p>
						</div>
					</div>
				</motion.div>

				{/* Adherence Stats Row */}
				<motion.div
					variants={item}
					className="grid grid-cols-1 md:grid-cols-2 gap-4"
				>
					<div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-4">
						<div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
							<Activity className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
								Adherence Rate
							</p>
							<p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
								{adherencePercentage}%
							</p>
						</div>
					</div>

					<div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 flex items-center gap-4">
						<div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
							<Check className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
								Total Doses Taken
							</p>
							<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
								{takenDoses} / {totalDoses}
							</p>
						</div>
					</div>
				</motion.div>

				{medication.notes && (
					<motion.div
						variants={item}
						className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-4 rounded-xl flex gap-3 text-amber-900 dark:text-amber-100"
					>
						<AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
						<p className="text-sm">{medication.notes}</p>
					</motion.div>
				)}

				<div className="grid md:grid-cols-2 gap-8">
					{/* Today's Schedule */}
					<motion.section variants={item} className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
								<Activity className="w-5 h-5 text-primary" />
								Today's Schedule
							</h3>
							{medication.times.every((time) => {
								const log = getTodayLog(time);
								return log?.status === "taken";
							}) && (
								<span className="flex items-center bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
									<Check className="w-3 h-3 mr-1" /> All Taken
								</span>
							)}
						</div>
						<div className="space-y-4">
							{medication.times.length > 0 ? (
								medication.times.sort().map((time, index) => {
									const log = getTodayLog(time);

									// Logic to determine if this is the next dose
									const now = new Date();
									const [hours, minutes] = time.split(":").map(Number);
									const doseTime = new Date();
									doseTime.setHours(hours, minutes, 0, 0);

									// Simple check: if it's not logged and time is in future (or close enough)
									// For a real app, you'd want more robust "next dose" logic handling multiple days
									const isNext = !log && doseTime > now;
									const isPast = !log && doseTime < now;

									const isActionable = !log || log?.status === "delayed";

									return (
										<div
											key={time}
											className={`bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border transition-all duration-300 ${
												isNext
													? "border-primary ring-1 ring-primary shadow-md"
													: "border-slate-200 dark:border-slate-800"
											}`}
										>
											<div className="flex justify-between items-center mb-4">
												<div className="flex items-center gap-3">
													<div
														className={`px-3 py-1.5 rounded-lg font-bold ${
															isNext
																? "bg-primary text-white"
																: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
														}`}
													>
														{time}
													</div>
													{getStatusBadge(log)}
													{isNext && (
														<span className="text-xs font-medium text-primary animate-pulse">
															Next Dose
														</span>
													)}
												</div>
											</div>

											{!isActionable ? (
												<div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 flex items-center gap-3">
													<div
														className={`w-2 h-2 rounded-full ${
															log?.status === "taken"
																? "bg-emerald-500"
																: log?.status === "skipped"
																? "bg-slate-400"
																: "bg-amber-500"
														}`}
													/>
													<p className="text-sm text-slate-600 dark:text-slate-300">
														{log?.status === "taken"
															? "Taken"
															: `Marked as ${log?.status}`}{" "}
														at{" "}
														{log?.actualTime &&
															new Date(log.actualTime).toLocaleTimeString([], {
																hour: "2-digit",
																minute: "2-digit",
															})}
													</p>
												</div>
											) : (
												<div className="space-y-3">
													{log?.status === "delayed" && (
														<p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
															<Timer className="w-4 h-4" />
															Delayed until{" "}
															{log?.delayedUntil &&
																new Date(log.delayedUntil).toLocaleTimeString(
																	[],
																	{
																		hour: "2-digit",
																		minute: "2-digit",
																	}
																)}
														</p>
													)}
													<div className="grid grid-cols-3 gap-3">
														<Button
															onClick={() => handleAction("taken", time)}
															disabled={loading}
															className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg h-10"
														>
															<Check className="w-4 h-4 mr-1" /> Take
														</Button>
														{(!log || (log?.delayCount || 0) < 3) && (
															<Button
																variant="outline"
																onClick={() => handleRemindLater(time)}
																disabled={loading}
																className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg h-10"
															>
																<Timer className="w-4 h-4 mr-1" /> Later
															</Button>
														)}
														<Button
															variant="outline"
															onClick={() => handleAction("skipped", time)}
															disabled={loading}
															className="border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg h-10"
														>
															<X className="w-4 h-4 mr-1" /> Skip
														</Button>
													</div>
												</div>
											)}
										</div>
									);
								})
							) : (
								<div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
									<p className="text-slate-500 dark:text-slate-400 mb-4">
										No fixed schedule for this medication.
									</p>
									<Button
										onClick={() =>
											handleAction(
												"taken",
												new Date().toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
													hour12: false,
												})
											)
										}
										disabled={loading}
										className="rounded-lg"
									>
										Log Dose Now
									</Button>
								</div>
							)}
						</div>
					</motion.section>

					{/* History Timeline */}
					<motion.section variants={item} className="space-y-4">
						<h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
							<Clock className="w-5 h-5 text-primary" />
							History
						</h3>
						<div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
							{doseLogs.length === 0 ? (
								<p className="text-center text-slate-400 py-8 text-sm">
									No logs yet.
								</p>
							) : (
								<div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
									{doseLogs
										.sort(
											(a, b) =>
												new Date(b.scheduledTime).getTime() -
												new Date(a.scheduledTime).getTime()
										)
										.slice(0, 10)
										.map((log) => (
											<div
												key={log.id}
												className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
											>
												<div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
													<div
														className={`w-3 h-3 rounded-full ${
															log.status === "taken"
																? "bg-emerald-500"
																: log.status === "skipped"
																? "bg-slate-400"
																: log.status === "missed"
																? "bg-red-500"
																: "bg-amber-500"
														}`}
													/>
												</div>
												<div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
													<div className="flex items-center justify-between mb-1">
														<span className="font-bold text-slate-900 dark:text-white capitalize">
															{log.status.replace("_", " ")}
														</span>
														<time className="font-mono text-xs text-slate-500">
															{new Date(log.scheduledTime).toLocaleDateString(
																undefined,
																{ month: "short", day: "numeric" }
															)}
														</time>
													</div>
													<p
														className="text-xs text-slate-500 dark:text-slate-400"
														suppressHydrationWarning
													>
														Scheduled:{" "}
														{new Date(log.scheduledTime).toLocaleTimeString(
															[],
															{ hour: "2-digit", minute: "2-digit" }
														)}
													</p>
												</div>
											</div>
										))}
								</div>
							)}
						</div>
					</motion.section>
				</div>
			</div>

			{/* Delay Dose Dialog */}
			<DelayDoseDialog
				open={delayDialogOpen}
				onOpenChange={setDelayDialogOpen}
				medicationName={medication.name}
				scheduledTime={
					selectedDoseTime
						? (() => {
								const [hours, minutes] = selectedDoseTime
									.split(":")
									.map(Number);
								const date = new Date();
								date.setHours(hours, minutes, 0, 0);
								return date.toISOString();
						  })()
						: new Date().toISOString()
				}
				nextDoseTime={
					selectedDoseTime
						? (() => {
								const nextTime = getNextDoseTime(selectedDoseTime);
								if (!nextTime) return undefined;
								const [hours, minutes] = nextTime.split(":").map(Number);
								const date = new Date();
								date.setHours(hours, minutes, 0, 0);
								return date.toISOString();
						  })()
						: undefined
				}
				onConfirm={handleDelayConfirm}
			/>
		</motion.div>
	);
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	ChevronLeft,
	ChevronRight,
	Calendar as CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import { Medication, DoseLog } from "@/lib/storage";
import { DayDetailDialog } from "./day-detail-dialog";

interface AnalyticsClientProps {
	medications: Medication[];
	doseLogs: DoseLog[];
}

export default function AnalyticsClient({
	medications,
	doseLogs,
}: AnalyticsClientProps) {
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	const daysInMonth = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth() + 1,
		0
	).getDate();
	const firstDayOfMonth = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth(),
		1
	).getDay();

	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	const prevMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
		);
	};

	const nextMonth = () => {
		setCurrentDate(
			new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
		);
	};

	const handleDayClick = (day: number) => {
		const date = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			day
		);
		// Don't allow clicking future dates
		if (date > new Date()) return;

		setSelectedDate(date);
		setDetailOpen(true);
	};

	// Calculate adherence for the current month
	const getMonthlyAdherence = () => {
		const startOfMonth = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			1
		);
		const endOfMonth = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() + 1,
			0
		);

		const monthLogs = doseLogs.filter((log) => {
			const logDate = new Date(log.scheduledTime);
			return logDate >= startOfMonth && logDate <= endOfMonth;
		});

		if (monthLogs.length === 0) return 0;

		const takenCount = monthLogs.filter((log) => log.status === "taken").length;
		return Math.round((takenCount / monthLogs.length) * 100);
	};

	const adherence = getMonthlyAdherence();

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col">
			<div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
				<Link href="/dashboard">
					<Button variant="ghost" size="icon" className="-ml-2">
						<ChevronLeft className="w-6 h-6 text-slate-600" />
					</Button>
				</Link>
				<h1 className="text-lg font-bold text-slate-900 ml-2">
					Analytics & History
				</h1>
			</div>

			<main className="p-6 space-y-6 max-w-md mx-auto w-full">
				{/* Adherence Stats */}
				<Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
					<CardContent className="p-6">
						<h2 className="text-sm font-medium opacity-80 mb-4">
							Monthly Adherence
						</h2>
						<div className="flex items-end gap-2">
							<span className="text-4xl font-bold">{adherence}%</span>
							<span className="text-sm opacity-80 mb-1">
								{adherence >= 90
									? "Excellent!"
									: adherence >= 70
									? "Good"
									: "Needs Improvement"}
							</span>
						</div>
						<div className="mt-4 h-2 bg-black/20 rounded-full overflow-hidden">
							<div
								className="h-full bg-white/90 rounded-full transition-all duration-500"
								style={{ width: `${adherence}%` }}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Calendar */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-base font-semibold">
							{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
						</CardTitle>
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={prevMonth}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8"
								onClick={nextMonth}
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-slate-500">
							<div>Su</div>
							<div>Mo</div>
							<div>Tu</div>
							<div>We</div>
							<div>Th</div>
							<div>Fr</div>
							<div>Sa</div>
						</div>
						<div className="grid grid-cols-7 gap-1">
							{Array.from({ length: firstDayOfMonth }).map((_, i) => (
								<div key={`empty-${i}`} />
							))}
							{Array.from({ length: daysInMonth }).map((_, i) => {
								const day = i + 1;
								const date = new Date(
									currentDate.getFullYear(),
									currentDate.getMonth(),
									day
								);
								const isToday =
									day === new Date().getDate() &&
									currentDate.getMonth() === new Date().getMonth() &&
									currentDate.getFullYear() === new Date().getFullYear();

								// Determine status for the day
								// 1. Find logs for this day
								const dayLogs = doseLogs.filter((log) => {
									const logDate = new Date(log.scheduledTime);
									return (
										logDate.getDate() === day &&
										logDate.getMonth() === currentDate.getMonth() &&
										logDate.getFullYear() === currentDate.getFullYear()
									);
								});

								// 2. Find expected medications for this day
								const activeMedications = medications.filter((med) => {
									const start = new Date(med.startDate);
									const end = med.endDate ? new Date(med.endDate) : null;
									return date >= start && (!end || date <= end);
								});

								// Calculate expected doses count (approximate based on times array length)
								// This is a simplification; ideally we check frequency logic
								const expectedDosesCount = activeMedications.reduce(
									(acc, med) => acc + med.times.length,
									0
								);

								let status: "taken" | "missed" | "partial" | "none" = "none";

								if (expectedDosesCount > 0) {
									if (dayLogs.length === 0) {
										// If expected doses > 0 but no logs, and date is in past => Missed
										if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
											status = "missed";
										} else {
											status = "none"; // Future or today with no logs yet
										}
									} else {
										const taken = dayLogs.filter(
											(l) => l.status === "taken"
										).length;
										const missed = dayLogs.filter(
											(l) => l.status === "missed"
										).length;
										const skipped = dayLogs.filter(
											(l) => l.status === "skipped"
										).length;

										// If we have logs, we check against expected count?
										// Or just check the logs we have?
										// Let's rely on logs + expected count.

										if (taken === expectedDosesCount) status = "taken";
										else if (taken > 0) status = "partial";
										else if (missed > 0 || skipped > 0)
											status = "missed"; // Or partial if some skipped?
										else status = "partial"; // Fallback

										// Refined logic:
										// All taken = taken
										// Any taken = partial
										// No taken, but some missed/skipped = missed
									}
								}

								const isFuture = date > new Date();

								return (
									<div
										key={day}
										onClick={() => handleDayClick(day)}
										className={`
                                            aspect-square flex items-center justify-center rounded-lg text-sm relative cursor-pointer transition-colors
                                            ${
																							isToday
																								? "bg-blue-600 text-white font-bold shadow-md"
																								: "hover:bg-slate-100"
																						}
                                            ${
																							!isToday &&
																							!isFuture &&
																							status === "missed"
																								? "bg-red-50 text-red-600"
																								: ""
																						}
                                            ${
																							!isToday &&
																							!isFuture &&
																							status === "taken"
																								? "bg-green-50 text-green-600"
																								: ""
																						}
                                            ${
																							!isToday &&
																							!isFuture &&
																							status === "partial"
																								? "bg-amber-50 text-amber-600"
																								: ""
																						}
                                        `}
									>
										{day}
										{!isFuture && !isToday && status !== "none" && (
											<div
												className={`absolute bottom-1 w-1 h-1 rounded-full 
                                                ${
																									status === "taken"
																										? "bg-green-500"
																										: status === "missed"
																										? "bg-red-500"
																										: "bg-amber-500"
																								}`}
											/>
										)}
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* Insights */}
				<div className="space-y-4">
					<h3 className="font-semibold text-slate-900">Insights</h3>
					<div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 items-start">
						<div className="bg-yellow-100 p-2 rounded-lg text-yellow-700 shrink-0">
							<CalendarIcon className="w-5 h-5" />
						</div>
						<div>
							<h4 className="font-medium text-sm">Most Missed Day</h4>
							<p className="text-xs text-slate-500 mt-1">
								You tend to miss medications more often on{" "}
								<span className="font-semibold text-slate-700">Sundays</span>.
							</p>
						</div>
					</div>
				</div>
			</main>

			{selectedDate && (
				<DayDetailDialog
					open={detailOpen}
					onOpenChange={setDetailOpen}
					date={selectedDate}
					medications={medications}
					doseLogs={doseLogs}
				/>
			)}
		</div>
	);
}

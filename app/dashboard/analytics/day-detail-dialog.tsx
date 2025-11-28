"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Medication, DoseLog } from "@/lib/storage";
import { Clock, Pill, Check, X, AlertCircle } from "lucide-react";

interface DayDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	date: Date;
	medications: Medication[];
	doseLogs: DoseLog[];
}

export function DayDetailDialog({
	open,
	onOpenChange,
	date,
	medications,
	doseLogs,
}: DayDetailDialogProps) {
	// Filter logs for this date
	const dateStr = date.toISOString().split("T")[0];
	const dayLogs = doseLogs.filter((log) =>
		log.scheduledTime.startsWith(dateStr)
	);

	// Get all scheduled medications for this day
	// This logic mimics what we did in the calendar view but more detailed
	const scheduledItems = medications.flatMap((med) => {
		// Check if medication was active on this date
		const startDate = new Date(med.startDate);
		const endDate = med.endDate ? new Date(med.endDate) : null;
		const checkDate = new Date(dateStr);

		if (checkDate < startDate) return [];
		if (endDate && checkDate > endDate) return [];

		// Check if it's a scheduled day (simple daily check for now)
		// Ideally we'd check frequency/days of week if that was in schema
		// Schema has `times: string[]`, assuming daily.

		return med.times.map((time) => {
			const log = dayLogs.find(
				(l) => l.medicationId === med.id && l.scheduledTime.includes(time)
			);

			return {
				medication: med,
				time,
				log,
				status: log?.status || "pending", // 'pending' implies missed if in past
			};
		});
	});

	// Sort by time
	scheduledItems.sort((a, b) => {
		const [aH, aM] = a.time.split(":").map(Number);
		const [bH, bM] = b.time.split(":").map(Number);
		return aH * 60 + aM - (bH * 60 + bM);
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{date.toLocaleDateString("en-US", {
							weekday: "long",
							month: "long",
							day: "numeric",
						})}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
					{scheduledItems.length === 0 ? (
						<div className="text-center py-8 text-slate-500">
							No medications scheduled for this day.
						</div>
					) : (
						scheduledItems.map((item, index) => {
							const isMissed =
								item.status === "pending" &&
								new Date(dateStr) < new Date(new Date().toDateString()); // Past date and pending = missed (inferred)

							const displayStatus = isMissed ? "missed" : item.status;

							return (
								<div
									key={`${item.medication.id}-${item.time}-${index}`}
									className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-primary">
											<Pill className="w-5 h-5" />
										</div>
										<div>
											<p className="font-medium text-slate-900 dark:text-white">
												{item.medication.name}
											</p>
											<div className="flex items-center gap-2 text-xs text-slate-500">
												<Clock className="w-3 h-3" />
												{item.time}
												<span className="w-1 h-1 rounded-full bg-slate-300" />
												{item.medication.dosage}
											</div>
										</div>
									</div>
									<span
										className={`capitalize px-2 py-1 rounded-full text-xs font-bold ${
											displayStatus === "taken"
												? "bg-emerald-100 text-emerald-700"
												: displayStatus === "missed"
												? "bg-red-100 text-red-700"
												: displayStatus === "skipped"
												? "bg-slate-100 text-slate-700"
												: "bg-amber-100 text-amber-700"
										}`}
									>
										{displayStatus}
									</span>
								</div>
							);
						})
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

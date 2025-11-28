"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, AlertCircle } from "lucide-react";

interface DelayDoseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	medicationName: string;
	scheduledTime: string;
	nextDoseTime?: string;
	onConfirm: (delayMinutes: number, reason?: string) => void;
}

const DELAY_OPTIONS = [
	{ label: "15 minutes", minutes: 15 },
	{ label: "30 minutes", minutes: 30 },
	{ label: "1 hour", minutes: 60 },
	{ label: "2 hours", minutes: 120 },
	{ label: "4 hours", minutes: 240 },
];

export function DelayDoseDialog({
	open,
	onOpenChange,
	medicationName,
	scheduledTime,
	nextDoseTime,
	onConfirm,
}: DelayDoseDialogProps) {
	const [selectedDelay, setSelectedDelay] = useState<number | null>(null);
	const [customMinutes, setCustomMinutes] = useState("");
	const [reason, setReason] = useState("");
	const [showWarning, setShowWarning] = useState(false);

	const handleConfirm = () => {
		const delayMinutes =
			selectedDelay === -1 ? parseInt(customMinutes) : selectedDelay;

		if (!delayMinutes || delayMinutes <= 0) {
			return;
		}

		onConfirm(delayMinutes, reason || undefined);
		handleClose();
	};

	const handleClose = () => {
		setSelectedDelay(null);
		setCustomMinutes("");
		setReason("");
		setShowWarning(false);
		onOpenChange(false);
	};

	const handleDelaySelect = (minutes: number) => {
		setSelectedDelay(minutes);
		setCustomMinutes("");

		// Check if delay conflicts with next dose
		if (nextDoseTime) {
			const delayedTime = new Date(
				new Date(scheduledTime).getTime() + minutes * 60000
			);
			const nextTime = new Date(nextDoseTime);
			setShowWarning(delayedTime >= nextTime);
		}
	};

	const getDelayedTime = () => {
		const delayMinutes =
			selectedDelay === -1 ? parseInt(customMinutes) : selectedDelay;
		if (!delayMinutes) return "";

		const delayed = new Date(
			new Date(scheduledTime).getTime() + delayMinutes * 60000
		);
		return delayed.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Clock className="w-5 h-5 text-amber-500" />
						Remind Me Later
					</DialogTitle>
					<DialogDescription>
						How long would you like to delay taking{" "}
						<strong>{medicationName}</strong>?
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Quick Options */}
					<div>
						<Label className="text-sm font-medium mb-2 block">
							Quick Options
						</Label>
						<div className="grid grid-cols-2 gap-2">
							{DELAY_OPTIONS.map((option) => (
								<Button
									key={option.minutes}
									variant={
										selectedDelay === option.minutes ? "default" : "outline"
									}
									onClick={() => handleDelaySelect(option.minutes)}
									className="justify-start"
								>
									{option.label}
								</Button>
							))}
						</div>
					</div>

					{/* Custom Time */}
					<div>
						<Label
							htmlFor="custom-delay"
							className="text-sm font-medium mb-2 block"
						>
							Custom Delay (minutes)
						</Label>
						<input
							id="custom-delay"
							type="number"
							min="1"
							max="1440"
							value={customMinutes}
							onChange={(e) => {
								setCustomMinutes(e.target.value);
								setSelectedDelay(-1);
								const minutes = parseInt(e.target.value);
								if (minutes > 0 && nextDoseTime) {
									const delayedTime = new Date(
										new Date(scheduledTime).getTime() + minutes * 60000
									);
									const nextTime = new Date(nextDoseTime);
									setShowWarning(delayedTime >= nextTime);
								}
							}}
							className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Enter minutes"
						/>
					</div>

					{/* Optional Reason */}
					<div>
						<Label htmlFor="reason" className="text-sm font-medium mb-2 block">
							Reason (Optional)
						</Label>
						<Textarea
							id="reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="e.g., Taking with food, waiting for meal..."
							className="resize-none"
							rows={2}
						/>
					</div>

					{/* Delayed Time Preview */}
					{(selectedDelay || customMinutes) && (
						<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
							<p className="text-sm text-blue-900">
								<strong>Reminder at:</strong> {getDelayedTime()}
							</p>
						</div>
					)}

					{/* Warning for conflicting doses */}
					{showWarning && nextDoseTime && (
						<div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
							<AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
							<div className="text-sm text-amber-900">
								<strong>Warning:</strong> This delay extends past your next
								scheduled dose at{" "}
								{new Date(nextDoseTime).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
								})}
								. Consider skipping instead.
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						onClick={handleConfirm}
						disabled={!selectedDelay && !customMinutes}
						className="bg-amber-500 hover:bg-amber-600"
					>
						Set Reminder
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

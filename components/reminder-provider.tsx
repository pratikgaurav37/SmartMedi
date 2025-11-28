"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Medication, DoseLog, DoseStatus } from "@/lib/storage";
import { ReminderToast } from "./reminder-toast";

interface ReminderContextType {
	checkReminders: () => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(
	undefined
);

export const useReminder = () => {
	const context = useContext(ReminderContext);
	if (!context) {
		throw new Error("useReminder must be used within a ReminderProvider");
	}
	return context;
};

export function ReminderProvider({ children }: { children: React.ReactNode }) {
	const [activeReminder, setActiveReminder] = useState<{
		medication: Medication;
		scheduledTime: string; // ISO string of the specific dose time
		logId: string;
	} | null>(null);

	const [userId, setUserId] = useState<string | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		// Initialize audio (optional - will fail silently if file doesn't exist)
		try {
			audioRef.current = new Audio("/sounds/notification.mp3");
		} catch (e) {
			console.log("Notification sound not available");
		}

		const supabase = createClient();
		const getUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) setUserId(user.id);
		};
		getUser();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUserId(session?.user?.id ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	const checkReminders = async () => {
		if (!userId) return;

		try {
			const now = new Date();

			// Fetch from API routes instead of direct server functions
			const [medsResponse, logsResponse] = await Promise.all([
				fetch("/api/medications"),
				fetch("/api/dose-logs"),
			]);

			if (!medsResponse.ok || !logsResponse.ok) {
				console.error("Failed to fetch data for reminders");
				return;
			}

			const { medications: meds } = await medsResponse.json();
			const { doseLogs: logs } = await logsResponse.json();

			// We look for doses scheduled in the last 30 minutes that haven't been handled
			// OR delayed doses that are due now.

			for (const med of meds) {
				for (const timeStr of med.times) {
					const [hours, minutes] = timeStr.split(":").map(Number);
					const scheduledDate = new Date();
					scheduledDate.setHours(hours, minutes, 0, 0);

					// If scheduled time is in the future, skip
					if (scheduledDate.getTime() > now.getTime()) continue;

					// If scheduled time is more than 30 mins ago, check if we should mark as missed
					const timeDiff = now.getTime() - scheduledDate.getTime();
					const isMissedWindow = timeDiff > 30 * 60 * 1000; // 30 mins

					// Create a unique ID for this dose instance
					// Format: medId_YYYY-MM-DD_HH:MM
					const dateStr = scheduledDate.toISOString().split("T")[0];
					const logId = `${med.id}_${dateStr}_${timeStr}`;

					const existingLog = logs.find((l: DoseLog) => l.id === logId);

					if (!existingLog) {
						if (isMissedWindow) {
							// Mark as missed silently if we missed the window entirely
							await fetch("/api/dose-logs/create", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									id: logId,
									medicationId: med.id,
									scheduledTime: scheduledDate.toISOString(),
									status: "missed",
									notes: "Auto-marked as unresponsive",
								}),
							});
						} else {
							// It's due and within window!
							triggerReminder(med, scheduledDate.toISOString(), logId);
							return; // Only show one at a time
						}
					} else {
						// Log exists
						if (existingLog.status === "delayed" && existingLog.delayedUntil) {
							const delayedUntil = new Date(existingLog.delayedUntil);
							if (now >= delayedUntil) {
								// Re-trigger
								triggerReminder(med, scheduledDate.toISOString(), logId);
								return;
							}
						}
					}
				}
			}
		} catch (error) {
			console.error("Error checking reminders:", error);
		}
	};

	const triggerReminder = async (
		med: Medication,
		scheduledTime: string,
		logId: string
	) => {
		// Don't override an existing active reminder
		if (activeReminder) return;

		setActiveReminder({
			medication: med,
			scheduledTime,
			logId,
		});

		// Play sound if possible
		try {
			if (audioRef.current) {
				audioRef.current.play().catch(() => {});
			}
		} catch (e) {
			// Ignore audio errors
		}

		// Send Telegram notification if user has configured it
		if (userId) {
			try {
				const profileResponse = await fetch("/api/profile");
				if (profileResponse.ok) {
					const { profile } = await profileResponse.json();

					if (profile?.telegramChatId) {
						try {
							await fetch("/api/telegram/send", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({
									chatId: profile.telegramChatId,
									medicationName: med.name,
									scheduledTime,
									dosage: med.dosage,
								}),
							});
							console.log("📱 Telegram notification sent");
						} catch (error) {
							console.error("Failed to send Telegram notification:", error);
						}
					}
				}
			} catch (error) {
				console.error("Failed to fetch profile:", error);
			}
		}
	};

	// Check every minute
	useEffect(() => {
		const interval = setInterval(checkReminders, 60000); // Every minute

		// Also check immediately on mount/user change
		checkReminders();

		return () => clearInterval(interval);
	}, [userId, activeReminder]); // Re-run if user changes or active reminder clears

	const handleTaken = async () => {
		if (!activeReminder || !userId) return;

		await fetch("/api/dose-logs/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: activeReminder.logId,
				medicationId: activeReminder.medication.id,
				scheduledTime: activeReminder.scheduledTime,
				actualTime: new Date().toISOString(),
				status: "taken",
			}),
		});

		setActiveReminder(null);
	};

	const handleSkip = async () => {
		if (!activeReminder || !userId) return;

		await fetch("/api/dose-logs/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: activeReminder.logId,
				medicationId: activeReminder.medication.id,
				scheduledTime: activeReminder.scheduledTime,
				actualTime: new Date().toISOString(),
				status: "skipped",
			}),
		});

		setActiveReminder(null);
	};

	const handleRemindLater = async () => {
		if (!activeReminder || !userId) return;
		const now = new Date();
		const delayMinutes = 10;
		const delayedUntil = new Date(now.getTime() + delayMinutes * 60000);

		await fetch("/api/dose-logs/create", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: activeReminder.logId,
				medicationId: activeReminder.medication.id,
				scheduledTime: activeReminder.scheduledTime,
				status: "delayed",
				delayedUntil: delayedUntil.toISOString(),
			}),
		});

		setActiveReminder(null);
	};

	return (
		<ReminderContext.Provider value={{ checkReminders }}>
			{children}
			{activeReminder && (
				<ReminderToast
					visible={!!activeReminder}
					medicationName={activeReminder.medication.name}
					scheduledTime={activeReminder.scheduledTime}
					onTaken={handleTaken}
					onSkip={handleSkip}
					onRemindLater={handleRemindLater}
				/>
			)}
		</ReminderContext.Provider>
	);
}

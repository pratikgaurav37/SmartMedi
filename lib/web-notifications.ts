"use client";

/**
 * Web Notification Utilities
 * Handles browser push notifications for medication reminders
 */

export type NotificationPermissionStatus =
	| "granted"
	| "denied"
	| "default"
	| "unsupported";

/**
 * Check if notifications are supported in the current browser
 */
export function isNotificationSupported(): boolean {
	return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermissionStatus {
	if (!isNotificationSupported()) {
		return "unsupported";
	}
	return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission from the user
 * @returns Promise resolving to the permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
	if (!isNotificationSupported()) {
		return "unsupported";
	}

	try {
		const permission = await Notification.requestPermission();
		return permission as NotificationPermissionStatus;
	} catch (error) {
		console.error("Error requesting notification permission:", error);
		return "denied";
	}
}

/**
 * Show a medication reminder notification
 */
export interface MedicationNotificationOptions {
	medicationName: string;
	dosage?: string;
	scheduledTime: string;
	medicationId?: string;
	logId?: string;
}

export function showMedicationNotification({
	medicationName,
	dosage,
	scheduledTime,
	medicationId,
}: MedicationNotificationOptions): Notification | null {
	if (!isNotificationSupported() || getNotificationPermission() !== "granted") {
		console.warn("Notifications not available or not permitted");
		return null;
	}

	try {
		const time = new Date(scheduledTime).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});

		const title = "💊 Medication Reminder";
		const body = `Time to take ${medicationName}${
			dosage ? ` (${dosage})` : ""
		}\nScheduled for ${time}`;

		const notification = new Notification(title, {
			body,
			icon: "/icon-192.png", // Make sure to add this icon to public folder
			badge: "/icon-192.png",
			tag: medicationId || "medication-reminder", // Prevents duplicate notifications
			requireInteraction: true, // Keeps notification visible until user interacts
		});

		// Handle notification click - navigate to medication detail or dashboard
		notification.onclick = () => {
			window.focus();
			if (medicationId) {
				window.location.href = `/dashboard/medications/${medicationId}`;
			} else {
				window.location.href = "/dashboard";
			}
			notification.close();
		};

		return notification;
	} catch (error) {
		console.error("Error showing notification:", error);
		return null;
	}
}

/**
 * Check if user should be prompted for notification permission
 * (Don't spam them if they already denied or if we asked recently)
 */
export function shouldPromptForPermission(): boolean {
	if (!isNotificationSupported()) {
		return false;
	}

	const permission = getNotificationPermission();

	// Don't prompt if already granted or explicitly denied
	if (permission === "granted" || permission === "denied") {
		return false;
	}

	// Check if we've asked recently (within last 7 days)
	const lastPromptKey = "notification_permission_last_prompt";
	const lastPrompt = localStorage.getItem(lastPromptKey);

	if (lastPrompt) {
		const daysSincePrompt =
			(Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24);
		if (daysSincePrompt < 7) {
			return false;
		}
	}

	return true;
}

/**
 * Mark that we've prompted the user for permission
 */
export function markPermissionPrompted(): void {
	if (typeof window !== "undefined") {
		localStorage.setItem(
			"notification_permission_last_prompt",
			Date.now().toString()
		);
	}
}

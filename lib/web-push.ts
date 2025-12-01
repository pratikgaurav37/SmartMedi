import webpush from "web-push";

// Initialize web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
	webpush.setVapidDetails(
		"mailto:support@medi.app", // Replace with your email
		vapidPublicKey,
		vapidPrivateKey
	);
} else {
	console.warn(
		"⚠️ VAPID keys not configured - push notifications will not work"
	);
}

export interface PushNotificationPayload {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	tag?: string;
	url?: string;
	medicationId?: string;
	logId?: string;
}

/**
 * Send a push notification to a user
 * @param subscription - The push subscription object from the database
 * @param payload - The notification payload
 * @returns Promise resolving to success status
 */
export async function sendPushNotification(
	subscription: any,
	payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
	if (!vapidPublicKey || !vapidPrivateKey) {
		return {
			success: false,
			error: "VAPID keys not configured",
		};
	}

	try {
		const notificationPayload = JSON.stringify({
			title: payload.title,
			body: payload.body,
			icon: payload.icon || "/icon-192.png",
			badge: payload.badge || "/icon-192.png",
			tag: payload.tag || "medication-reminder",
			requireInteraction: true,
			url: payload.url || "/dashboard",
			medicationId: payload.medicationId,
			logId: payload.logId,
		});

		await webpush.sendNotification(subscription, notificationPayload);

		console.log("✅ Push notification sent successfully");
		return { success: true };
	} catch (error: any) {
		console.error("❌ Error sending push notification:", error);

		// Handle specific errors
		if (error.statusCode === 410 || error.statusCode === 404) {
			// Subscription expired or invalid
			return {
				success: false,
				error: "subscription_expired",
			};
		}

		return {
			success: false,
			error: error.message || "Unknown error",
		};
	}
}

/**
 * Send medication reminder push notification
 */
export async function sendMedicationReminderPush(
	subscription: any,
	medicationName: string,
	dosage: string,
	scheduledTime: string,
	medicationId: string,
	logId: string
): Promise<{ success: boolean; error?: string }> {
	const time = new Date(scheduledTime).toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	});

	return sendPushNotification(subscription, {
		title: "💊 Medication Reminder",
		body: `Time to take ${medicationName}${
			dosage ? ` (${dosage})` : ""
		}\nScheduled for ${time}`,
		tag: `med-${medicationId}-${logId}`,
		url: `/dashboard/medications/${medicationId}`,
		medicationId,
		logId,
	});
}

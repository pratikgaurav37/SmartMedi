import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMedicationReminder } from "@/lib/telegram";
import { sendMedicationReminderPush } from "@/lib/web-push";
import { CloudCog } from "lucide-react";

export async function POST(request: NextRequest) {
	// Verify Cron Secret (Optional but recommended for production)
	const authHeader = request.headers.get("authorization");
	if (
		process.env.CRON_SECRET &&
		authHeader !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Use service role key to bypass RLS
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);
		const now = new Date();
		const currentTime = now.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
		});
		const todayStr = now.toISOString().split("T")[0];

		// 1. Get all medications
		const { data: medications, error: medsError } = await supabase
			.from("medications")
			.select("*");

		if (medsError) throw medsError;

		let processedCount = 0;

		for (const med of medications || []) {
			// Get user profile for this medication
			const { data: profile } = await supabase
				.from("profiles")
				.select(
					"telegram_chat_id, web_notifications_enabled, push_subscription"
				)
				.eq("id", med.user_id)
				.single();

			// Skip if user has no notification channels enabled
			if (!profile?.telegram_chat_id && !profile?.web_notifications_enabled) {
				console.log(
					`Skipping med ${med.id} (${med.name}): No notification channels enabled`
				);
				continue;
			}

			// Check if any of the medication's times match current time (±10 min window)
			const times = Array.isArray(med.times)
				? med.times
				: JSON.parse(med.times as string);
			console.log("Times:", times);
			for (const time of times) {
				// Convert UTC to IST (UTC+5:30)
				const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
				const currentUTCMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
				const currentISTMinutes = currentUTCMinutes + istOffset;

				// Handle day overflow (if IST time goes past midnight)
				const currentISTMinutesNormalized = currentISTMinutes % (24 * 60);
				const currentISTHours = Math.floor(currentISTMinutesNormalized / 60);
				const currentISTMins = currentISTMinutesNormalized % 60;
				const currentTimeStr = `${String(currentISTHours).padStart(
					2,
					"0"
				)}:${String(currentISTMins).padStart(2, "0")}`;

				const [schedHours, schedMinutes] = time.split(":").map(Number);

				// Calculate difference in minutes
				const schedTotalMinutes = schedHours * 60 + schedMinutes;
				const currTotalMinutes = currentISTHours * 60 + currentISTMins;

				// Handle wrap-around midnight cases for window check
				let minutesDiff = Math.abs(schedTotalMinutes - currTotalMinutes);
				if (minutesDiff > 12 * 60) {
					minutesDiff = 24 * 60 - minutesDiff;
				}

				const isWithinWindow = minutesDiff <= 5; // 5 minutes window
				console.log(
					`Checking time: ${time} (IST). Current IST: ${currentTimeStr}. Diff: ${minutesDiff}m`
				);
				if (isWithinWindow) {
					console.log(
						`Match found: Med ${med.name} at ${time} (IST). Current IST: ${currentTimeStr}. Diff: ${minutesDiff}m`
					);

					const logId = `${med.id}_${todayStr}_${time.replace(":", "")}`;

					// Create scheduled date for logging purposes (in UTC)
					// We need to convert the Scheduled IST time back to UTC to store correctly
					const scheduledDate = new Date(now);

					// Calculate target UTC minutes from Scheduled IST minutes
					let targetUTCMinutes = schedHours * 60 + schedMinutes - istOffset;
					// Handle underflow/overflow
					if (targetUTCMinutes < 0) targetUTCMinutes += 24 * 60;
					if (targetUTCMinutes >= 24 * 60) targetUTCMinutes -= 24 * 60;

					const targetUTCHours = Math.floor(targetUTCMinutes / 60);
					const targetUTCMin = targetUTCMinutes % 60;

					scheduledDate.setUTCHours(targetUTCHours, targetUTCMin, 0, 0);

					// Adjust day if we crossed midnight boundary relative to 'now'
					// If scheduledDate is > 12 hours away from now, we probably picked the wrong day
					const timeDiff = scheduledDate.getTime() - now.getTime();
					if (timeDiff > 12 * 60 * 60 * 1000) {
						scheduledDate.setDate(scheduledDate.getDate() - 1);
					} else if (timeDiff < -12 * 60 * 60 * 1000) {
						scheduledDate.setDate(scheduledDate.getDate() + 1);
					}

					// Check if already logged/sent
					const { data: existingLog } = await supabase
						.from("dose_logs")
						.select("*")
						.eq("id", logId)
						.single();

					if (!existingLog) {
						console.log(`Creating log for ${med.name} (${logId})`);
						// Create a pending log entry to prevent duplicate sends
						await supabase.from("dose_logs").insert({
							id: logId,
							user_id: med.user_id,
							medication_id: med.id,
							scheduled_time: scheduledDate.toISOString(),
							status: "pending",
						});

						// Send Telegram notification if available
						if (profile.telegram_chat_id) {
							const success = await sendMedicationReminder({
								chatId: profile.telegram_chat_id,
								medicationName: med.name,
								scheduledTime: scheduledDate.toISOString(),
								dosage: med.dosage,
								medicationId: med.id,
								logId: logId,
							});
							console.log(`Telegram sent result for ${med.name}: ${success}`);
						} else {
							console.log(`No Telegram Chat ID for user ${med.user_id}`);
						}

						// Send web push notification if enabled
						if (
							profile.web_notifications_enabled &&
							profile.push_subscription
						) {
							const pushResult = await sendMedicationReminderPush(
								profile.push_subscription,
								med.name,
								med.dosage,
								scheduledDate.toISOString(),
								med.id,
								logId
							);
							console.log(
								`Push sent result for ${med.name}: ${pushResult.success}`
							);

							// If subscription expired, clean it up
							if (
								!pushResult.success &&
								pushResult.error === "subscription_expired"
							) {
								console.log(
									`🧹 Cleaning up expired push subscription for user ${med.user_id}`
								);
								await supabase
									.from("profiles")
									.update({
										push_subscription: null,
										web_notifications_enabled: false,
									})
									.eq("id", med.user_id);
							}
						}

						processedCount++;
					} else if (
						existingLog.status === "delayed" &&
						existingLog.delayed_until
					) {
						const delayedUntil = new Date(existingLog.delayed_until);
						// Check if delay time has passed
						if (now >= delayedUntil) {
							console.log(`Processing delayed dose ${logId} - Time reached`);

							// Update status back to pending so we don't process it again as "delayed"
							// and so the user sees it as actionable again
							await supabase
								.from("dose_logs")
								.update({
									status: "pending",
									// Keep delayed_until for history if needed, or clear it?
									// Let's keep it but the status change is what prevents loop
								})
								.eq("id", logId);

							// Send Telegram notification
							if (profile.telegram_chat_id) {
								await sendMedicationReminder({
									chatId: profile.telegram_chat_id,
									medicationName: med.name,
									scheduledTime: existingLog.scheduled_time, // Use original scheduled time
									dosage: med.dosage,
									medicationId: med.id,
									logId: logId,
								});
								console.log(`Resent Telegram reminder for delayed ${med.name}`);
							}

							// Send web push
							if (
								profile.web_notifications_enabled &&
								profile.push_subscription
							) {
								await sendMedicationReminderPush(
									profile.push_subscription,
									med.name,
									med.dosage,
									existingLog.scheduled_time,
									med.id,
									logId
								);
							}
							processedCount++;
						}
					}
				}
			}
		}

		return NextResponse.json({ success: true, processed: processedCount });
	} catch (error) {
		console.error("Cron error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

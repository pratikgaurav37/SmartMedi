import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMedicationReminder } from "@/lib/telegram";

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
				.select("telegram_chat_id")
				.eq("id", med.user_id)
				.single();

			// Skip if no Telegram connection
			if (!profile?.telegram_chat_id) continue;

			// Check if any of the medication's times match current time (±5 min window)
			// Note: This logic assumes 'times' is an array of strings like ["08:00", "20:00"]
			const times = Array.isArray(med.times)
				? med.times
				: JSON.parse(med.times as string);
		//	console.log("Times:", times);
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
				const minutesDiff = Math.abs(schedTotalMinutes - currTotalMinutes);

				const isWithinWindow = minutesDiff <= 10; // 10 minutes window
			//	console.log(
			//		`Current IST time: ${currentTimeStr}, Scheduled: ${time}, Diff: ${minutesDiff} mins, Within window: ${isWithinWindow}`
			//	);
				if (isWithinWindow) {
					const logId = `${med.id}_${todayStr}_${time.replace(":", "")}`;

					// Create scheduled date for logging purposes (in UTC)
					const scheduledDate = new Date();
					scheduledDate.setUTCHours(schedHours, schedMinutes, 0, 0);

					// Check if already logged/sent
					const { data: existingLog } = await supabase
						.from("dose_logs")
						.select("id")
						.eq("id", logId)
						.single();
					console.log("Existing log:", existingLog);
					if (!existingLog) {
						// Create a pending log entry to prevent duplicate sends
						// We'll update this status when they interact with the buttons
						await supabase.from("dose_logs").insert({
							id: logId,
							user_id: med.user_id,
							medication_id: med.id,
							scheduled_time: scheduledDate.toISOString(),
							status: "pending",
						});

						// Send Telegram notification
						await sendMedicationReminder({
							chatId: profile.telegram_chat_id,
							medicationName: med.name,
							scheduledTime: scheduledDate.toISOString(),
							dosage: med.dosage,
							medicationId: med.id,
							logId: logId,
						});
						processedCount++;
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

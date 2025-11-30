import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMedicationReminder } from "@/lib/telegram";

export async function GET(request: NextRequest) {
	// Verify Cron Secret (Optional but recommended for production)
	const authHeader = request.headers.get("authorization");
	if (
		process.env.CRON_SECRET &&
		authHeader !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const supabase = await createClient();
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
			.select(
				`
        *,
        user:profiles!user_id(
          telegram_chat_id,
          telegram_first_name
        )
      `
			)
			.not("user.telegram_chat_id", "is", null);

		if (medsError) throw medsError;

		let processedCount = 0;

		for (const med of medications || []) {
			// Check if any of the medication's times match current time (±5 min window)
			// Note: This logic assumes 'times' is an array of strings like ["08:00", "20:00"]
			const times = Array.isArray(med.times)
				? med.times
				: JSON.parse(med.times as string);

			for (const time of times) {
				const [hours, minutes] = time.split(":").map(Number);
				const scheduledDate = new Date();
				scheduledDate.setHours(hours, minutes, 0, 0);

				const timeDiff = Math.abs(now.getTime() - scheduledDate.getTime());
				const isWithinWindow = timeDiff <= 5 * 60 * 1000; // 5 minutes

				if (isWithinWindow) {
					const logId = `${med.id}_${todayStr}_${time.replace(":", "")}`;

					// Check if already logged/sent
					const { data: existingLog } = await supabase
						.from("dose_logs")
						.select("id")
						.eq("id", logId)
						.single();

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
						if (med.user?.telegram_chat_id) {
							await sendMedicationReminder({
								chatId: med.user.telegram_chat_id,
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

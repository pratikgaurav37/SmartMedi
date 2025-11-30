import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { bot } from "@/lib/telegram";

export async function POST(request: NextRequest) {
	try {
		const update = await request.json();

		if (!bot) {
			console.error("Telegram bot not initialized");
			return NextResponse.json(
				{ error: "Bot not initialized" },
				{ status: 500 }
			);
		}

		// Check for callback queries (button clicks)
		if (update.callback_query) {
			const callbackQuery = update.callback_query;
			const chatId = callbackQuery.message.chat.id;
			const messageId = callbackQuery.message.message_id;
			const data = callbackQuery.data; // Format: ACTION:LOG_ID

			if (data) {
				const [action, logId] = data.split(":");
				const supabase = createClient(
					process.env.NEXT_PUBLIC_SUPABASE_URL!,
					process.env.SUPABASE_SERVICE_ROLE_KEY!
				);
				const now = new Date().toISOString();

				let replyText = "";
				let shouldUpdateDB = true;

				if (action === "TAKE") {
					// Update log as taken
					const { error } = await supabase
						.from("dose_logs")
						.update({
							status: "taken",
							actual_time: now,
						})
						.eq("id", logId);

					if (!error) replyText = "✅ Medication taken";
					else shouldUpdateDB = false;
				} else if (action === "SKIP") {
					// Update log as skipped
					const { error } = await supabase
						.from("dose_logs")
						.update({
							status: "skipped",
						})
						.eq("id", logId);

					if (!error) replyText = "❌ Medication skipped";
					else shouldUpdateDB = false;
				} else if (action === "SNOOZE") {
					// For snooze, we might want to update a 'delayed_until' field or just acknowledge
					// For now, let's just acknowledge and maybe the user will get another reminder if the cron logic handles it
					// Or we can update the status to 'delayed'
					const { error } = await supabase
						.from("dose_logs")
						.update({
							status: "delayed",
							delayed_until: new Date(Date.now() + 5 * 60000).toISOString(), // 5 mins later
						})
						.eq("id", logId);

					if (!error) replyText = "💤 Snoozed for 5 minutes";
					else shouldUpdateDB = false;
				}

				if (shouldUpdateDB) {
					// Answer callback query to stop loading animation
					await bot.answerCallbackQuery(callbackQuery.id, { text: replyText });

					// Edit message to remove buttons and show status
					await bot.editMessageText(
						`${callbackQuery.message.text}\n\n${replyText}`,
						{
							chat_id: chatId,
							message_id: messageId,
							parse_mode: "Markdown",
						}
					);
				} else {
					await bot.answerCallbackQuery(callbackQuery.id, {
						text: "Failed to update status",
					});
				}
			}
			return NextResponse.json({ success: true });
		}

		// Check for message and text
		if (update.message && update.message.text) {
			const text = update.message.text;
			const chatId = update.message.chat.id;
			const telegramUser = update.message.from;

			// Check for /start command with token
			if (text.startsWith("/start ")) {
				const token = text.split(" ")[1];
				if (token) {
					const supabase = createClient(
						process.env.NEXT_PUBLIC_SUPABASE_URL!,
						process.env.SUPABASE_SERVICE_ROLE_KEY!
					);

					// Verify token
					const { data: tokenData, error: tokenError } = await supabase
						.from("telegram_verification_tokens")
						.select("*")
						.eq("token", token)
						.single();

					if (tokenError || !tokenData) {
						await bot.sendMessage(
							chatId,
							"❌ Invalid or expired connection link. Please try again from the app."
						);
						return NextResponse.json({ success: true });
					}

					// Check expiry
					if (new Date(tokenData.expires_at) < new Date()) {
						await bot.sendMessage(
							chatId,
							"❌ This connection link has expired. Please try again from the app."
						);
						return NextResponse.json({ success: true });
					}

					// Update user profile
					const { error: updateError } = await supabase
						.from("profiles")
						.update({
							telegram_chat_id: chatId.toString(),
						})
						.eq("id", tokenData.user_id);

					if (updateError) {
						console.error("Failed to update profile:", updateError);
						await bot.sendMessage(
							chatId,
							"❌ Failed to connect account. Please try again."
						);
					} else {
						// Delete used token
						await supabase
							.from("telegram_verification_tokens")
							.delete()
							.eq("token", token);

						await bot.sendMessage(
							chatId,
							"✅ *Successfully connected!* \n\nYou will now receive medication reminders in this chat.",
							{ parse_mode: "Markdown" }
						);
					}
				}
			}
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Telegram webhook error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

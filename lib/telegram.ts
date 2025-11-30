import TelegramBot from "node-telegram-bot-api";

const botToken = process.env.TELEGRAM_BOT_TOKEN;

let bot: TelegramBot | null = null;

// Initialize bot only on server side
if (botToken && typeof window === "undefined") {
	bot = new TelegramBot(botToken, { polling: false });
}

export { bot };

export interface TelegramNotification {
	chatId: string;
	medicationName: string;
	scheduledTime: string;
	dosage?: string;
	medicationId?: string;
	logId?: string;
}

export async function sendMedicationReminder({
	chatId,
	medicationName,
	scheduledTime,
	dosage,
	medicationId,
	logId,
}: TelegramNotification): Promise<boolean> {
	if (!bot) {
		console.error("Telegram bot not initialized - check TELEGRAM_BOT_TOKEN");
		return false;
	}

	try {
		const time = new Date(scheduledTime).toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});

		const message = `
🔔 *Medication Reminder*

💊 *${medicationName}*
${dosage ? `📋 Dosage: ${dosage}` : ""}
⏰ Scheduled for: ${time}

Please take your medication now!
    `.trim();

		const options: any = {
			parse_mode: "Markdown",
		};

		if (medicationId && logId) {
			options.reply_markup = {
				inline_keyboard: [
					[
						{ text: "✅ Take", callback_data: `TAKE:${logId}` },
						{ text: "❌ Skip", callback_data: `SKIP:${logId}` },
					],
					[{ text: "💤 Snooze 5m", callback_data: `SNOOZE:${logId}` }],
				],
			};
		}

		await bot.sendMessage(chatId, message, options);

		console.log(`✅ Telegram reminder sent to ${chatId} for ${medicationName}`);
		return true;
	} catch (error) {
		console.error("❌ Failed to send Telegram message:", error);
		return false;
	}
}

export async function sendTestMessage(
	chatId: string
): Promise<{ success: boolean; error?: string }> {
	if (!bot) {
		const error = "Telegram bot not initialized - check TELEGRAM_BOT_TOKEN";
		console.error(error);
		return { success: false, error };
	}

	try {
		await bot.sendMessage(
			chatId,
			"✅ *Test successful!*\\n\\nYour Telegram notifications are working correctly. You will receive medication reminders here.",
			{ parse_mode: "Markdown" }
		);
		console.log(`✅ Test message sent to ${chatId}`);
		return { success: true };
	} catch (error: any) {
		console.error("❌ Failed to send test message:", error);

		// Provide specific error messages based on Telegram API errors
		let errorMessage = "Failed to send test message.";

		if (error.response?.body?.description) {
			const description = error.response.body.description;

			if (description.includes("chat not found")) {
				errorMessage =
					"Chat not found. Please start a conversation with the bot by sending /start on Telegram first.";
			} else if (description.includes("bot was blocked")) {
				errorMessage =
					"You have blocked this bot. Please unblock it on Telegram and try again.";
			} else if (description.includes("user is deactivated")) {
				errorMessage = "This Telegram account is deactivated.";
			} else if (description.includes("Unauthorized")) {
				errorMessage =
					"Bot token is invalid. Please check your TELEGRAM_BOT_TOKEN configuration.";
			} else {
				errorMessage = `Telegram API error: ${description}`;
			}
		}

		return { success: false, error: errorMessage };
	}
}

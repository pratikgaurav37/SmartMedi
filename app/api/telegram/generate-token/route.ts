import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Generate a random token
		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

		// Store token in database
		const { error: dbError } = await supabase
			.from("telegram_verification_tokens")
			.insert({
				token,
				user_id: user.id,
				expires_at: expiresAt.toISOString(),
			});

		if (dbError) {
			console.error("Failed to create token:", dbError);
			return NextResponse.json(
				{ error: "Failed to generate connection token" },
				{ status: 500 }
			);
		}

		const botUsername =
			process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "YourBotName";

		return NextResponse.json({
			success: true,
			token,
			botUsername,
		});
	} catch (error) {
		console.error("Token generation error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

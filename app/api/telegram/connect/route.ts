import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST handler removed as we now use Deep Link connection flow via /api/telegram/generate-token and /api/telegram/webhook

// Disconnect endpoint
export async function DELETE(request: NextRequest) {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Clear Telegram data from profile
		const { error: updateError } = await supabase
			.from("profiles")
			.update({
				telegram_chat_id: null,
			})
			.eq("id", user.id);

		if (updateError) {
			console.error("Failed to disconnect Telegram:", updateError);
			return NextResponse.json(
				{ error: "Failed to disconnect Telegram" },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Telegram disconnect error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

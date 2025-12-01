import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient();

		// Get current user
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Remove subscription from database
		const { error: updateError } = await supabase
			.from("profiles")
			.update({
				push_subscription: null,
				web_notifications_enabled: false,
			})
			.eq("id", user.id);

		if (updateError) {
			console.error("Error removing push subscription:", updateError);
			return NextResponse.json(
				{ error: "Failed to remove subscription" },
				{ status: 500 }
			);
		}

		console.log(`✅ Push subscription removed for user ${user.id}`);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error in unsubscribe endpoint:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

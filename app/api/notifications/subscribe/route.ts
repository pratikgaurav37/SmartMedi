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

		// Get subscription data from request
		const { subscription } = await request.json();

		if (!subscription) {
			return NextResponse.json(
				{ error: "Subscription data required" },
				{ status: 400 }
			);
		}

		// Save subscription to database
		const { error: updateError } = await supabase
			.from("profiles")
			.update({
				push_subscription: subscription,
				web_notifications_enabled: true,
			})
			.eq("id", user.id);

		if (updateError) {
			console.error("Error saving push subscription:", updateError);
			return NextResponse.json(
				{ error: "Failed to save subscription" },
				{ status: 500 }
			);
		}

		console.log(`✅ Push subscription saved for user ${user.id}`);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error in subscribe endpoint:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

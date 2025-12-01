import { createClient } from "@/lib/supabase/server";
import { createDoseLog } from "@/lib/dose-logs";
import { NextRequest, NextResponse } from "next/server";

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

		const body = await request.json();
		// Ensure userId is set in the log object
		const logWithUserId = { ...body, userId: user.id };
		const { data, error } = await createDoseLog(user.id, logWithUserId);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ data });
	} catch (error) {
		console.error("Error creating dose log:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

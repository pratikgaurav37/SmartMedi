import { createClient } from "@/lib/supabase/server";
import { getDoseLogs } from "@/lib/dose-logs";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { data: doseLogs, error } = await getDoseLogs(user.id);

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({ doseLogs });
	} catch (error) {
		console.error("Error fetching dose logs:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMedications } from "@/lib/medications";
import { getDoseLogs } from "@/lib/dose-logs";
import AnalyticsClient from "./analytics-client";

export default async function Analytics() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		redirect("/auth/login");
	}

	// Fetch medications and logs from Supabase
	const { data: medications } = await getMedications(user.id);
	const { data: doseLogs } = await getDoseLogs(user.id);

	return <AnalyticsClient medications={medications} doseLogs={doseLogs} />;
}

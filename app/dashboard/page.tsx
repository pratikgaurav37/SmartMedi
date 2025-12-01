import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMedications } from "@/lib/medications";
import { getDoseLogs } from "@/lib/dose-logs";
import DashboardClient from "./dashboard-client";

function getGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return "Good Morning";
	if (hour < 18) return "Good Afternoon";
	return "Good Evening";
}

export default async function Dashboard() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		redirect("/auth/login");
	}

	// Fetch medications from Supabase
	const { data: medications } = await getMedications(user.id);

	// Fetch profile from Supabase
	const { data: profileData } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.single();

	// Fetch dose logs for the last 7 days
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
	const { data: doseLogs } = await getDoseLogs(user.id, {
		startDate: sevenDaysAgo.toISOString(),
	});

	// Check for low stock medications
	const lowStockMeds = medications.filter(
		(med) =>
			med.currentSupply !== undefined &&
			med.lowStockThreshold !== undefined &&
			med.currentSupply <= med.lowStockThreshold
	);

	// Extract only serializable user data
	const userData = {
		id: user.id,
		email: user.email,
	};

	const greeting = getGreeting();

	return (
		<DashboardClient
			user={userData}
			profile={profileData}
			medications={medications}
			lowStockMeds={lowStockMeds}
			doseLogs={doseLogs}
			greeting={greeting}
		/>
	);
}

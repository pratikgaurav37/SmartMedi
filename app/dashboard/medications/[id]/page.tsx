import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMedications } from "@/lib/medications";
import { getDoseLogs } from "@/lib/dose-logs";	
import MedicationDetailClient from "./medication-detail-client";

interface PageProps {
	params: {
		id: string;
	};
}

export default async function MedicationDetailPage({ params }: PageProps) {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		redirect("/auth/login");
	}

	// Await params in Next.js 15+
	const { id } = await params;

	// Fetch all medications
	const { data: medications } = await getMedications(user.id);

	// Find the specific medication
	const medication = medications.find((m) => m.id === id);

	if (!medication) {
		redirect("/dashboard");
	}

	// Fetch dose logs for this medication
	const { data: allLogs } = await getDoseLogs(user.id, {
		medicationId: id,
	});

	return (
		<MedicationDetailClient
			medication={medication}
			doseLogs={allLogs}
			userId={user.id}
		/>
	);
}

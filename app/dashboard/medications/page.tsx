import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MedicationsClient } from "./medications-client";
import { Medication } from "@/lib/storage";

export default async function MedicationsPage() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	// Fetch all medications for the user
	const { data: medications, error } = await supabase
		.from("medications")
		.select("*")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false });

	if (error) {
		console.error("Error fetching medications:", error);
	}

	// Map database medications to our Medication type
	const mappedMedications: Medication[] = (medications || []).map((med) => ({
		id: med.id,
		name: med.name,
		dosage: med.dosage,
		type: med.type,
		frequency: med.frequency,
		times: med.times,
		startDate: med.start_date,
		endDate: med.end_date,
		tracking: med.tracking,
		notes: med.notes,
		currentSupply: med.current_supply,
		supplyUnit: med.supply_unit,
		lowStockThreshold: med.low_stock_threshold,
	}));

	return <MedicationsClient medications={mappedMedications} userId={user.id} />;
}

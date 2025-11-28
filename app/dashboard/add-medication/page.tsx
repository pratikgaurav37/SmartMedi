import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddMedicationClient from "./add-medication-client";

export default async function AddMedication() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		redirect("/auth/login");
	}

	return <AddMedicationClient userId={user.id} />;
}

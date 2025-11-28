"use server";

import { createMedication } from "@/lib/medications";
import { Medication } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveMedicationAction(medication: Omit<Medication, "id">) {
	const supabase = await createClient();

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return { success: false, error: "Not authenticated" };
	}

	const { data, error } = await createMedication(user.id, medication);

	if (error) {
		return { success: false, error: error.message };
	}

	revalidatePath("/dashboard");
	return { success: true, data };
}

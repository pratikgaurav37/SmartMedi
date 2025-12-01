"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfile } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export async function updateProfile(profile: Partial<UserProfile>) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("User not authenticated");
	}

	const profileData = {
		id: user.id,
		full_name: profile.name,
		phone: profile.phone,
		dob: profile.dob || null,
		gender: profile.gender,
		weight: profile.weight || null,
		conditions: profile.conditions,
		allergies: profile.allergies,
		doctor_name: profile.doctorName,
		emergency_contact: profile.emergencyContact,
		telegram_chat_id: profile.telegramChatId,
		preferences: profile.preferences,
		updated_at: new Date().toISOString(),
	};

	// Remove undefined keys
	Object.keys(profileData).forEach((key) => {
		if (profileData[key as keyof typeof profileData] === undefined) {
			delete profileData[key as keyof typeof profileData];
		}
	});

	const { error } = await supabase.from("profiles").upsert(profileData);

	if (error) {
		console.error("Error updating profile:", JSON.stringify(error, null, 2));
		throw new Error(`Failed to update profile: ${error.message}`);
	}

	revalidatePath("/dashboard");
	revalidatePath("/dashboard/settings");
}

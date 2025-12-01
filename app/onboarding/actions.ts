"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfile, ActionResult } from "@/lib/storage";

/**
 * Validates user profile data
 */
function validateProfile(profile: UserProfile): ActionResult {
	// Required fields validation
	if (!profile.name?.trim()) {
		return { success: false, error: "Name is required", field: "name" };
	}

	if (!profile.phone?.trim()) {
		return {
			success: false,
			error: "Phone number is required",
			field: "phone",
		};
	}

	// Phone number format validation (basic)
	const phoneRegex = /^[+]?[\d\s()-]+$/;
	if (!phoneRegex.test(profile.phone)) {
		return {
			success: false,
			error: "Invalid phone number format",
			field: "phone",
		};
	}

	// Weight validation (optional but must be positive if provided)
	if (profile.weight !== undefined && profile.weight !== null) {
		if (profile.weight <= 0) {
			return {
				success: false,
				error: "Weight must be a positive number",
				field: "weight",
			};
		}
		if (profile.weight > 500) {
			return {
				success: false,
				error: "Please enter a valid weight",
				field: "weight",
			};
		}
	}

	return { success: true };
}

/**
 * Saves user profile to the database
 * @returns Typed result indicating success or failure
 */
export async function saveUserProfile(
	profile: UserProfile
): Promise<ActionResult> {
	try {
		// Validate input
		const validationResult = validateProfile(profile);
		if (!validationResult.success) {
			return validationResult;
		}

		const supabase = await createClient();

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return {
				success: false,
				error: "You must be logged in to save your profile",
			};
		}

		const profileData = {
			id: user.id,
			full_name: profile.name.trim(),
			phone: profile.phone.trim(),
			dob: profile.dob || null,
			gender: profile.gender,
			weight: profile.weight || null,
			conditions: profile.conditions,
			allergies: profile.allergies?.trim() || null,
			doctor_name: profile.doctorName?.trim() || null,
			emergency_contact: profile.emergencyContact?.trim() || null,
			telegram_chat_id: profile.telegramChatId || null,
			web_notifications_enabled: profile.webNotificationsEnabled || false,
			notification_permission_requested_at:
				profile.notificationPermissionRequestedAt || null,
			push_subscription: profile.pushSubscription || null,
			preferences: profile.preferences,
			updated_at: new Date().toISOString(),
		};

		const { error } = await supabase.from("profiles").upsert(profileData);

		if (error) {
			console.error("Error saving profile:", JSON.stringify(error, null, 2));

			// Return user-friendly error messages
			if (error.code === "23505") {
				// Unique constraint violation
				return { success: false, error: "This profile already exists" };
			}

			return {
				success: false,
				error: "Failed to save profile. Please try again.",
			};
		}

		return { success: true };
	} catch (error) {
		console.error("Unexpected error saving profile:", error);
		return {
			success: false,
			error: "An unexpected error occurred. Please try again.",
		};
	}
}

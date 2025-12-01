import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { UserProfile } from "@/lib/storage";

export default async function Settings() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		redirect("/auth/login");
	}

	const { data: profile } = await supabase
		.from("profiles")
		.select("*")
		.eq("id", user.id)
		.single();

	// Map DB profile to UserProfile interface if needed, or ensure types match
	// Assuming DB columns match UserProfile keys for now based on actions.ts
	const userProfile: UserProfile = {
		id: user.id,
		name: profile?.full_name || "",
		phone: profile?.phone || "",
		dob: profile?.dob || "",
		gender: profile?.gender || "other",
		weight: profile?.weight || undefined,
		conditions: profile?.conditions || [],
		allergies: profile?.allergies || "",
		doctorName: profile?.doctor_name || "",
		emergencyContact: profile?.emergency_contact || "",
		telegramChatId: profile?.telegram_chat_id || "",
		preferences: profile?.preferences || {
			reminderTone: "Normal",
			language: "English",
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
	};

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col">
			<div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
				<Link href="/dashboard">
					<Button variant="ghost" size="icon" className="-ml-2">
						<ChevronLeft className="w-6 h-6 text-slate-600" />
					</Button>
				</Link>
				<h1 className="text-lg font-bold text-slate-900 ml-2">Settings</h1>
			</div>

			<main className="p-6 max-w-2xl mx-auto w-full">
				<div className="bg-white rounded-xl shadow-sm p-6">
					<SettingsForm initialProfile={userProfile} />
				</div>

				<div className="pt-8 text-center">
					<p className="text-xs text-slate-400">Version 1.0.0</p>
				</div>
			</main>
		</div>
	);
}

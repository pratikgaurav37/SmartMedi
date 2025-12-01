"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Plus, Send, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveUserProfile } from "./actions";
// import { saveProfile, UserProfile } from "@/lib/storage"; // Removed local storage save
import { UserProfile } from "@/lib/storage";
import { TelegramConnect } from "@/components/telegram-connect";
import { TelegramConnectDev } from "@/components/telegram-connect-dev";
import { NotificationPermissionCard } from "@/components/notification-permission-card";

// Use dev component for local development, prod component for production
const isDev = process.env.NODE_ENV === "development";
const TelegramWidget = isDev ? TelegramConnectDev : TelegramConnect;

const Onboarding = () => {
	const router = useRouter();
	const [step, setStep] = useState(1);
	const [userId, setUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [formData, setFormData] = useState<UserProfile>({
		id: "",
		name: "",
		phone: "",
		dob: "",
		gender: "other",
		weight: "",
		conditions: [],
		allergies: "",
		doctorName: "",
		emergencyContact: "",
		preferences: {
			reminderTone: "Normal",
			language: "English",
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
	});

	const [conditionInput, setConditionInput] = useState("");

	useEffect(() => {
		const getUser = async () => {
			const supabase = createClient();
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setUserId(user.id);
				setFormData((prev) => ({ ...prev, id: user.id }));
			} else {
				// Handle not logged in case if needed, though middleware might catch it
				router.push("/auth/login");
			}
			setLoading(false);
		};
		getUser();
	}, [router]);

	const handleSubmit = async () => {
		if (!userId) return;
		setIsSubmitting(true);
		try {
			await saveUserProfile(formData);
			// Redirect is handled in server action
		} catch (error) {
			console.error("Failed to save profile:", error);
			alert("Failed to save profile. Please try again.");
			setIsSubmitting(false);
		}
	};

	if (loading)
		return (
			<div className="min-h-screen flex items-center justify-center">
				Loading...
			</div>
		);

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col font-sans">
			{/* Header */}
			<div className="bg-white p-6 shadow-sm sticky top-0 z-10">
				<h2 className="text-xl font-bold text-center text-slate-800">
					Setup Profile
				</h2>
				<div className="flex justify-center mt-4 space-x-2">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className={`h-1.5 rounded-full transition-all duration-300 ${
								step >= i ? "w-8 bg-blue-600" : "w-2 bg-slate-200"
							}`}
						/>
					))}
				</div>
			</div>

			<div className="flex-1 p-6 max-w-md w-full mx-auto flex flex-col">
				{/* Step 1: Basic Info */}
				{step === 1 && (
					<div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
						<h3 className="text-lg font-semibold text-slate-900">
							Basic Information
						</h3>

						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-slate-700">
								Full Name
							</label>
							<Input
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="John Doe"
								className="bg-white"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-slate-700">
								Phone Number
							</label>
							<Input
								value={formData.phone}
								onChange={(e) =>
									setFormData({ ...formData, phone: e.target.value })
								}
								placeholder="+1 234 567 890"
								className="bg-white"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="block text-sm font-medium text-slate-700">
									Date of Birth
								</label>
								<Input
									type="date"
									value={formData.dob}
									onChange={(e) =>
										setFormData({ ...formData, dob: e.target.value })
									}
									className="bg-white"
								/>
							</div>
							<div className="space-y-1.5">
								<label className="block text-sm font-medium text-slate-700">
									Weight (kg)
								</label>
								<Input
									type="number"
									value={formData.weight}
									onChange={(e) =>
										setFormData({ ...formData, weight: e.target.value })
									}
									placeholder="70"
									className="bg-white"
								/>
							</div>
						</div>

						<Select
							label="Gender"
							value={formData.gender}
							onChange={(e) =>
								setFormData({ ...formData, gender: e.target.value })
							}
							className="bg-white"
						>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="other">Other</option>
							<option value="prefer_not_to_say">Prefer not to say</option>
						</Select>
					</div>
				)}

				{/* Step 2: Health Context */}
				{step === 2 && (
					<div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
						<h3 className="text-lg font-semibold text-slate-900">
							Health Context
						</h3>

						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-slate-700">
								Medical Conditions
							</label>
							<div className="flex space-x-2 mb-2">
								<Input
									className="flex-1 bg-white"
									placeholder="Diabetes, Asthma..."
									value={conditionInput}
									onChange={(e) => setConditionInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && conditionInput.trim()) {
											e.preventDefault();
											setFormData({
												...formData,
												conditions: [
													...formData.conditions,
													conditionInput.trim(),
												],
											});
											setConditionInput("");
										}
									}}
								/>
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										if (conditionInput.trim()) {
											setFormData({
												...formData,
												conditions: [
													...formData.conditions,
													conditionInput.trim(),
												],
											});
											setConditionInput("");
										}
									}}
								>
									<Plus className="w-5 h-5" />
								</Button>
							</div>
							<div className="flex flex-wrap gap-2 min-h-[2rem]">
								{formData.conditions.map((c, i) => (
									<span
										key={i}
										className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center animate-in zoom-in duration-200"
									>
										{c}
										<button
											onClick={() =>
												setFormData({
													...formData,
													conditions: formData.conditions.filter(
														(_, idx) => idx !== i
													),
												})
											}
											className="ml-2 hover:text-blue-900"
										>
											<X className="w-3 h-3" />
										</button>
									</span>
								))}
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-slate-700">
								Allergies
							</label>
							<Input
								placeholder="Peanuts, Penicillin..."
								value={formData.allergies}
								onChange={(e) =>
									setFormData({ ...formData, allergies: e.target.value })
								}
								className="bg-white"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-slate-700">
								Doctor Name (Optional)
							</label>
							<Input
								placeholder="Dr. Smith"
								value={formData.doctorName}
								onChange={(e) =>
									setFormData({ ...formData, doctorName: e.target.value })
								}
								className="bg-white"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-slate-700">
								Emergency Contact
							</label>
							<Input
								placeholder="Jane Doe: +1..."
								value={formData.emergencyContact}
								onChange={(e) =>
									setFormData({ ...formData, emergencyContact: e.target.value })
								}
								className="bg-white"
							/>
						</div>
					</div>
				)}

				{/* Step 3: Preferences & Connect */}
				{step === 3 && (
					<div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
						<h3 className="text-lg font-semibold text-slate-900">
							Preferences
						</h3>

						<Select
							label="Reminder Tone"
							value={formData.preferences.reminderTone}
							onChange={(e) =>
								setFormData({
									...formData,
									preferences: {
										...formData.preferences,
										reminderTone: e.target.value,
									},
								})
							}
							className="bg-white"
						>
							<option value="Normal">Normal</option>
							<option value="Urgent">Urgent</option>
							<option value="Repeat">Repeat reminders</option>
						</Select>

						<Select
							label="Preferred Language"
							value={formData.preferences.language}
							onChange={(e) =>
								setFormData({
									...formData,
									preferences: {
										...formData.preferences,
										language: e.target.value,
									},
								})
							}
							className="bg-white"
						>
							<option value="English">English</option>
							<option value="Spanish">Spanish</option>
							<option value="French">French</option>
						</Select>

						<div className="pt-6 border-t border-slate-100">
							<label className="block text-sm font-medium text-slate-700 mb-3">
								Connect Telegram (Optional)
							</label>
							<p className="text-xs text-slate-500 mb-4">
								Connect your Telegram account to receive medication reminders
								directly in Telegram.
							</p>
							<TelegramWidget
								botUsername={
									process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || ""
								}
								isConnected={!!formData.telegramChatId}
								connectedUser={
									formData.telegramChatId
										? {
												firstName: "Telegram User",
										  }
										: undefined
								}
								onAuth={(data) => {
									setFormData((prev) => ({
										...prev,
										telegramChatId: data.chatId,
									}));
								}}
								onDisconnect={() => {
									setFormData((prev) => ({
										...prev,
										telegramChatId: undefined,
									}));
								}}
								onError={(error) => {
									console.error("Telegram connection error:", error);
								}}
							/>
						</div>

						<div className="pt-6 border-t border-slate-100">
							<label className="block text-sm font-medium text-slate-700 mb-3">
								Browser Notifications (Optional)
							</label>
							<p className="text-xs text-slate-500 mb-4">
								Enable browser notifications to receive reminders even when the
								app is closed.
							</p>
							<NotificationPermissionCard
								compact={false}
								autoHideOnGranted={false}
							/>
						</div>
					</div>
				)}

				{/* Navigation Buttons */}
				<div className="mt-8 pt-6 border-t border-slate-100 flex space-x-4">
					{step > 1 && (
						<Button
							variant="secondary"
							className="flex-1"
							onClick={() => setStep(step - 1)}
						>
							Back
						</Button>
					)}
					<Button
						className="flex-1 shadow-lg shadow-blue-100"
						onClick={() => (step < 3 ? setStep(step + 1) : handleSubmit())}
						disabled={
							(step === 1 && (!formData.name || !formData.phone)) ||
							isSubmitting
						}
					>
						{step < 3 ? (
							<>
								Next Step <ChevronRight className="w-4 h-4 ml-1" />
							</>
						) : isSubmitting ? (
							"Saving..."
						) : (
							"Complete Setup"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Onboarding;

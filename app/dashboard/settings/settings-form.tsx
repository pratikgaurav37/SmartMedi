"use client";

import { useState } from "react";
import { UserProfile } from "@/lib/storage";
import { updateProfile } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { Plus, X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TelegramConnect } from "@/components/telegram-connect";
import { TelegramConnectDev } from "@/components/telegram-connect-dev";

// Use dev component for local development, prod component for production
const isDev = process.env.NODE_ENV === "development";
const TelegramWidget = false ? TelegramConnectDev : TelegramConnect;

interface SettingsFormProps {
	initialProfile: UserProfile;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
	const [formData, setFormData] = useState<UserProfile>(initialProfile);
	const [isSaving, setIsSaving] = useState(false);
	const [conditionInput, setConditionInput] = useState("");
	const [isTesting, setIsTesting] = useState(false);
	const { toast } = useToast();

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateProfile(formData);
			toast.success("Settings saved", {
				description: "Your profile has been updated successfully.",
			});
		} catch (error) {
			console.error("Failed to save settings:", error);
			toast.error("Error", {
				description: "Failed to save settings. Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleTestTelegram = async () => {
		if (!formData.telegramChatId) {
			toast.error("Please connect your Telegram account first");
			return;
		}

		setIsTesting(true);
		try {
			const response = await fetch("/api/telegram/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ chatId: formData.telegramChatId }),
			});

			if (response.ok) {
				toast.success("Test message sent!", {
					description: "Check your Telegram for the test message.",
				});
			} else {
				const data = await response.json();
				toast.error("Failed to send test message", {
					description:
						data.error || "Please check your connection and try again.",
				});
			}
		} catch (error) {
			toast.error("Error", {
				description: "Failed to send test message.",
			});
		} finally {
			setIsTesting(false);
		}
	};

	return (
		<div className="space-y-8">
			{/* Profile Section */}
			<section className="space-y-4">
				<h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
					Profile Information
				</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-700">
							Full Name
						</label>
						<Input
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="John Doe"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-700">
							Phone Number
						</label>
						<Input
							value={formData.phone}
							onChange={(e) =>
								setFormData({ ...formData, phone: e.target.value })
							}
							placeholder="+1 234 567 890"
						/>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-700">
							Date of Birth
						</label>
						<Input
							type="date"
							value={formData.dob}
							onChange={(e) =>
								setFormData({ ...formData, dob: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Select
							label="Gender"
							value={formData.gender}
							onChange={(e) =>
								setFormData({ ...formData, gender: e.target.value })
							}
						>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="other">Other</option>
							<option value="prefer_not_to_say">Prefer not to say</option>
						</Select>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-700">
							Weight (kg)
						</label>
						<Input
							type="number"
							value={formData.weight || ""}
							onChange={(e) =>
								setFormData({ ...formData, weight: e.target.value })
							}
							placeholder="70"
						/>
					</div>
				</div>
			</section>

			{/* Health Section */}
			<section className="space-y-4">
				<h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
					Health Context
				</h3>
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-700">
							Medical Conditions
						</label>
						<div className="flex gap-2">
							<Input
								value={conditionInput}
								onChange={(e) => setConditionInput(e.target.value)}
								placeholder="Add condition..."
								onKeyDown={(e) => {
									if (e.key === "Enter" && conditionInput.trim()) {
										e.preventDefault();
										setFormData({
											...formData,
											conditions: [
												...(formData.conditions || []),
												conditionInput.trim(),
											],
										});
										setConditionInput("");
									}
								}}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									if (conditionInput.trim()) {
										setFormData({
											...formData,
											conditions: [
												...(formData.conditions || []),
												conditionInput.trim(),
											],
										});
										setConditionInput("");
									}
								}}
							>
								<Plus className="w-4 h-4" />
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{formData.conditions?.map((condition, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
								>
									{condition}
									<button
										onClick={() =>
											setFormData({
												...formData,
												conditions: formData.conditions.filter(
													(_, i) => i !== index
												),
											})
										}
										className="hover:text-blue-900"
									>
										<X className="w-3 h-3" />
									</button>
								</span>
							))}
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								Allergies
							</label>
							<Input
								value={formData.allergies || ""}
								onChange={(e) =>
									setFormData({ ...formData, allergies: e.target.value })
								}
								placeholder="Peanuts, Penicillin..."
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								Doctor Name
							</label>
							<Input
								value={formData.doctorName || ""}
								onChange={(e) =>
									setFormData({ ...formData, doctorName: e.target.value })
								}
								placeholder="Dr. Smith"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium text-slate-700">
								Emergency Contact
							</label>
							<Input
								value={formData.emergencyContact || ""}
								onChange={(e) =>
									setFormData({ ...formData, emergencyContact: e.target.value })
								}
								placeholder="Jane Doe: +1..."
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Preferences Section */}
			<section className="space-y-4">
				<h3 className="text-lg font-semibold text-slate-900 border-b pb-2">
					Preferences
				</h3>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Select
							label="Reminder Tone"
							value={formData.preferences?.reminderTone || "Normal"}
							onChange={(e) =>
								setFormData({
									...formData,
									preferences: {
										...formData.preferences,
										reminderTone: e.target.value,
									},
								})
							}
						>
							<option value="Normal">Normal</option>
							<option value="Urgent">Urgent</option>
							<option value="Repeat">Repeat reminders</option>
						</Select>
					</div>
					<div className="space-y-2">
						<Select
							label="Language"
							value={formData.preferences?.language || "English"}
							onChange={(e) =>
								setFormData({
									...formData,
									preferences: {
										...formData.preferences,
										language: e.target.value,
									},
								})
							}
						>
							<option value="English">English</option>
							<option value="Spanish">Spanish</option>
							<option value="French">French</option>
						</Select>
					</div>
					<div className="space-y-2 md:col-span-2">
						<label className="text-sm font-medium text-slate-700">
							Telegram Notifications
						</label>
						<p className="text-xs text-slate-500 mb-3">
							Connect your Telegram account to receive medication reminders
							directly in Telegram.
						</p>
						<TelegramWidget
							botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || ""}
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
								toast.error("Connection failed", {
									description: error,
								});
							}}
						/>
						{formData.telegramChatId && (
							<Button
								type="button"
								variant="outline"
								onClick={handleTestTelegram}
								disabled={isTesting}
								className="w-full mt-3"
							>
								{isTesting ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Sending test message...
									</>
								) : (
									"Send Test Message"
								)}
							</Button>
						)}
					</div>
				</div>
			</section>

			<div className="flex justify-end pt-4">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className="min-w-[120px]"
				>
					{isSaving ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Save className="w-4 h-4 mr-2" />
							Save Changes
						</>
					)}
				</Button>
			</div>
		</div>
	);
}

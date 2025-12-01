"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { ChevronLeft, Plus, Trash2, Clock, Package } from "lucide-react";
import { Medication } from "@/lib/storage";
import Link from "next/link";
import { saveMedicationAction } from "./actions";
import { toast } from "sonner";
import { NotificationPermissionCard } from "@/components/notification-permission-card";
import { getLocalTodayDate } from "@/lib/date-utils";

interface AddMedicationClientProps {
	userId: string;
}

export default function AddMedicationClient({
	userId,
}: AddMedicationClientProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const [formData, setFormData] = useState<Omit<Medication, "id">>({
		name: "",
		dosage: "",
		type: "Tablet",
		frequency: "Daily",
		times: ["08:00"],
		startDate: getLocalTodayDate(),
		tracking: {
			confirm: true,
			notify: false,
			repeat: false,
		},
		notes: "",
		currentSupply: undefined,
		supplyUnit: "tablets",
		lowStockThreshold: undefined,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!userId) return;

		setLoading(true);
		try {
			const result = await saveMedicationAction(formData);

			if (result.success) {
				toast.success("Medication saved successfully!");
				router.push("/dashboard");
			} else {
				toast.error(result.error || "Failed to save medication");
			}
		} catch (error) {
			console.error("Error saving medication:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const addTimeSlot = () => {
		setFormData((prev) => ({ ...prev, times: [...prev.times, "12:00"] }));
	};

	const removeTimeSlot = (index: number) => {
		setFormData((prev) => ({
			...prev,
			times: prev.times.filter((_, i) => i !== index),
		}));
	};

	const updateTimeSlot = (index: number, value: string) => {
		const newTimes = [...formData.times];
		newTimes[index] = value;
		setFormData((prev) => ({ ...prev, times: newTimes }));
	};

	return (
		<div className="min-h-screen bg-slate-50 flex flex-col">
			<div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
				<Link href="/dashboard">
					<Button variant="ghost" size="icon" className="-ml-2">
						<ChevronLeft className="w-6 h-6 text-slate-600" />
					</Button>
				</Link>
				<h1 className="text-lg font-bold text-slate-900 ml-2">
					Add Medication
				</h1>
			</div>

			<form
				onSubmit={handleSubmit}
				className="flex-1 p-6 max-w-md w-full mx-auto space-y-8"
			>
				{/* Section 1: Details */}
				<div className="space-y-4">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
						Medication Details
					</h2>

					<div className="space-y-1.5">
						<label className="block text-sm font-medium text-slate-700">
							Medicine Name
						</label>
						<Input
							required
							placeholder="e.g. Metformin"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							className="bg-white"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<label className="block text-sm font-medium text-slate-700">
								Dosage
							</label>
							<Input
								required
								placeholder="e.g. 500mg"
								value={formData.dosage}
								onChange={(e) =>
									setFormData({ ...formData, dosage: e.target.value })
								}
								className="bg-white"
							/>
						</div>
						<Select
							label="Type"
							value={formData.type}
							onChange={(e) =>
								setFormData({ ...formData, type: e.target.value })
							}
							className="bg-white"
						>
							<option value="Tablet">Tablet</option>
							<option value="Capsule">Capsule</option>
							<option value="Syrup">Syrup</option>
							<option value="Injection">Injection</option>
							<option value="Drops">Drops</option>
							<option value="Other">Other</option>
						</Select>
					</div>
				</div>

				{/* Section 2: Schedule */}
				<div className="space-y-4">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
						Schedule
					</h2>

					<Select
						label="Frequency"
						value={formData.frequency}
						onChange={(e) =>
							setFormData({ ...formData, frequency: e.target.value })
						}
						className="bg-white"
					>
						<option value="Daily">Daily</option>
						<option value="Weekly">Weekly</option>
						<option value="Every X Hours">Every X Hours</option>
						<option value="As Needed">As Needed</option>
					</Select>

					<div className="space-y-2">
						<label className="block text-sm font-medium text-slate-700">
							Reminder Times
						</label>
						{formData.times.map((time, index) => (
							<div key={index} className="flex gap-2">
								<div className="relative flex-1">
									<Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
									<Input
										type="time"
										value={time}
										onChange={(e) => updateTimeSlot(index, e.target.value)}
										className="pl-10 bg-white"
									/>
								</div>
								{formData.times.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="text-red-500 hover:text-red-600 hover:bg-red-50"
										onClick={() => removeTimeSlot(index)}
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								)}
							</div>
						))}
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="w-full border-dashed text-slate-500 hover:text-blue-600 hover:border-blue-200"
							onClick={addTimeSlot}
						>
							<Plus className="w-4 h-4 mr-2" /> Add Time Slot
						</Button>
					</div>

					<div className="space-y-1.5">
						<label className="block text-sm font-medium text-slate-700">
							Start Date
						</label>
						<Input
							type="date"
							value={formData.startDate}
							onChange={(e) =>
								setFormData({ ...formData, startDate: e.target.value })
							}
							className="bg-white"
						/>
					</div>
				</div>

				{/* Section 3: Inventory (Optional) */}
				<div className="space-y-4">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
						Inventory Tracking (Optional)
					</h2>

					<div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
						<div className="flex items-start gap-2 mb-3">
							<Package className="w-5 h-5 text-blue-600 mt-0.5" />
							<div>
								<p className="text-sm font-medium text-blue-900">
									Track your medication supply
								</p>
								<p className="text-xs text-blue-700 mt-1">
									Get alerts when running low
								</p>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<label className="block text-sm font-medium text-slate-700">
									Current Supply
								</label>
								<Input
									type="number"
									min="0"
									placeholder="e.g. 30"
									value={formData.currentSupply || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											currentSupply: e.target.value
												? parseInt(e.target.value)
												: undefined,
										})
									}
									className="bg-white"
								/>
							</div>
							<Select
								label="Unit"
								value={formData.supplyUnit || "tablets"}
								onChange={(e) =>
									setFormData({ ...formData, supplyUnit: e.target.value })
								}
								className="bg-white"
							>
								<option value="tablets">Tablets</option>
								<option value="capsules">Capsules</option>
								<option value="ml">ml</option>
								<option value="doses">Doses</option>
								<option value="units">Units</option>
							</Select>
						</div>

						{formData.currentSupply !== undefined && (
							<div className="space-y-1.5 mt-4">
								<label className="block text-sm font-medium text-slate-700">
									Low Stock Alert (Optional)
								</label>
								<Input
									type="number"
									min="0"
									max={formData.currentSupply}
									placeholder="e.g. 5"
									value={formData.lowStockThreshold || ""}
									onChange={(e) =>
										setFormData({
											...formData,
											lowStockThreshold: e.target.value
												? parseInt(e.target.value)
												: undefined,
										})
									}
									className="bg-white"
								/>
								<p className="text-xs text-slate-500">
									Alert when supply reaches this level
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Section 4: Options */}
				<div className="space-y-4">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
						Tracking & Notes
					</h2>

					<div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
						<label className="flex items-center justify-between cursor-pointer">
							<span className="text-sm font-medium text-slate-700">
								Require Confirmation
							</span>
							<input
								type="checkbox"
								checked={formData.tracking.confirm}
								onChange={(e) =>
									setFormData({
										...formData,
										tracking: {
											...formData.tracking,
											confirm: e.target.checked,
										},
									})
								}
								className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
							/>
						</label>
						<div className="h-px bg-slate-100" />
						<label className="flex items-center justify-between cursor-pointer">
							<span className="text-sm font-medium text-slate-700">
								Notify if Missed
							</span>
							<input
								type="checkbox"
								checked={formData.tracking.notify}
								onChange={(e) =>
									setFormData({
										...formData,
										tracking: {
											...formData.tracking,
											notify: e.target.checked,
										},
									})
								}
								className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
							/>
						</label>
					</div>

					<div className="space-y-1.5">
						<label className="block text-sm font-medium text-slate-700">
							Notes (Optional)
						</label>
						<textarea
							className="w-full min-h-[100px] px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Take with food..."
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
						/>
					</div>
				</div>

				{/* Section 5: Notifications */}
				<div className="space-y-4">
					<h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
						Reminders
					</h2>
					<p className="text-sm text-slate-600">
						Enable notifications to receive timely reminders for this
						medication.
					</p>
					<NotificationPermissionCard
						compact={false}
						autoHideOnGranted={true}
					/>
				</div>

				<Button
					type="submit"
					disabled={loading}
					className="w-full py-6 text-lg shadow-xl shadow-blue-100"
				>
					{loading ? "Saving..." : "Save Medication"}
				</Button>
			</form>
		</div>
	);
}

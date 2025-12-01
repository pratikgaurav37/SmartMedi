"use client";

import { Button } from "@/components/ui/button";
import {
	Plus,
	Pill,
	Clock,
	Search,
	Filter,
	Calendar,
	AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Medication } from "@/lib/storage";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

interface MedicationsClientProps {
	medications: Medication[];
	userId: string;
}

const container = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.05,
		},
	},
};

const item = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export function MedicationsClient({
	medications,
	userId,
}: MedicationsClientProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<string>("all");

	// Get unique medication types
	const medicationTypes = useMemo(() => {
		const types = new Set(medications.map((med) => med.type));
		return Array.from(types);
	}, [medications]);

	// Filter medications
	const filteredMedications = useMemo(() => {
		return medications.filter((med) => {
			const matchesSearch =
				med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				med.dosage.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesType = filterType === "all" || med.type === filterType;
			return matchesSearch && matchesType;
		});
	}, [medications, searchQuery, filterType]);

	// Categorize medications
	const activeMedications = filteredMedications.filter((med) => {
		if (!med.endDate) return true;
		return new Date(med.endDate) >= new Date();
	});

	const lowStockMedications = filteredMedications.filter(
		(med) =>
			med.currentSupply !== undefined &&
			med.currentSupply <= (med.lowStockThreshold || 5)
	);

	return (
		<div className="space-y-6 pb-20 max-w-7xl mx-auto">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
						My Medications
					</h1>
					<p className="text-slate-500 dark:text-slate-400 mt-2">
						Manage and track all your medications in one place
					</p>
				</div>
				<Link href="/dashboard/add-medication">
					<Button
						size="lg"
						className="rounded-xl shadow-sm hover:shadow-md transition-all duration-300 bg-primary hover:bg-primary/90 text-white px-6"
					>
						<Plus className="w-5 h-5 mr-2" /> Add Medication
					</Button>
				</Link>
			</div>

			{/* Low Stock Alert */}
			{lowStockMedications.length > 0 && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex items-start gap-4"
				>
					<div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400 shrink-0">
						<AlertCircle className="w-6 h-6" />
					</div>
					<div>
						<h3 className="font-bold text-amber-900 dark:text-amber-100 text-lg">
							Low Stock Alert
						</h3>
						<p className="text-amber-700 dark:text-amber-300 mt-1">
							{lowStockMedications.length} medication
							{lowStockMedications.length > 1 ? "s" : ""} running low:{" "}
							<span className="font-semibold">
								{lowStockMedications.map((m) => m.name).join(", ")}
							</span>
						</p>
					</div>
				</motion.div>
			)}

			{/* Search and Filter */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
					<Input
						type="text"
						placeholder="Search medications..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-12"
					/>
				</div>
				<div className="flex gap-2">
					<Button
						variant={filterType === "all" ? "default" : "outline"}
						onClick={() => setFilterType("all")}
						className="rounded-xl"
					>
						All ({medications.length})
					</Button>
					{medicationTypes.map((type) => (
						<Button
							key={type}
							variant={filterType === type ? "default" : "outline"}
							onClick={() => setFilterType(type)}
							className="rounded-xl"
						>
							{type} ({medications.filter((m) => m.type === type).length})
						</Button>
					))}
				</div>
			</div>

			{/* Medications Grid */}
			{filteredMedications.length === 0 ? (
				<div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 flex flex-col items-center text-center bg-slate-50/50 dark:bg-slate-900/50">
					<div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
						{searchQuery || filterType !== "all" ? (
							<Search className="w-10 h-10 text-slate-400" />
						) : (
							<Pill className="w-10 h-10 text-slate-400" />
						)}
					</div>
					<h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
						{searchQuery || filterType !== "all"
							? "No medications found"
							: "No medications yet"}
					</h3>
					<p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
						{searchQuery || filterType !== "all"
							? "Try adjusting your search or filter criteria"
							: "Add your first medication to get started with tracking"}
					</p>
					{!searchQuery && filterType === "all" && (
						<Link href="/dashboard/add-medication">
							<Button size="lg" className="rounded-xl shadow-sm">
								<Plus className="w-5 h-5 mr-2" />
								Add First Medication
							</Button>
						</Link>
					)}
				</div>
			) : (
				<motion.div
					variants={container}
					initial="hidden"
					animate="show"
					className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
				>
					{filteredMedications.map((med) => (
						<motion.div key={med.id} variants={item}>
							<Link href={`/dashboard/medications/${med.id}`}>
								<div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-primary/30 h-full">
									<div className="flex justify-between items-start mb-4">
										<div className="flex items-start gap-4 flex-1">
											<div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
												<Pill className="w-6 h-6" />
											</div>
											<div className="flex-1 min-w-0">
												<h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-primary transition-colors truncate">
													{med.name}
												</h3>
												<p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
													{med.dosage}
												</p>
											</div>
										</div>
									</div>

									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
												Type
											</span>
											<span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300">
												{med.type}
											</span>
										</div>

										<div className="flex items-center justify-between">
											<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
												Frequency
											</span>
											<span className="text-sm font-semibold text-slate-900 dark:text-white">
												{med.frequency}
											</span>
										</div>

										<div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
											<div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
												<Clock className="w-4 h-4" />
												<span className="text-xs font-medium">Next Dose</span>
											</div>
											<span className="font-bold text-slate-900 dark:text-white">
												{med.times[0] || "Anytime"}
											</span>
										</div>

										{med.currentSupply !== undefined && (
											<div className="space-y-1.5 px-1 pt-2">
												<div className="flex justify-between text-xs font-medium">
													<span className="text-slate-500">Supply</span>
													<span
														className={
															med.currentSupply <= (med.lowStockThreshold || 5)
																? "text-red-500 font-bold"
																: "text-emerald-600"
														}
													>
														{med.currentSupply} {med.supplyUnit || "units"} left
													</span>
												</div>
												<div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
													<div
														className={`h-full rounded-full transition-all ${
															med.currentSupply <= (med.lowStockThreshold || 5)
																? "bg-red-500"
																: "bg-emerald-500"
														}`}
														style={{
															width: `${Math.min(
																(med.currentSupply / 100) * 100,
																100
															)}%`,
														}}
													/>
												</div>
											</div>
										)}

										{med.endDate && (
											<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
												<Calendar className="w-3.5 h-3.5" />
												<span>
													Ends: {new Date(med.endDate).toLocaleDateString()}
												</span>
											</div>
										)}
									</div>
								</div>
							</Link>
						</motion.div>
					))}
				</motion.div>
			)}

			{/* Stats Footer */}
			{filteredMedications.length > 0 && (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
						<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
							Total Medications
						</p>
						<p className="text-2xl font-bold text-slate-900 dark:text-white">
							{activeMedications.length}
						</p>
					</div>
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
						<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
							Total Daily Doses
						</p>
						<p className="text-2xl font-bold text-slate-900 dark:text-white">
							{activeMedications.reduce(
								(sum, med) => sum + med.times.length,
								0
							)}
						</p>
					</div>
					<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
						<p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
							Low Stock Items
						</p>
						<p
							className={`text-2xl font-bold ${
								lowStockMedications.length > 0
									? "text-red-500"
									: "text-emerald-500"
							}`}
						>
							{lowStockMedications.length}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

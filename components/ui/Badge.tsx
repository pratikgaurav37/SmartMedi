import React from "react";

export const Badge = ({ status }: { status: string }) => {
	const styles: Record<string, string> = {
		taken: "bg-emerald-100 text-emerald-700",
		skipped: "bg-slate-100 text-slate-600",
		missed: "bg-red-100 text-red-600",
		delayed: "bg-amber-100 text-amber-700",
		upcoming: "bg-blue-50 text-blue-600",
		unresponsive: "bg-orange-100 text-orange-700",
	};

	const labels: Record<string, string> = {
		taken: "Taken",
		skipped: "Skipped",
		missed: "Missed",
		delayed: "Delayed",
		upcoming: "Upcoming",
		unresponsive: "No Response",
	};

	return (
		<span
			className={`px-3 py-1 rounded-full text-xs font-bold ${
				styles[status] || styles.upcoming
			}`}
		>
			{labels[status] || "Unknown"}
		</span>
	);
};

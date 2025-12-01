/**
 * Utility functions for handling dates and times consistently across the application.
 * Focuses on local time handling to avoid UTC mismatches.
 */

/**
 * Returns the current date in YYYY-MM-DD format based on the user's local time.
 * This is preferred over new Date().toISOString().split('T')[0] which uses UTC.
 */
export function getLocalTodayDate(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Returns yesterday's date in YYYY-MM-DD format based on the user's local time.
 */
export function getLocalYesterdayDate(): string {
	const now = new Date();
	now.setDate(now.getDate() - 1);
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Formats a date string or Date object into a readable time string (HH:MM).
 */
export function formatTimeForDisplay(date: string | Date): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/**
 * Creates a Date object for a specific time today.
 * @param timeStr Time in "HH:MM" format
 */
export function getTodayDateAtTime(timeStr: string): Date {
	const [hours, minutes] = timeStr.split(":").map(Number);
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);
	return date;
}

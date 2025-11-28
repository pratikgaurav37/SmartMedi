import { createClient } from "@/lib/supabase/server";
import { DoseLog, DoseStatus } from "@/lib/storage";
import { decrementSupply } from "@/lib/medications";

/**
 * Database dose log type (snake_case for Supabase)
 */
interface DbDoseLog {
	id: string;
	user_id: string;
	medication_id: string;
	scheduled_time: string;
	actual_time?: string;
	status: DoseStatus;
	notes?: string;
	delayed_until?: string;
	delay_count?: number;
	delay_reason?: string;
	created_at?: string;
	updated_at?: string;
}

/**
 * Convert database dose log to app format
 */
function dbToDoseLog(db: DbDoseLog): DoseLog {
	return {
		id: db.id,
		medicationId: db.medication_id,
		scheduledTime: db.scheduled_time,
		actualTime: db.actual_time,
		status: db.status,
		notes: db.notes,
		delayedUntil: db.delayed_until,
		delayCount: db.delay_count,
		delayReason: db.delay_reason,
	};
}

/**
 * Convert app dose log to database format
 */
function doseLogToDb(
	log: DoseLog,
	userId: string
): Omit<DbDoseLog, "created_at" | "updated_at"> {
	return {
		id: log.id,
		user_id: userId,
		medication_id: log.medicationId,
		scheduled_time: log.scheduledTime,
		actual_time: log.actualTime,
		status: log.status,
		notes: log.notes,
		delayed_until: log.delayedUntil,
		delay_count: log.delayCount,
		delay_reason: log.delayReason,
	};
}

/**
 * Create or update a dose log
 * Automatically decrements supply when status is 'taken'
 */
export async function createDoseLog(
	userId: string,
	log: DoseLog
): Promise<{ data: DoseLog | null; error: Error | null }> {
	try {
		const supabase = await createClient();
		const dbLog = doseLogToDb(log, userId);

		// Check if log already exists
		const { data: existing } = await supabase
			.from("dose_logs")
			.select("status")
			.eq("id", log.id)
			.single();

		const previousStatus = existing?.status;

		// Upsert the log
		const { data, error } = await supabase
			.from("dose_logs")
			.upsert(dbLog)
			.select()
			.single();

		if (error) throw error;

		// Handle inventory decrement
		// Only decrement if transitioning TO 'taken' status
		if (log.status === "taken" && previousStatus !== "taken") {
			await decrementSupply(log.medicationId, 1);
		}
		// If changing FROM 'taken' to something else, increment back
		else if (previousStatus === "taken" && log.status !== "taken") {
			await decrementSupply(log.medicationId, -1); // Negative decrement = increment
		}

		return { data: dbToDoseLog(data), error: null };
	} catch (error) {
		console.error("Error creating dose log:", error);
		return { data: null, error: error as Error };
	}
}

/**
 * Get dose logs for a user with optional filters
 */
export async function getDoseLogs(
	userId: string,
	filters?: {
		medicationId?: string;
		startDate?: string;
		endDate?: string;
		status?: DoseStatus;
	}
): Promise<{ data: DoseLog[]; error: Error | null }> {
	try {
		const supabase = await createClient();

		let query = supabase
			.from("dose_logs")
			.select("*")
			.eq("user_id", userId)
			.order("scheduled_time", { ascending: false });

		if (filters?.medicationId) {
			query = query.eq("medication_id", filters.medicationId);
		}

		if (filters?.startDate) {
			query = query.gte("scheduled_time", filters.startDate);
		}

		if (filters?.endDate) {
			query = query.lte("scheduled_time", filters.endDate);
		}

		if (filters?.status) {
			query = query.eq("status", filters.status);
		}

		const { data, error } = await query;

		if (error) throw error;

		return { data: (data || []).map(dbToDoseLog), error: null };
	} catch (error) {
		console.error("Error fetching dose logs:", error);
		return { data: [], error: error as Error };
	}
}

/**
 * Update a dose log
 * Handles supply adjustment when status changes
 */
export async function updateDoseLog(
	logId: string,
	updates: Partial<Omit<DoseLog, "id" | "medicationId">>
): Promise<{ data: DoseLog | null; error: Error | null }> {
	try {
		const supabase = await createClient();

		// Get current log to check status change
		const { data: current, error: fetchError } = await supabase
			.from("dose_logs")
			.select("*")
			.eq("id", logId)
			.single();

		if (fetchError) throw fetchError;

		const previousStatus = current?.status;
		const newStatus = updates.status;

		// Convert camelCase to snake_case for database
		const dbUpdates: Partial<DbDoseLog> = {};
		if (updates.actualTime !== undefined)
			dbUpdates.actual_time = updates.actualTime;
		if (updates.status !== undefined) dbUpdates.status = updates.status;
		if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
		if (updates.delayedUntil !== undefined)
			dbUpdates.delayed_until = updates.delayedUntil;
		if (updates.delayCount !== undefined)
			dbUpdates.delay_count = updates.delayCount;
		if (updates.delayReason !== undefined)
			dbUpdates.delay_reason = updates.delayReason;

		const { data, error } = await supabase
			.from("dose_logs")
			.update(dbUpdates)
			.eq("id", logId)
			.select()
			.single();

		if (error) throw error;

		// Handle inventory adjustment on status change
		if (newStatus && previousStatus !== newStatus && current?.medication_id) {
			if (newStatus === "taken" && previousStatus !== "taken") {
				await decrementSupply(current.medication_id, 1);
			} else if (previousStatus === "taken" && newStatus !== "taken") {
				await decrementSupply(current.medication_id, -1);
			}
		}

		return { data: dbToDoseLog(data), error: null };
	} catch (error) {
		console.error("Error updating dose log:", error);
		return { data: null, error: error as Error };
	}
}

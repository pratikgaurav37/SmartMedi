import { createClient } from "@/lib/supabase/server";
import { Medication } from "@/lib/storage";

/**
 * Database medication type (snake_case for Supabase)
 */
interface DbMedication {
	id: string;
	user_id: string;
	name: string;
	dosage: string;
	type: string;
	frequency: string;
	times: string[];
	start_date: string;
	end_date?: string;
	tracking: {
		confirm: boolean;
		notify: boolean;
		repeat: boolean;
	};
	notes?: string;
	current_supply?: number;
	supply_unit?: string;
	low_stock_threshold?: number;
	created_at?: string;
	updated_at?: string;
}

/**
 * Convert database medication to app format
 */
function dbToMedication(db: DbMedication): Medication {
	return {
		id: db.id,
		name: db.name,
		dosage: db.dosage,
		type: db.type,
		frequency: db.frequency,
		times: db.times,
		startDate: db.start_date,
		endDate: db.end_date,
		tracking: db.tracking,
		notes: db.notes,
		currentSupply: db.current_supply,
		supplyUnit: db.supply_unit,
		lowStockThreshold: db.low_stock_threshold,
	};
}

/**
 * Convert app medication to database format
 */
function medicationToDb(
	med: Omit<Medication, "id">,
	userId: string
): Omit<DbMedication, "id" | "created_at" | "updated_at"> {
	return {
		user_id: userId,
		name: med.name,
		dosage: med.dosage,
		type: med.type,
		frequency: med.frequency,
		times: med.times,
		start_date: med.startDate,
		end_date: med.endDate,
		tracking: med.tracking,
		notes: med.notes,
		current_supply: med.currentSupply,
		supply_unit: med.supplyUnit,
		low_stock_threshold: med.lowStockThreshold,
	};
}

/**
 * Create a new medication
 */
export async function createMedication(
	userId: string,
	medication: Omit<Medication, "id">
): Promise<{ data: Medication | null; error: Error | null }> {
	try {
		const supabase = await createClient();
		const dbMed = medicationToDb(medication, userId);

		const { data, error } = await supabase
			.from("medications")
			.insert(dbMed)
			.select()
			.single();

		if (error) throw error;

		return { data: dbToMedication(data), error: null };
	} catch (error) {
		console.error("Error creating medication:", error);
		return { data: null, error: error as Error };
	}
}

/**
 * Get all medications for a user
 */
export async function getMedications(
	userId: string
): Promise<{ data: Medication[]; error: Error | null }> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("medications")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;

		return { data: (data || []).map(dbToMedication), error: null };
	} catch (error) {
		console.error("Error fetching medications:", error);
		return { data: [], error: error as Error };
	}
}

/**
 * Update a medication
 */
export async function updateMedication(
	medicationId: string,
	updates: Partial<Omit<Medication, "id">>
): Promise<{ data: Medication | null; error: Error | null }> {
	try {
		const supabase = await createClient();

		// Convert camelCase to snake_case for database
		const dbUpdates: Partial<DbMedication> = {};
		if (updates.name !== undefined) dbUpdates.name = updates.name;
		if (updates.dosage !== undefined) dbUpdates.dosage = updates.dosage;
		if (updates.type !== undefined) dbUpdates.type = updates.type;
		if (updates.frequency !== undefined)
			dbUpdates.frequency = updates.frequency;
		if (updates.times !== undefined) dbUpdates.times = updates.times;
		if (updates.startDate !== undefined)
			dbUpdates.start_date = updates.startDate;
		if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
		if (updates.tracking !== undefined) dbUpdates.tracking = updates.tracking;
		if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
		if (updates.currentSupply !== undefined)
			dbUpdates.current_supply = updates.currentSupply;
		if (updates.supplyUnit !== undefined)
			dbUpdates.supply_unit = updates.supplyUnit;
		if (updates.lowStockThreshold !== undefined)
			dbUpdates.low_stock_threshold = updates.lowStockThreshold;

		const { data, error } = await supabase
			.from("medications")
			.update(dbUpdates)
			.eq("id", medicationId)
			.select()
			.single();

		if (error) throw error;

		return { data: dbToMedication(data), error: null };
	} catch (error) {
		console.error("Error updating medication:", error);
		return { data: null, error: error as Error };
	}
}

/**
 * Delete a medication
 */
export async function deleteMedication(
	medicationId: string
): Promise<{ error: Error | null }> {
	try {
		const supabase = await createClient();

		const { error } = await supabase
			.from("medications")
			.delete()
			.eq("id", medicationId);

		if (error) throw error;

		return { error: null };
	} catch (error) {
		console.error("Error deleting medication:", error);
		return { error: error as Error };
	}
}

/**
 * Decrement medication supply
 */
export async function decrementSupply(
	medicationId: string,
	amount: number = 1
): Promise<{ data: Medication | null; error: Error | null }> {
	try {
		const supabase = await createClient();

		// First get current supply
		const { data: med, error: fetchError } = await supabase
			.from("medications")
			.select("current_supply")
			.eq("id", medicationId)
			.single();

		if (fetchError) throw fetchError;

		const currentSupply = med?.current_supply;
		if (currentSupply === null || currentSupply === undefined) {
			// No inventory tracking enabled
			return { data: null, error: null };
		}

		const newSupply = Math.max(0, currentSupply - amount);

		const { data, error } = await supabase
			.from("medications")
			.update({ current_supply: newSupply })
			.eq("id", medicationId)
			.select()
			.single();

		if (error) throw error;

		return { data: dbToMedication(data), error: null };
	} catch (error) {
		console.error("Error decrementing supply:", error);
		return { data: null, error: error as Error };
	}
}

/**
 * Get medications with low stock
 */
export async function getLowStockMedications(
	userId: string
): Promise<{ data: Medication[]; error: Error | null }> {
	try {
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("medications")
			.select("*")
			.eq("user_id", userId)
			.not("current_supply", "is", null)
			.not("low_stock_threshold", "is", null)
			.filter("current_supply", "lte", "low_stock_threshold");

		if (error) throw error;

		return { data: (data || []).map(dbToMedication), error: null };
	} catch (error) {
		console.error("Error fetching low stock medications:", error);
		return { data: [], error: error as Error };
	}
}

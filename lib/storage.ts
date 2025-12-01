/**
 * Type definitions for medication tracking application
 */

export interface Medication {
	id: string;
	name: string;
	dosage: string;
	type: string;
	frequency: string;
	times: string[];
	startDate: string;
	endDate?: string;
	tracking: {
		confirm: boolean;
		notify: boolean;
		repeat: boolean;
	};
	notes?: string;
	currentSupply?: number;
	supplyUnit?: string;
	lowStockThreshold?: number;
}

export type DoseStatus =
	| "pending"
	| "taken"
	| "skipped"
	| "missed"
	| "delayed"
	| "unresponsive";

export interface DoseLog {
	id: string;
	userId: string; // Foreign key to auth.users
	medicationId: string;
	scheduledTime: string; // ISO string
	actualTime?: string; // ISO string
	status: DoseStatus;
	notes?: string;
	delayedUntil?: string; // ISO string
	delayCount?: number; // Track number of times delayed
	delayReason?: string; // Optional reason for delay
}

export interface UserProfile {
	id: string; // Supabase User ID
	name: string;
	dob: string;
	gender: string;
	weight?: number;
	phone: string;
	telegramChatId?: string;
	conditions: string[];
	allergies?: string;
	doctorName?: string;
	emergencyContact?: string;
	webNotificationsEnabled?: boolean;
	notificationPermissionRequestedAt?: string;
	pushSubscription?: any; // JSONB field for web push subscription
	preferences: {
		reminderTone: string;
		language: string;
		timezone: string;
	};
}

/**
 * Result type for server actions
 */
export type ActionResult<T = void> =
	| { success: true; data?: T }
	| { success: false; error: string; field?: string };

"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getNotificationPermission,
	requestNotificationPermission,
	isNotificationSupported,
	shouldPromptForPermission,
	markPermissionPrompted,
	subscribeToPushNotifications,
	type NotificationPermissionStatus,
} from "@/lib/web-notifications";

interface NotificationPermissionCardProps {
	onPermissionGranted?: () => void;
	onPermissionDenied?: () => void;
	compact?: boolean;
	autoHideOnGranted?: boolean;
}

export function NotificationPermissionCard({
	onPermissionGranted,
	onPermissionDenied,
	compact = false,
	autoHideOnGranted = false,
}: NotificationPermissionCardProps) {
	const [permission, setPermission] =
		useState<NotificationPermissionStatus>("default");
	const [isRequesting, setIsRequesting] = useState(false);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		setPermission(getNotificationPermission());

		// Auto-hide if already granted and autoHideOnGranted is true
		if (autoHideOnGranted && getNotificationPermission() === "granted") {
			setIsVisible(false);
		}
	}, [autoHideOnGranted]);

	const handleRequestPermission = async () => {
		setIsRequesting(true);
		markPermissionPrompted();

		const result = await requestNotificationPermission();
		setPermission(result);

		if (result === "granted") {
			// Subscribe to push notifications
			try {
				const subscription = await subscribeToPushNotifications();

				if (subscription) {
					// Save subscription to server
					const response = await fetch("/api/notifications/subscribe", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ subscription: subscription.toJSON() }),
					});

					if (response.ok) {
						console.log("✅ Push subscription saved to server");
					} else {
						console.error("Failed to save push subscription to server");
					}
				}
			} catch (error) {
				console.error("Error setting up push notifications:", error);
			}

			onPermissionGranted?.();
			if (autoHideOnGranted) {
				setTimeout(() => setIsVisible(false), 2000);
			}
		} else if (result === "denied") {
			onPermissionDenied?.();
		}

		setIsRequesting(false);
	};

	// Don't show if not supported or if auto-hidden
	if (!isNotificationSupported() || !isVisible) {
		return null;
	}

	// Compact version for inline display
	if (compact) {
		if (permission === "granted") {
			return (
				<div className="flex items-center gap-2 text-sm text-green-600">
					<CheckCircle2 className="h-4 w-4" />
					<span>Notifications enabled</span>
				</div>
			);
		}

		if (permission === "denied") {
			return (
				<div className="flex items-center gap-2 text-sm text-slate-500">
					<XCircle className="h-4 w-4" />
					<span>Notifications blocked</span>
				</div>
			);
		}

		return (
			<Button
				variant="outline"
				size="sm"
				onClick={handleRequestPermission}
				disabled={isRequesting}
				className="gap-2"
			>
				<Bell className="h-4 w-4" />
				Enable Notifications
			</Button>
		);
	}

	// Full card version
	if (permission === "granted") {
		return (
			<Card className="border-green-200 bg-green-50/50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<CheckCircle2 className="h-5 w-5 text-green-600" />
						<CardTitle className="text-base">Notifications Enabled</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-slate-600">
						You'll receive browser notifications for your medication reminders.
					</p>
				</CardContent>
			</Card>
		);
	}

	if (permission === "denied") {
		return (
			<Card className="border-amber-200 bg-amber-50/50">
				<CardHeader className="pb-3">
					<div className="flex items-center gap-2">
						<BellOff className="h-5 w-5 text-amber-600" />
						<CardTitle className="text-base">Notifications Blocked</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-slate-600 mb-3">
						You've blocked notifications. To enable them, please update your
						browser settings.
					</p>
					<p className="text-xs text-slate-500">
						💡 Tip: Look for the lock icon in your browser's address bar
					</p>
				</CardContent>
			</Card>
		);
	}

	// Default - show request prompt
	return (
		<Card className="border-primary/20 bg-primary/5">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-2">
					<Bell className="h-5 w-5 text-primary" />
					<CardTitle className="text-base">Enable Notifications</CardTitle>
				</div>
				<CardDescription>
					Get timely reminders for your medications
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-slate-600 mb-4">
					We'll send you browser notifications when it's time to take your
					medication. You can disable this anytime in your browser settings.
				</p>
				<Button
					onClick={handleRequestPermission}
					disabled={isRequesting}
					className="w-full"
				>
					{isRequesting ? "Requesting..." : "Enable Notifications"}
				</Button>
			</CardContent>
		</Card>
	);
}

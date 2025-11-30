"use client";

import { useState } from "react";
import { Send, Check, X, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TelegramConnectProps {
	onAuth: (data: {
		chatId: string;
		firstName: string;
		username?: string;
		photoUrl?: string;
	}) => void;
	onError?: (error: string) => void;
	botUsername: string; // Kept for prop compatibility, but we might fetch it dynamically
	isConnected?: boolean;
	connectedUser?: {
		firstName?: string;
		username?: string;
		photoUrl?: string;
	};
	onDisconnect?: () => void;
	className?: string;
}

export function TelegramConnect({
	onAuth,
	onError,
	botUsername: initialBotUsername,
	isConnected = false,
	connectedUser,
	onDisconnect,
	className = "",
}: TelegramConnectProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [connectLink, setConnectLink] = useState<string | null>(null);
	const [generatedBotUsername, setGeneratedBotUsername] = useState<
		string | null
	>(null);

	const handleGenerateLink = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/telegram/generate-token", {
				method: "POST",
			});
			const data = await response.json();

			if (response.ok && data.success) {
				setGeneratedBotUsername(data.botUsername);
				setConnectLink(`https://t.me/${data.botUsername}?start=${data.token}`);
			} else {
				setError(data.error || "Failed to generate connection link");
			}
		} catch (err) {
			setError("Failed to connect to server");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDisconnect = async () => {
		if (!onDisconnect) return;

		setIsLoading(true);
		try {
			const response = await fetch("/api/telegram/connect", {
				method: "DELETE",
			});

			if (response.ok) {
				onDisconnect();
				setConnectLink(null);
			} else {
				const data = await response.json();
				setError(data.error || "Failed to disconnect");
			}
		} catch (err) {
			setError("Failed to disconnect");
		} finally {
			setIsLoading(false);
		}
	};

	if (isConnected && connectedUser) {
		return (
			<div className={`space-y-3 ${className}`}>
				<div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
					{connectedUser.photoUrl ? (
						<img
							src={connectedUser.photoUrl}
							alt={connectedUser.firstName}
							className="w-12 h-12 rounded-full border-2 border-blue-300"
						/>
					) : (
						<div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
							<Send className="w-6 h-6 text-blue-600" />
						</div>
					)}
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<p className="font-semibold text-slate-900">
								{connectedUser.firstName}
							</p>
							<Check className="w-4 h-4 text-green-600" />
						</div>
						{connectedUser.username && (
							<p className="text-sm text-slate-600">
								@{connectedUser.username}
							</p>
						)}
						<p className="text-xs text-green-600 font-medium mt-0.5">
							Telegram Connected
						</p>
					</div>
					{onDisconnect && (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={handleDisconnect}
							disabled={isLoading}
							className="text-slate-500 hover:text-red-600 hover:bg-red-50"
						>
							{isLoading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<X className="w-4 h-4" />
							)}
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className={`space-y-4 ${className}`}>
			{!connectLink ? (
				<div className="text-center">
					<Button
						onClick={handleGenerateLink}
						disabled={isLoading}
						className="w-full bg-[#24A1DE] hover:bg-[#1B8DBB] text-white"
					>
						{isLoading ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<Send className="w-4 h-4 mr-2" />
						)}
						Connect Telegram
					</Button>
					<p className="text-xs text-slate-500 mt-2">
						Receive medication reminders directly in Telegram
					</p>
				</div>
			) : (
				<div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
					<div className="text-center space-y-2">
						<h3 className="font-medium text-slate-900">Connect to Telegram</h3>
						<p className="text-sm text-slate-600">
							Click the button below to open Telegram and press{" "}
							<strong>Start</strong> to connect your account.
						</p>
					</div>

					<Button
						asChild
						className="w-full bg-[#24A1DE] hover:bg-[#1B8DBB] text-white"
					>
						<a href={connectLink} target="_blank" rel="noopener noreferrer">
							<Send className="w-4 h-4 mr-2" />
							Open Telegram
							<ExternalLink className="w-3 h-3 ml-1 opacity-70" />
						</a>
					</Button>

					<div className="pt-2 border-t border-slate-200">
						<p className="text-xs text-slate-500 text-center mb-2">
							After clicking Start in Telegram, refresh this page to see the
							connection status.
						</p>
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={() => window.location.reload()}
						>
							<RefreshCw className="w-3 h-3 mr-2" />
							Check Connection
						</Button>
					</div>
				</div>
			)}

			{error && (
				<div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
					<X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
					<p className="text-sm text-red-700">{error}</p>
				</div>
			)}
		</div>
	);
}

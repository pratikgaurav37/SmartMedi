import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
	display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
	variable: "--font-plus-jakarta",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Medi - Smart Medication Manager",
	description: "Manage your medications with ease.",
};

import { ReminderProvider } from "@/components/reminder-provider";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${outfit.variable} ${plusJakarta.variable} antialiased font-sans bg-slate-50 text-slate-900`}
			>
				<ReminderProvider>{children}</ReminderProvider>
				<Toaster />
			</body>
			<Script
				src="https://telegram.org/js/telegram-widget.js?22"
				data-telegram-login="medi_remainder_bot"
				data-size="large"
				data-onauth="onTelegramAuth"
				data-request-access="write"
				strategy="lazyOnload"
			/>
			<Script id="telegram-auth" strategy="lazyOnload">
				{`
          function onTelegramAuth(user) {
            alert('Logged in as ' + user.first_name + ' ' + user.last_name + ' (' + user.id + (user.username ? ', @' + user.username : '') + ')');
          }
        `}
			</Script>
		</html>
	);
}

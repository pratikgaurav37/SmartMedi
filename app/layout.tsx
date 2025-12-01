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

import { Toaster } from "@/components/ui/sonner";

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
				{children}
				<Toaster />
			</body>
		</html>
	);
}

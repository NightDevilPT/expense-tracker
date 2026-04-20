import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeContextProvider } from "@/components/context/theme-context";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Geist({
	subsets: ["latin"],
	variable: "--font-sans",
});

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export const metadata: Metadata = {
	title: "Expense Tracker",
	description: "Expense Tracker portal",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased w-full h-screen overflow-hidden`}
			>
				<ThemeContextProvider>{children}</ThemeContextProvider>
        <Toaster />
			</body>
		</html>
	);
}
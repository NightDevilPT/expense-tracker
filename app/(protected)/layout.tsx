import { AppProviders } from "@/components/context";
import { AuthProvider } from "@/components/context/auth-context/auth-context";
import SidebarLayout from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

const layout = ({
	children,
	notFound,
}: {
	children: React.ReactNode;
	notFound: React.ReactNode;
}) => {
	return (
		<AuthProvider>
			<AppProviders>
				<SidebarLayout>{children}</SidebarLayout>
			</AppProviders>
			<Toaster />
		</AuthProvider>
	);
};

export default layout;

import { AuthProvider } from "@/components/context/auth-context/auth-context";
import SidebarLayout from "@/components/layout/sidebar";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<AuthProvider>
			<SidebarLayout>{children}</SidebarLayout>
		</AuthProvider>
	);
};

export default layout;

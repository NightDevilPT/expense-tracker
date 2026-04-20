import { ReactNode } from "react";
import { AuthProvider } from "@/components/context/auth-context/auth-context";

const layout = ({ children }: { children: ReactNode }) => {
	return <AuthProvider>{children}</AuthProvider>;
};

export default layout;

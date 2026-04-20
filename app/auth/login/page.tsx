// app/(auth)/login/page.tsx
import { LoginForm } from "@/components/pages/login";
import { Wallet } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 mb-6"
					>
						<div className="p-2 bg-primary/10 rounded-xl">
							<Wallet className="h-6 w-6 text-primary" />
						</div>
						<span className="font-bold text-xl">
							ExpenseTracker
						</span>
					</Link>
				</div>

				<LoginForm standalone redirectTo="/dashboard" />

				<p className="text-center text-sm text-muted-foreground mt-6">
					By signing in, you agree to our{" "}
					<Link
						href="/terms"
						className="text-primary hover:underline"
					>
						Terms of Service
					</Link>{" "}
					and{" "}
					<Link
						href="/privacy"
						className="text-primary hover:underline"
					>
						Privacy Policy
					</Link>
				</p>
			</div>
		</div>
	);
}

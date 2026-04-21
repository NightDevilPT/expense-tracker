// components/pages/login/index.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Mail,
	Loader2,
	CheckCircle2,
	AlertCircle,
	ArrowLeft,
	LogIn,
	Shield,
	Send,
	KeyRound,
	ChevronRight,
} from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/context/auth-context/auth-context";

interface LoginFormProps {
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	redirectTo?: string;
	standalone?: boolean;
}

type Step = "email" | "otp";

export function LoginForm({
	trigger,
	open: controlledOpen,
	onOpenChange: controlledOnOpenChange,
	redirectTo = "/dashboard",
	standalone = false,
}: LoginFormProps) {
	const router = useRouter();
	const { login, requestOtp } = useAuth();

	const [internalOpen, setInternalOpen] = useState(false);
	const open = controlledOpen ?? internalOpen;
	const setOpen = controlledOnOpenChange ?? setInternalOpen;

	const [step, setStep] = useState<Step>("email");
	const [email, setEmail] = useState("");
	const [otpId, setOtpId] = useState("");
	const [otpValue, setOtpValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [countdown, setCountdown] = useState(0);

	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [countdown]);

	const resetForm = () => {
		setStep("email");
		setEmail("");
		setOtpId("");
		setOtpValue("");
		setError(null);
		setSuccess(null);
		setCountdown(0);
	};

	const handleClose = () => {
		setOpen(false);
		setTimeout(resetForm, 300);
	};

	const handleRequestOtp = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email || !email.includes("@")) {
			setError("Please enter a valid Gmail address");
			return;
		}

		setError(null);
		setSuccess(null);
		setIsLoading(true);

		try {
			const response = await requestOtp({ email });

			setOtpId(response.otpId);
			setStep("otp");
			setSuccess(`Verification code sent to ${email}`);

			// Auto-fill OTP in development
			if (response.otpCode) {
				console.log("🔐 DEV OTP:", response.otpCode);
				// Optional: Auto-fill for faster testing
				// setOtpValue(response.otpCode);
			}

			setCountdown(60);
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError("Failed to send verification code. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOtp = async () => {
		if (countdown > 0) return;

		setError(null);
		setSuccess(null);
		setIsResending(true);

		try {
			const response = await requestOtp({ email });

			setOtpId(response.otpId);
			setSuccess(`New code sent to ${email}`);

			if (response.otpCode) {
				console.log("🔐 DEV OTP:", response.otpCode);
			}

			setCountdown(60);
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError("Failed to resend code. Please try again.");
			}
		} finally {
			setIsResending(false);
		}
	};

	const handleVerifyOtp = async (e: React.FormEvent) => {
		e.preventDefault();

		if (otpValue.length !== 6) {
			setError("Please enter the 6-digit verification code");
			return;
		}

		setError(null);
		setSuccess(null);
		setIsLoggingIn(true);

		try {
			await login({
				email,
				otp: otpValue,
			});

			setSuccess("Login successful! Redirecting...");

			setTimeout(() => {
				if (!standalone) {
					handleClose();
				}
				router.push(redirectTo);
				router.refresh();
			}, 1000);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 401) {
					setError(
						"Invalid or expired verification code. Please try again.",
					);
				} else {
					setError(err.message);
				}
			} else {
				setError("Verification failed. Please try again.");
			}
			setOtpValue("");
		} finally {
			setIsLoggingIn(false);
		}
	};

	const handleBackToEmail = () => {
		setStep("email");
		setOtpValue("");
		setError(null);
		setSuccess(null);
	};

	const formatCountdown = (seconds: number) => {
		return `${seconds}s`;
	};

	const EmailForm = () => (
		<form onSubmit={handleRequestOtp} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="email" className="text-sm font-medium">
					Email Address
				</Label>
				<div className="relative">
					<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						id="email"
						type="email"
						placeholder="you@gmail.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="pl-10 h-11"
						disabled={isLoading}
						autoFocus
						autoComplete="email"
					/>
				</div>
				<p className="text-xs text-muted-foreground">
					We'll send a verification code to this email
				</p>
			</div>

			<Button type="submit" className="w-full h-11" disabled={isLoading}>
				{isLoading ? (
					<>
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						Sending Code...
					</>
				) : (
					<>
						<Send className="h-4 w-4 mr-2" />
						Send Verification Code
						<ChevronRight className="h-4 w-4 ml-auto" />
					</>
				)}
			</Button>
		</form>
	);

	const OtpForm = () => (
		<form onSubmit={handleVerifyOtp} className="space-y-4">
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<Label className="text-sm font-medium">
						Verification Code
					</Label>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleBackToEmail}
						className="h-auto p-0 text-muted-foreground hover:text-primary"
					>
						<ArrowLeft className="h-3 w-3 mr-1" />
						Change Email
					</Button>
				</div>

				{/* Email display */}
				<div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
					<Mail className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm font-medium">{email}</span>
					<CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
				</div>

				{/* OTP Input */}
				<div className="flex justify-center py-6">
					<InputOTP
						maxLength={6}
						value={otpValue}
						onChange={setOtpValue}
						disabled={isLoggingIn}
						autoFocus
					>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
				</div>

				{/* Resend Section */}
				<div className="text-center">
					<p className="text-sm text-muted-foreground">
						Didn't receive the code?{" "}
						{countdown > 0 ? (
							<span className="text-muted-foreground">
								Resend in {formatCountdown(countdown)}
							</span>
						) : (
							<Button
								type="button"
								variant="link"
								size="sm"
								onClick={handleResendOtp}
								disabled={isResending}
								className="p-0 h-auto text-primary"
							>
								{isResending ? (
									<>
										<Loader2 className="h-3 w-3 mr-1 animate-spin" />
										Sending...
									</>
								) : (
									"Resend Code"
								)}
							</Button>
						)}
					</p>
				</div>
			</div>

			<Button
				type="submit"
				className="w-full h-11"
				disabled={isLoggingIn || otpValue.length !== 6}
			>
				{isLoggingIn ? (
					<>
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						Verifying...
					</>
				) : (
					<>
						<LogIn className="h-4 w-4 mr-2" />
						Verify & Sign In
						<ChevronRight className="h-4 w-4 ml-auto" />
					</>
				)}
			</Button>
		</form>
	);

	const formContent = (
		<div className="space-y-4">
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert className="border-green-500 text-green-500 bg-green-50 dark:bg-green-950/20">
					<CheckCircle2 className="h-4 w-4" />
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			{step === "email" ? <EmailForm /> : <OtpForm />}
		</div>
	);

	// Standalone mode - render directly without dialog
	if (standalone) {
		return (
			<Card className="w-full">
				<CardHeader className="text-center">
					<div className="flex justify-center mb-4">
						<div className="p-3 bg-primary/10 rounded-full">
							<Shield className="h-6 w-6 text-primary" />
						</div>
					</div>
					<CardTitle className="text-2xl">
						{step === "email"
							? "Welcome Back"
							: "Verify Your Identity"}
					</CardTitle>
					<CardDescription>
						{step === "email"
							? "Enter your email to sign in to your account"
							: "Enter the verification code sent to your email"}
					</CardDescription>
				</CardHeader>
				<CardContent>{formContent}</CardContent>
			</Card>
		);
	}

	// Dialog mode
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-2">
						<div className="p-2 bg-primary/10 rounded-lg">
							<Shield className="h-5 w-5 text-primary" />
						</div>
						<DialogTitle>
							{step === "email" ? "Sign In" : "Verify OTP"}
						</DialogTitle>
					</div>
					<DialogDescription>
						{step === "email"
							? "Enter your email to receive a one-time password"
							: `Enter the 6-digit code sent to ${email}`}
					</DialogDescription>
				</DialogHeader>

				{formContent}
			</DialogContent>
		</Dialog>
	);
}

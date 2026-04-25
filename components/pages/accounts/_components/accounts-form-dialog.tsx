// components/pages/accounts/_components/accounts-form-dialog.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAccounts } from "@/components/context/accounts-context/accounts-context";
import {
	createAccountSchema,
	updateAccountSchema,
} from "@/lib/account-service/validation";
import type {
	CreateAccountInput,
	UpdateAccountInput,
} from "@/lib/account-service/validation";
import type { Account, AccountType } from "@/lib/account-service/types";
import { ZodError } from "zod";

type FormData = {
	name: string;
	type: AccountType;
	balance: number;
	currency: string;
	color: string;
	notes: string;
};

interface FormErrors {
	name?: string;
	type?: string;
	balance?: string;
	currency?: string;
	color?: string;
	notes?: string;
}

const PREDEFINED_COLORS = [
	"#3B82F6", // Blue
	"#10B981", // Green
	"#F59E0B", // Amber
	"#EF4444", // Red
	"#8B5CF6", // Purple
	"#EC4899", // Pink
	"#06B6D4", // Cyan
	"#F97316", // Orange
	"#84CC16", // Lime
	"#6366F1", // Indigo
];

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string }> = [
	{ value: "CASH", label: "Cash" },
	{ value: "BANK_ACCOUNT", label: "Bank Account" },
	{ value: "SAVINGS_ACCOUNT", label: "Savings Account" },
	{ value: "CREDIT_CARD", label: "Credit Card" },
	{ value: "DIGITAL_WALLET", label: "Digital Wallet" },
	{ value: "OTHER", label: "Other" },
];

interface AccountsFormDialogProps {
	mode?: "create" | "edit";
	account?: Account | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function AccountsFormDialog({
	mode = "create",
	account = null,
	trigger,
	onSuccess,
}: AccountsFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const { createAccount, updateAccount, isLoading } = useAccounts();
	const isEditMode = mode === "edit" && account;

	const [formData, setFormData] = React.useState<FormData>({
		name: "",
		type: "BANK_ACCOUNT",
		balance: 0,
		currency: "USD",
		color: "",
		notes: "",
	});
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && account) {
			setFormData({
				name: account.name,
				type: account.type,
				balance: 0, // Balance is not editable via form
				currency: account.currency || "USD",
				color: account.color || "",
				notes: account.notes || "",
			});
		}
	}, [isEditMode, account]);

	// Reset form when dialog closes (create mode only)
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({
				name: "",
				type: "BANK_ACCOUNT",
				balance: 0,
				currency: "USD",
				color: "",
				notes: "",
			});
			setErrors({});
		}
	}, [open, isEditMode]);

	function handleChange(field: keyof FormData, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function validateForm(): boolean {
		try {
			if (isEditMode) {
				// For edit, only validate fields that changed
				const updateData: Partial<UpdateAccountInput> = {};
				if (formData.name !== account?.name)
					updateData.name = formData.name;
				if (formData.type !== account?.type)
					updateData.type = formData.type;
				if (formData.currency !== (account?.currency || "USD"))
					updateData.currency = formData.currency || undefined;
				if (formData.color !== (account?.color || ""))
					updateData.color = formData.color || undefined;
				if (formData.notes !== (account?.notes || ""))
					updateData.notes = formData.notes || undefined;

				if (Object.keys(updateData).length === 0) {
					return true; // No changes
				}
				updateAccountSchema.parse(updateData);
			} else {
				createAccountSchema.parse({
					name: formData.name,
					type: formData.type,
					balance: formData.balance,
					currency: formData.currency || undefined,
					color: formData.color || undefined,
					notes: formData.notes || undefined,
				});
			}
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof ZodError) {
				const fieldErrors: FormErrors = {};
				for (const issue of error.issues) {
					const field = issue.path[0] as keyof FormErrors;
					if (field && !fieldErrors[field]) {
						fieldErrors[field] = issue.message;
					}
				}
				setErrors(fieldErrors);
			}
			return false;
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!validateForm()) return;

		let result: Account | null = null;

		if (isEditMode && account) {
			// Only send fields that changed
			const updateData: UpdateAccountInput = {};
			if (formData.name !== account.name) updateData.name = formData.name;
			if (formData.type !== account.type) updateData.type = formData.type;
			if (formData.currency !== (account.currency || "USD"))
				updateData.currency = formData.currency || undefined;
			if (formData.color !== (account.color || ""))
				updateData.color = formData.color || undefined;
			if (formData.notes !== (account.notes || ""))
				updateData.notes = formData.notes || undefined;

			if (Object.keys(updateData).length === 0) {
				toast.info("No changes to save");
				setOpen(false);
				return;
			}

			result = await updateAccount(account.id, updateData);
		} else {
			const createData: CreateAccountInput = {
				name: formData.name,
				type: formData.type,
				balance: formData.balance,
				currency: formData.currency || undefined,
				color: formData.color || undefined,
				notes: formData.notes || undefined,
			};
			result = await createAccount(createData);
		}

		if (result) {
			toast.success(
				isEditMode
					? "Account updated successfully"
					: "Account created successfully",
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const defaultTrigger = isEditMode ? null : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Account
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Account" : "Create Account"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the account details."
							: "Add a new financial account to track."}
					</DialogDescription>
				</DialogHeader>
				<form id="account-form" onSubmit={handleSubmit}>
					<FieldGroup>
						{/* Name */}
						<Field data-invalid={!!errors.name}>
							<FieldLabel htmlFor="name">
								Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									handleChange("name", e.target.value)
								}
								placeholder="e.g., Chase Checking"
								autoFocus
							/>
							<FieldDescription>
								A descriptive name for your account.
							</FieldDescription>
							{errors.name && (
								<FieldError
									errors={[{ message: errors.name }]}
								/>
							)}
						</Field>

						{/* Type */}
						<Field data-invalid={!!errors.type}>
							<FieldLabel htmlFor="type">
								Type <span className="text-destructive">*</span>
							</FieldLabel>
							<Select
								value={formData.type}
								onValueChange={(value) =>
									handleChange("type", value)
								}
							>
								<SelectTrigger id="type">
									<SelectValue placeholder="Select account type" />
								</SelectTrigger>
								<SelectContent>
									{ACCOUNT_TYPES.map((at) => (
										<SelectItem
											key={at.value}
											value={at.value}
										>
											{at.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldDescription>
								The type of financial account.
							</FieldDescription>
							{errors.type && (
								<FieldError
									errors={[{ message: errors.type }]}
								/>
							)}
						</Field>

						{/* Initial Balance — Only for create mode */}
						{!isEditMode && (
							<Field data-invalid={!!errors.balance}>
								<FieldLabel htmlFor="balance">
									Initial Balance
								</FieldLabel>
								<Input
									id="balance"
									type="number"
									step="0.01"
									min="0"
									value={formData.balance}
									onChange={(e) =>
										handleChange("balance", e.target.value)
									}
									placeholder="0.00"
								/>
								<FieldDescription>
									Starting balance (must be 0 or greater).
								</FieldDescription>
								{errors.balance && (
									<FieldError
										errors={[{ message: errors.balance }]}
									/>
								)}
							</Field>
						)}

						{/* Currency */}
						<Field data-invalid={!!errors.currency}>
							<FieldLabel htmlFor="currency">Currency</FieldLabel>
							<Select
								value={formData.currency}
								onValueChange={(value) =>
									handleChange("currency", value)
								}
							>
								<SelectTrigger id="currency">
									<SelectValue placeholder="Select currency" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="USD">USD ($)</SelectItem>
									<SelectItem value="EUR">EUR (€)</SelectItem>
									<SelectItem value="GBP">GBP (£)</SelectItem>
									<SelectItem value="JPY">JPY (¥)</SelectItem>
									<SelectItem value="INR">INR (₹)</SelectItem>
								</SelectContent>
							</Select>
							<FieldDescription>
								3-letter currency code.
							</FieldDescription>
							{errors.currency && (
								<FieldError
									errors={[{ message: errors.currency }]}
								/>
							)}
						</Field>

						{/* Color */}
						<Field data-invalid={!!errors.color}>
							<FieldLabel htmlFor="color">Color</FieldLabel>
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Input
										id="color"
										type="color"
										value={formData.color || "#3B82F6"}
										onChange={(e) =>
											handleChange(
												"color",
												e.target.value,
											)
										}
										className="w-12 h-10 p-1"
									/>
									<Input
										value={formData.color || ""}
										onChange={(e) =>
											handleChange(
												"color",
												e.target.value,
											)
										}
										placeholder="#3B82F6"
										className="flex-1"
									/>
								</div>
								<div className="flex flex-wrap gap-2">
									{PREDEFINED_COLORS.map((color) => (
										<button
											key={color}
											type="button"
											className={`w-6 h-6 rounded-full border-2 transition-all ${
												formData.color === color
													? "border-primary scale-110"
													: "border-transparent hover:scale-105"
											}`}
											style={{ backgroundColor: color }}
											onClick={() =>
												handleChange("color", color)
											}
										/>
									))}
								</div>
							</div>
							<FieldDescription>
								Choose a color for visual identification.
							</FieldDescription>
							{errors.color && (
								<FieldError
									errors={[{ message: errors.color }]}
								/>
							)}
						</Field>

						{/* Notes */}
						<Field data-invalid={!!errors.notes}>
							<FieldLabel htmlFor="notes">Notes</FieldLabel>
							<Textarea
								id="notes"
								value={formData.notes}
								onChange={(e) =>
									handleChange("notes", e.target.value)
								}
								placeholder="Optional notes..."
								rows={3}
							/>
							<FieldDescription>
								Optional notes about this account.
							</FieldDescription>
							{errors.notes && (
								<FieldError
									errors={[{ message: errors.notes }]}
								/>
							)}
						</Field>
					</FieldGroup>
				</form>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="account-form"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{isEditMode ? "Save Changes" : "Create Account"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

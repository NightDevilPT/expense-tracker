// components/pages/accounts/_components/add-balance-dialog.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";
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
import { useAccounts } from "@/components/context/accounts-context/accounts-context";
import { addBalanceSchema } from "@/lib/account-service/validation";
import type { AddBalanceInput } from "@/lib/account-service/validation";
import type { Account } from "@/lib/account-service/types";
import { ZodError } from "zod";

interface FormData {
	amount: string;
	type: "ADD" | "SUBTRACT";
	description: string;
}

interface FormErrors {
	amount?: string;
	type?: string;
	description?: string;
}

interface AddBalanceDialogProps {
	account: Account;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function AddBalanceDialog({
	account,
	trigger,
	onSuccess,
}: AddBalanceDialogProps) {
	const [open, setOpen] = React.useState(false);
	const { addBalance, isLoading } = useAccounts();

	const [formData, setFormData] = React.useState<FormData>({
		amount: "",
		type: "ADD",
		description: "",
	});
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Reset form when dialog closes
	React.useEffect(() => {
		if (!open) {
			setFormData({
				amount: "",
				type: "ADD",
				description: "",
			});
			setErrors({});
		}
	}, [open]);

	function handleChange(field: keyof FormData, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function validateForm(): boolean {
		try {
			addBalanceSchema.parse({
				amount: parseFloat(formData.amount),
				type: formData.type,
				description: formData.description || undefined,
			});
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

		const data: AddBalanceInput = {
			amount: parseFloat(formData.amount),
			type: formData.type,
			description: formData.description || undefined,
		};

		const result = await addBalance(account.id, data);

		if (result) {
			toast.success(
				`${formData.type === "ADD" ? "Added" : "Subtracted"} ${new Intl.NumberFormat(
					"en-US",
					{
						style: "currency",
						currency: account.currency || "USD",
					},
				).format(
					parseFloat(formData.amount),
				)} ${formData.type === "ADD" ? "to" : "from"} ${account.name}`,
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const defaultTrigger = (
		<Button variant="outline" size="sm">
			<DollarSign className="h-4 w-4 mr-1" />
			Update Balance
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Update Balance</DialogTitle>
					<DialogDescription>
						Add or remove funds from{" "}
						<span className="font-medium">{account.name}</span>.
						Current balance:{" "}
						<span
							className={
								account.balance < 0
									? "text-destructive font-medium"
									: "font-medium"
							}
						>
							{new Intl.NumberFormat("en-US", {
								style: "currency",
								currency: account.currency || "USD",
							}).format(account.balance)}
						</span>
					</DialogDescription>
				</DialogHeader>
				<form id="add-balance-form" onSubmit={handleSubmit}>
					<FieldGroup>
						{/* Type */}
						<Field data-invalid={!!errors.type}>
							<FieldLabel htmlFor="balance-type">
								Operation{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Select
								value={formData.type}
								onValueChange={(value) =>
									handleChange("type", value)
								}
							>
								<SelectTrigger id="balance-type">
									<SelectValue placeholder="Select operation" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ADD">
										Add Money (Deposit)
									</SelectItem>
									<SelectItem value="SUBTRACT">
										Subtract Money (Withdrawal)
									</SelectItem>
								</SelectContent>
							</Select>
							{errors.type && (
								<FieldError
									errors={[{ message: errors.type }]}
								/>
							)}
						</Field>

						{/* Amount */}
						<Field data-invalid={!!errors.amount}>
							<FieldLabel htmlFor="amount">
								Amount{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0.01"
								value={formData.amount}
								onChange={(e) =>
									handleChange("amount", e.target.value)
								}
								placeholder="0.00"
								autoFocus
							/>
							<FieldDescription>
								Amount must be greater than 0.
							</FieldDescription>
							{errors.amount && (
								<FieldError
									errors={[{ message: errors.amount }]}
								/>
							)}
						</Field>

						{/* Description */}
						<Field data-invalid={!!errors.description}>
							<FieldLabel htmlFor="balance-description">
								Description
							</FieldLabel>
							<Input
								id="balance-description"
								value={formData.description}
								onChange={(e) =>
									handleChange("description", e.target.value)
								}
								placeholder="e.g., Monthly interest, salary deposit"
							/>
							<FieldDescription>
								Optional note for this balance change.
							</FieldDescription>
							{errors.description && (
								<FieldError
									errors={[{ message: errors.description }]}
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
						form="add-balance-form"
						disabled={isLoading}
						variant={
							formData.type === "SUBTRACT"
								? "destructive"
								: "default"
						}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{formData.type === "ADD"
							? "Add Balance"
							: "Subtract Balance"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

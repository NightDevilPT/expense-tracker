// components/pages/transactions/_components/transactions-form-dialog.tsx

"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTransactions } from "@/components/context/transactions-context/transactions-context";
import { useCategories } from "@/components/context/categories-context/categories-context";
import { useAccounts } from "@/components/context/accounts-context/accounts-context";
import { useTags } from "@/components/context/tags-context/tags-context";
import {
	createTransactionSchema,
	updateTransactionSchema,
} from "@/lib/transaction-service/validation";
import type {
	CreateTransactionInput,
	UpdateTransactionInput,
} from "@/lib/transaction-service/validation";
import type {
	Transaction,
	TransactionType,
} from "@/lib/transaction-service/types";
import { ZodError } from "zod";
import {
	AutoComplete,
	type AutoCompleteOption,
} from "@/components/shared/auto-complete";

type FormData = {
	amount: string;
	type: TransactionType;
	description: string;
	date: Date | undefined;
	notes: string;
	categoryId: string;
	accountId: string;
	tagIds: string[];
	// Transfer specific fields
	toAccountId: string;
	transferFee: string;
};

interface FormErrors {
	amount?: string;
	type?: string;
	description?: string;
	date?: string;
	categoryId?: string;
	accountId?: string;
	toAccountId?: string;
	transferFee?: string;
	tagIds?: string;
}

interface TransactionsFormDialogProps {
	mode?: "create" | "edit";
	item?: Transaction | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
	{ value: "INCOME", label: "Income" },
	{ value: "EXPENSE", label: "Expense" },
	{ value: "TRANSFER", label: "Transfer" },
];

export function TransactionsFormDialog({
	mode = "create",
	item = null,
	trigger,
	onSuccess,
}: TransactionsFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [calendarOpen, setCalendarOpen] = React.useState(false);
	const { createTransaction, updateTransaction, isLoading } =
		useTransactions();
	const { categories } = useCategories();
	const { accounts } = useAccounts();
	const { tags } = useTags();
	const isEditMode = mode === "edit" && item;

	const [formData, setFormData] = React.useState<FormData>({
		amount: "",
		type: "EXPENSE",
		description: "",
		date: new Date(),
		notes: "",
		categoryId: "",
		accountId: "",
		tagIds: [],
		toAccountId: "",
		transferFee: "0",
	});
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Convert categories to AutoComplete options
	const categoryOptions = React.useMemo<AutoCompleteOption[]>(() => {
		return categories.map((category) => ({
			value: category.id,
			label: category.name,
			description: category.type === "INCOME" ? "Income" : "Expense",
			color: category.color || undefined,
		}));
	}, [categories]);

	// Convert accounts to AutoComplete options
	const accountOptions = React.useMemo<AutoCompleteOption[]>(() => {
		return accounts.map((account) => ({
			value: account.id,
			label: account.name,
			description: account.type.replace("_", " "),
			color: account.color || undefined,
		}));
	}, [accounts]);

	// Filter out the selected source account from destination options
	const destinationAccountOptions = React.useMemo<
		AutoCompleteOption[]
	>(() => {
		return accounts
			.filter((account) => account.id !== formData.accountId)
			.map((account) => ({
				value: account.id,
				label: account.name,
				description: account.type.replace("_", " "),
				color: account.color || undefined,
			}));
	}, [accounts, formData.accountId]);

	// Convert tags to AutoComplete options (multi-select)
	const tagOptions = React.useMemo<AutoCompleteOption[]>(() => {
		return tags.map((tag) => ({
			value: tag.id,
			label: tag.name,
			color: tag.color || undefined,
		}));
	}, [tags]);

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && item) {
			setFormData({
				amount: item.amount.toString(),
				type: item.type,
				description: item.description || "",
				date: new Date(item.date),
				notes: item.notes || "",
				categoryId: item.categoryId || "",
				accountId: item.accountId || "",
				tagIds: item.tags?.map((t) => t.tagId) || [],
				toAccountId: "",
				transferFee: "0",
			});
		}
	}, [isEditMode, item]);

	// Reset form when dialog closes in create mode
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({
				amount: "",
				type: "EXPENSE",
				description: "",
				date: new Date(),
				notes: "",
				categoryId: "",
				accountId: "",
				tagIds: [],
				toAccountId: "",
				transferFee: "0",
			});
			setErrors({});
		}
	}, [open, isEditMode]);

	function handleChange(
		field: keyof FormData,
		value: string | Date | string[] | undefined,
	) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function validateForm(): boolean {
		try {
			if (isEditMode) {
				const updateData: UpdateTransactionInput = {};
				if (parseFloat(formData.amount) !== item?.amount)
					updateData.amount = parseFloat(formData.amount);
				if (formData.type !== item?.type)
					updateData.type = formData.type;
				if (formData.description !== (item?.description || ""))
					updateData.description = formData.description || null;
				if (formData.date !== new Date(item!.date))
					updateData.date = formData.date;
				if (formData.notes !== (item?.notes || ""))
					updateData.notes = formData.notes || null;
				if (formData.categoryId !== (item?.categoryId || ""))
					updateData.categoryId = formData.categoryId || null;
				if (formData.accountId !== (item?.accountId || ""))
					updateData.accountId = formData.accountId || null;
				if (
					JSON.stringify(formData.tagIds) !==
					JSON.stringify(item?.tags?.map((t) => t.tagId) || [])
				)
					updateData.tagIds = formData.tagIds;

				if (Object.keys(updateData).length === 0) {
					return true;
				}
				updateTransactionSchema.parse(updateData);
			} else {
				const createData: any = {
					amount: parseFloat(formData.amount),
					type: formData.type,
					description: formData.description || null,
					date: formData.date,
					notes: formData.notes || null,
					categoryId: formData.categoryId || null,
					accountId: formData.accountId || null,
					tagIds: formData.tagIds,
				};

				// Add transfer-specific fields
				if (formData.type === "TRANSFER") {
					if (!formData.toAccountId) {
						setErrors((prev) => ({
							...prev,
							toAccountId:
								"Destination account is required for transfer",
						}));
						return false;
					}
					createData.toAccountId = formData.toAccountId;
					if (parseFloat(formData.transferFee) > 0) {
						createData.transferFee = parseFloat(
							formData.transferFee,
						);
					}
				}

				createTransactionSchema.parse(createData);
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

		let result = null;

		if (isEditMode && item) {
			const updateData: UpdateTransactionInput = {};
			if (parseFloat(formData.amount) !== item.amount)
				updateData.amount = parseFloat(formData.amount);
			if (formData.type !== item.type) updateData.type = formData.type;
			if (formData.description !== (item.description || ""))
				updateData.description = formData.description || null;
			if (formData.date !== new Date(item.date))
				updateData.date = formData.date;
			if (formData.notes !== (item.notes || ""))
				updateData.notes = formData.notes || null;
			if (formData.categoryId !== (item.categoryId || ""))
				updateData.categoryId = formData.categoryId || null;
			if (formData.accountId !== (item.accountId || ""))
				updateData.accountId = formData.accountId || null;
			if (
				JSON.stringify(formData.tagIds) !==
				JSON.stringify(item.tags?.map((t) => t.tagId) || [])
			)
				updateData.tagIds = formData.tagIds;

			if (Object.keys(updateData).length === 0) {
				toast.info("No changes to save");
				setOpen(false);
				return;
			}

			result = await updateTransaction(item.id, updateData);
		} else {
			const createData: CreateTransactionInput = {
				amount: parseFloat(formData.amount),
				type: formData.type,
				description: formData.description || null,
				date: formData.date!,
				notes: formData.notes || null,
				categoryId: formData.categoryId || null,
				accountId: formData.accountId || null,
				tagIds: formData.tagIds,
			};

			// Add transfer-specific fields
			if (formData.type === "TRANSFER") {
				createData.toAccountId = formData.toAccountId;
				if (parseFloat(formData.transferFee) > 0) {
					createData.transferFee = parseFloat(formData.transferFee);
				}
			}

			result = await createTransaction(createData);
		}

		if (result) {
			toast.success(
				isEditMode
					? "Transaction updated successfully"
					: "Transaction created successfully",
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const defaultTrigger = isEditMode ? null : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Transaction
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Transaction" : "Create Transaction"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update your transaction details."
							: "Add a new income, expense, or transfer transaction."}
					</DialogDescription>
				</DialogHeader>
				<form id="transaction-form" onSubmit={handleSubmit}>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-4">
							<Field data-invalid={!!errors.amount}>
								<FieldLabel htmlFor="amount">
									Amount ($){" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="amount"
									type="number"
									min="0.01"
									step="0.01"
									value={formData.amount}
									onChange={(e) =>
										handleChange("amount", e.target.value)
									}
									placeholder="0.00"
								/>
								{errors.amount && (
									<FieldError
										errors={[{ message: errors.amount }]}
									/>
								)}
							</Field>

							<Field data-invalid={!!errors.type}>
								<FieldLabel htmlFor="type">
									Type{" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Select
									value={formData.type}
									onValueChange={(v) =>
										handleChange(
											"type",
											v as TransactionType,
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{TYPE_OPTIONS.map((opt) => (
											<SelectItem
												key={opt.value}
												value={opt.value}
											>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.type && (
									<FieldError
										errors={[{ message: errors.type }]}
									/>
								)}
							</Field>
						</div>

						<Field data-invalid={!!errors.description}>
							<FieldLabel htmlFor="description">
								Description{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="description"
								value={formData.description}
								onChange={(e) =>
									handleChange("description", e.target.value)
								}
								placeholder={
									formData.type === "TRANSFER"
										? "e.g., Transfer to Savings"
										: "e.g., Grocery shopping, Salary deposit"
								}
								autoFocus
							/>
							<FieldDescription>
								A brief description of the transaction.
							</FieldDescription>
							{errors.description && (
								<FieldError
									errors={[{ message: errors.description }]}
								/>
							)}
						</Field>

						<Field data-invalid={!!errors.date}>
							<FieldLabel htmlFor="date">
								Date <span className="text-destructive">*</span>
							</FieldLabel>
							<Popover
								open={calendarOpen}
								onOpenChange={setCalendarOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"w-full justify-start text-left font-normal",
											!formData.date &&
												"text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{formData.date
											? format(formData.date, "PPP")
											: "Pick a date"}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto p-0"
									align="start"
								>
									<Calendar
										mode="single"
										selected={formData.date}
										onSelect={(date) => {
											handleChange("date", date);
											setCalendarOpen(false);
										}}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
							{errors.date && (
								<FieldError
									errors={[{ message: errors.date }]}
								/>
							)}
						</Field>

						{/* Category - Available for ALL transaction types */}
						<Field>
							<FieldLabel>Category</FieldLabel>
							<AutoComplete
								options={categoryOptions}
								value={formData.categoryId}
								onValueChange={(value) =>
									handleChange("categoryId", value)
								}
								placeholder="Select a category..."
								searchPlaceholder="Search category..."
								emptyMessage="No category found."
								clearable={true}
								className="w-full"
							/>
							<FieldDescription>
								Link to a category for tracking
							</FieldDescription>
						</Field>

						{/* Tags - Available for ALL transaction types */}
						<Field>
							<FieldLabel>Tags</FieldLabel>
							<AutoComplete
								options={tagOptions}
								value={formData.tagIds.join(",")}
								onValueChange={(value) =>
									handleChange(
										"tagIds",
										value ? value.split(",") : [],
									)
								}
								placeholder="Select tags..."
								searchPlaceholder="Search tags..."
								emptyMessage="No tags found."
								clearable={true}
								className="w-full"
							/>
							<FieldDescription>
								Add tags to organize your transactions
							</FieldDescription>
						</Field>

						{/* Source Account - Required for all types */}
						<Field>
							<FieldLabel>
								{formData.type === "TRANSFER"
									? "From Account"
									: "Account"}
								{formData.type !== "TRANSFER" && (
									<span className="text-destructive ml-1">
										*
									</span>
								)}
							</FieldLabel>
							<AutoComplete
								options={accountOptions}
								value={formData.accountId}
								onValueChange={(value) =>
									handleChange("accountId", value)
								}
								placeholder="Select an account..."
								searchPlaceholder="Search account..."
								emptyMessage="No account found."
								clearable={true}
								className="w-full"
							/>
							<FieldDescription>
								{formData.type === "TRANSFER"
									? "Account to transfer money FROM"
									: "Which account to use for this transaction"}
							</FieldDescription>
						</Field>

						{/* Destination Account - Only for TRANSFER type */}
						{formData.type === "TRANSFER" && (
							<>
								<Field data-invalid={!!errors.toAccountId}>
									<FieldLabel>
										To Account{" "}
										<span className="text-destructive">
											*
										</span>
									</FieldLabel>
									<AutoComplete
										options={destinationAccountOptions}
										value={formData.toAccountId}
										onValueChange={(value) =>
											handleChange("toAccountId", value)
										}
										placeholder="Select destination account..."
										searchPlaceholder="Search account..."
										emptyMessage={
											formData.accountId
												? "No other accounts found"
												: "Select a source account first"
										}
										clearable={true}
										className="w-full"
									/>
									<FieldDescription>
										Account to transfer money TO
									</FieldDescription>
									{errors.toAccountId && (
										<FieldError
											errors={[
												{ message: errors.toAccountId },
											]}
										/>
									)}
								</Field>

								<Field>
									<FieldLabel>Transfer Fee</FieldLabel>
									<Input
										type="number"
										min="0"
										step="0.01"
										value={formData.transferFee}
										onChange={(e) =>
											handleChange(
												"transferFee",
												e.target.value,
											)
										}
										placeholder="0.00"
									/>
									<FieldDescription>
										Any fee charged for the transfer
										(optional)
									</FieldDescription>
									{errors.transferFee && (
										<FieldError
											errors={[
												{ message: errors.transferFee },
											]}
										/>
									)}
								</Field>
							</>
						)}

						<Field>
							<FieldLabel htmlFor="notes">Notes</FieldLabel>
							<Textarea
								id="notes"
								value={formData.notes}
								onChange={(e) =>
									handleChange("notes", e.target.value)
								}
								placeholder="Additional details..."
								rows={3}
							/>
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
						form="transaction-form"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{isEditMode ? "Save Changes" : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// components/pages/recurring/_components/recurring-form-dialog.tsx
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRecurring } from "@/components/context/recurring-context/recurring-context";
import { useCategories } from "@/components/context/categories-context/categories-context";
import { useAccounts } from "@/components/context/accounts-context/accounts-context";
import {
	createRecurringSchema,
	updateRecurringSchema,
} from "@/lib/recurring-service/validation";
import type {
	CreateRecurringInput,
	UpdateRecurringInput,
} from "@/lib/recurring-service/validation";
import type {
	RecurringTransaction,
	TransactionType,
	RecurringFrequency,
} from "@/lib/recurring-service/types";
import { ZodError } from "zod";
import {
	AutoComplete,
	type AutoCompleteOption,
} from "@/components/shared/auto-complete";

type FormData = {
	name: string;
	amount: string;
	type: TransactionType;
	frequency: RecurringFrequency;
	interval: string;
	startDate: Date | undefined;
	endDate: Date | undefined;
	description: string;
	categoryId: string;
	accountId: string;
	isActive: boolean;
};

interface FormErrors {
	name?: string;
	amount?: string;
	type?: string;
	frequency?: string;
	interval?: string;
	startDate?: string;
	endDate?: string;
	categoryId?: string;
	accountId?: string;
}

interface RecurringFormDialogProps {
	mode?: "create" | "edit";
	item?: RecurringTransaction | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
	{ value: "DAILY", label: "Daily" },
	{ value: "WEEKLY", label: "Weekly" },
	{ value: "MONTHLY", label: "Monthly" },
	{ value: "YEARLY", label: "Yearly" },
	{ value: "CUSTOM", label: "Custom" },
];

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
	{ value: "INCOME", label: "Income" },
	{ value: "EXPENSE", label: "Expense" },
	{ value: "TRANSFER", label: "Transfer" },
];

export function RecurringFormDialog({
	mode = "create",
	item = null,
	trigger,
	onSuccess,
}: RecurringFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [calendarOpen, setCalendarOpen] = React.useState(false);
	const [endDateOpen, setEndDateOpen] = React.useState(false);
	const { createRecurring, updateRecurring, isLoading } = useRecurring();
	const { categories } = useCategories();
	const { accounts } = useAccounts();
	const isEditMode = mode === "edit" && item;

	const [formData, setFormData] = React.useState<FormData>({
		name: "",
		amount: "",
		type: "EXPENSE",
		frequency: "MONTHLY",
		interval: "1",
		startDate: new Date(),
		endDate: undefined,
		description: "",
		categoryId: "",
		accountId: "",
		isActive: true,
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

	// Get selected option labels
	const selectedCategory = React.useMemo(() => {
		return categoryOptions.find((opt) => opt.value === formData.categoryId);
	}, [categoryOptions, formData.categoryId]);

	const selectedAccount = React.useMemo(() => {
		return accountOptions.find((opt) => opt.value === formData.accountId);
	}, [accountOptions, formData.accountId]);

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && item) {
			setFormData({
				name: item.name,
				amount: item.amount.toString(),
				type: item.type,
				frequency: item.frequency,
				interval: item.interval.toString(),
				startDate: new Date(item.startDate),
				endDate: item.endDate ? new Date(item.endDate) : undefined,
				description: item.description || "",
				categoryId: item.categoryId || "",
				accountId: item.accountId || "",
				isActive: item.isActive,
			});
		}
	}, [isEditMode, item]);

	// Reset form when dialog closes in create mode
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({
				name: "",
				amount: "",
				type: "EXPENSE",
				frequency: "MONTHLY",
				interval: "1",
				startDate: new Date(),
				endDate: undefined,
				description: "",
				categoryId: "",
				accountId: "",
				isActive: true,
			});
			setErrors({});
		}
	}, [open, isEditMode]);

	function handleChange(
		field: keyof FormData,
		value: string | Date | boolean | undefined,
	) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function validateForm(): boolean {
		try {
			if (isEditMode) {
				const updateData: UpdateRecurringInput = {};
				if (formData.name !== item?.name)
					updateData.name = formData.name;
				if (parseFloat(formData.amount) !== item?.amount)
					updateData.amount = parseFloat(formData.amount);
				if (formData.type !== item?.type)
					updateData.type = formData.type;
				if (formData.frequency !== item?.frequency)
					updateData.frequency = formData.frequency;
				if (parseInt(formData.interval) !== item?.interval)
					updateData.interval = parseInt(formData.interval);
				if (formData.startDate !== new Date(item!.startDate))
					updateData.startDate = formData.startDate;
				if (
					formData.endDate !==
					(item?.endDate ? new Date(item.endDate) : undefined)
				)
					updateData.endDate = formData.endDate;
				if (formData.description !== (item?.description || ""))
					updateData.description = formData.description || null;
				if (formData.categoryId !== (item?.categoryId || ""))
					updateData.categoryId = formData.categoryId || null;
				if (formData.accountId !== (item?.accountId || ""))
					updateData.accountId = formData.accountId || null;
				if (formData.isActive !== item?.isActive)
					updateData.isActive = formData.isActive;

				if (Object.keys(updateData).length === 0) {
					return true;
				}
				updateRecurringSchema.parse(updateData);
			} else {
				createRecurringSchema.parse({
					name: formData.name,
					amount: parseFloat(formData.amount),
					type: formData.type,
					frequency: formData.frequency,
					interval: parseInt(formData.interval),
					startDate: formData.startDate,
					endDate: formData.endDate || null,
					description: formData.description || null,
					categoryId: formData.categoryId || null,
					accountId: formData.accountId || null,
					isActive: formData.isActive,
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

		let result = null;

		if (isEditMode && item) {
			const updateData: UpdateRecurringInput = {};
			if (formData.name !== item.name) updateData.name = formData.name;
			if (parseFloat(formData.amount) !== item.amount)
				updateData.amount = parseFloat(formData.amount);
			if (formData.type !== item.type) updateData.type = formData.type;
			if (formData.frequency !== item.frequency)
				updateData.frequency = formData.frequency;
			if (parseInt(formData.interval) !== item.interval)
				updateData.interval = parseInt(formData.interval);
			if (formData.startDate !== new Date(item.startDate))
				updateData.startDate = formData.startDate;
			if (
				formData.endDate !==
				(item.endDate ? new Date(item.endDate) : undefined)
			)
				updateData.endDate = formData.endDate;
			if (formData.description !== (item.description || ""))
				updateData.description = formData.description || null;
			if (formData.categoryId !== (item.categoryId || ""))
				updateData.categoryId = formData.categoryId || null;
			if (formData.accountId !== (item.accountId || ""))
				updateData.accountId = formData.accountId || null;
			if (formData.isActive !== item.isActive)
				updateData.isActive = formData.isActive;

			if (Object.keys(updateData).length === 0) {
				toast.info("No changes to save");
				setOpen(false);
				return;
			}

			result = await updateRecurring(item.id, updateData);
		} else {
			const createData: CreateRecurringInput = {
				name: formData.name,
				amount: parseFloat(formData.amount),
				type: formData.type,
				frequency: formData.frequency,
				interval: parseInt(formData.interval),
				startDate: formData.startDate!,
				endDate: formData.endDate || null,
				description: formData.description || null,
				categoryId: formData.categoryId || null,
				accountId: formData.accountId || null,
				isActive: formData.isActive,
			};
			result = await createRecurring(createData);
		}

		if (result) {
			toast.success(
				isEditMode
					? "Recurring transaction updated successfully"
					: "Recurring transaction created successfully",
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const defaultTrigger = isEditMode ? null : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Recurring
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditMode
							? "Edit Recurring Transaction"
							: "Create Recurring Transaction"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update your recurring transaction details."
							: "Set up automatic recurring income or expenses."}
					</DialogDescription>
				</DialogHeader>
				<form id="recurring-form" onSubmit={handleSubmit}>
					<FieldGroup>
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
								placeholder="e.g., Monthly Rent, Netflix Subscription"
								autoFocus
							/>
							<FieldDescription>
								A descriptive name for this transaction.
							</FieldDescription>
							{errors.name && (
								<FieldError
									errors={[{ message: errors.name }]}
								/>
							)}
						</Field>

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

						<div className="grid grid-cols-2 gap-4">
							<Field data-invalid={!!errors.frequency}>
								<FieldLabel htmlFor="frequency">
									Frequency{" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Select
									value={formData.frequency}
									onValueChange={(v) =>
										handleChange(
											"frequency",
											v as RecurringFrequency,
										)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select frequency" />
									</SelectTrigger>
									<SelectContent>
										{FREQUENCY_OPTIONS.map((opt) => (
											<SelectItem
												key={opt.value}
												value={opt.value}
											>
												{opt.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.frequency && (
									<FieldError
										errors={[{ message: errors.frequency }]}
									/>
								)}
							</Field>

							<Field data-invalid={!!errors.interval}>
								<FieldLabel htmlFor="interval">
									Interval{" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Input
									id="interval"
									type="number"
									min="1"
									step="1"
									value={formData.interval}
									onChange={(e) =>
										handleChange("interval", e.target.value)
									}
								/>
								<FieldDescription>
									Every X days/weeks/months/years
								</FieldDescription>
								{errors.interval && (
									<FieldError
										errors={[{ message: errors.interval }]}
									/>
								)}
							</Field>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<Field data-invalid={!!errors.startDate}>
								<FieldLabel htmlFor="startDate">
									Start Date{" "}
									<span className="text-destructive">*</span>
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
												!formData.startDate &&
													"text-muted-foreground",
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{formData.startDate
												? format(
														formData.startDate,
														"PPP",
													)
												: "Pick a date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto p-0"
										align="start"
									>
										<Calendar
											mode="single"
											selected={formData.startDate}
											onSelect={(date) => {
												handleChange("startDate", date);
												setCalendarOpen(false);
											}}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								{errors.startDate && (
									<FieldError
										errors={[{ message: errors.startDate }]}
									/>
								)}
							</Field>

							<Field>
								<FieldLabel htmlFor="endDate">
									End Date (Optional)
								</FieldLabel>
								<Popover
									open={endDateOpen}
									onOpenChange={setEndDateOpen}
								>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!formData.endDate &&
													"text-muted-foreground",
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{formData.endDate
												? format(
														formData.endDate,
														"PPP",
													)
												: "No end date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto p-0"
										align="start"
									>
										<Calendar
											mode="single"
											selected={formData.endDate}
											onSelect={(date) => {
												handleChange("endDate", date);
												setEndDateOpen(false);
											}}
											disabled={(date) =>
												formData.startDate
													? date < formData.startDate
													: false
											}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
								<FieldDescription>
									Leave empty for no end date
								</FieldDescription>
							</Field>
						</div>

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

						<Field>
							<FieldLabel>Account</FieldLabel>
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
								Which account to use for this transaction
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel htmlFor="description">
								Description
							</FieldLabel>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									handleChange("description", e.target.value)
								}
								placeholder="Additional details..."
								rows={3}
							/>
						</Field>

						<Field>
							<div className="flex items-center justify-between">
								<div>
									<FieldLabel htmlFor="isActive">
										Active
									</FieldLabel>
									<FieldDescription>
										Enable or disable this recurring
										transaction
									</FieldDescription>
								</div>
								<Switch
									id="isActive"
									checked={formData.isActive}
									onCheckedChange={(checked) =>
										handleChange("isActive", checked)
									}
								/>
							</div>
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
						form="recurring-form"
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

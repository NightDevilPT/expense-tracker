// components/pages/budgets/_components/budgets-form-dialog.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { AutoComplete } from "@/components/shared/auto-complete";
import type { AutoCompleteOption } from "@/components/shared/auto-complete";
import { useBudgets } from "@/components/context/budgets-context/budgets-context";
import { useCategories } from "@/components/context/categories-context/categories-context";
import {
	createBudgetSchema,
	updateBudgetSchema,
} from "@/lib/budget-service/validation";
import type {
	CreateBudgetInput,
	UpdateBudgetInput,
} from "@/lib/budget-service/validation";
import type {
	BudgetWithProgress,
	BudgetPeriod,
} from "@/lib/budget-service/types";
import { ZodError } from "zod";
import { cn } from "@/lib/utils";

type FormData = {
	amount: string;
	period: BudgetPeriod;
	startDate: Date | undefined;
	endDate: Date | undefined;
	alertThreshold: string;
	rollover: boolean;
	categoryId: string;
};

interface FormErrors {
	amount?: string;
	period?: string;
	startDate?: string;
	endDate?: string;
	alertThreshold?: string;
	categoryId?: string;
}

interface BudgetFormDialogProps {
	mode?: "create" | "edit";
	item?: BudgetWithProgress | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function BudgetFormDialog({
	mode = "create",
	item = null,
	trigger,
	onSuccess,
}: BudgetFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const { createBudget, updateBudget, isLoading } = useBudgets();
	const { categories, getCategoryById } = useCategories();
	const isEditMode = mode === "edit" && item;
	const [initialCategoryOption, setInitialCategoryOption] = React.useState<
		AutoCompleteOption | undefined
	>(undefined);

	const [formData, setFormData] = React.useState<FormData>({
		amount: "",
		period: "MONTHLY",
		startDate: new Date(),
		endDate: undefined,
		alertThreshold: "80",
		rollover: false,
		categoryId: "",
	});
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && item) {
			setFormData({
				amount: item.amount.toString(),
				period: item.period,
				startDate: new Date(item.startDate),
				endDate: item.endDate ? new Date(item.endDate) : undefined,
				alertThreshold: item.alertThreshold.toString(),
				rollover: item.rollover,
				categoryId: item.categoryId || "",
			});
		}
	}, [isEditMode, item]);

	// Fetch the selected category when editing using context
	React.useEffect(() => {
		if (isEditMode && item?.categoryId) {
			getCategoryById(item.categoryId).then((category) => {
				if (category) {
					setInitialCategoryOption({
						value: category.id,
						label: category.name,
						color: category.color ?? undefined,
					});
				}
			});
		} else {
			setInitialCategoryOption(undefined);
		}
	}, [isEditMode, item?.categoryId, getCategoryById]);

	// Reset form when dialog closes (create mode only)
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({
				amount: "",
				period: "MONTHLY",
				startDate: new Date(),
				endDate: undefined,
				alertThreshold: "80",
				rollover: false,
				categoryId: "",
			});
			setErrors({});
		}
	}, [open, isEditMode]);

	function handleChange(
		field: keyof FormData,
		value: string | boolean | Date | undefined,
	) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function getCategoryIdForApi(): string | null {
		return formData.categoryId || null;
	}

	function validateForm(): boolean {
		if (!formData.startDate) return false;

		try {
			const dataToValidate = {
				amount: parseFloat(formData.amount),
				period: formData.period,
				startDate: formData.startDate,
				endDate: formData.endDate || null,
				alertThreshold: parseFloat(formData.alertThreshold),
				rollover: formData.rollover,
				categoryId: getCategoryIdForApi(),
			};

			if (isEditMode && item) {
				const updateData: Partial<typeof dataToValidate> = {};

				if (dataToValidate.amount !== item.amount)
					updateData.amount = dataToValidate.amount;
				if (dataToValidate.period !== item.period)
					updateData.period = dataToValidate.period;
				if (
					dataToValidate.startDate.toISOString() !==
					new Date(item.startDate).toISOString()
				)
					updateData.startDate = dataToValidate.startDate;
				if (dataToValidate.alertThreshold !== item.alertThreshold)
					updateData.alertThreshold = dataToValidate.alertThreshold;
				if (dataToValidate.rollover !== item.rollover)
					updateData.rollover = dataToValidate.rollover;
				if (dataToValidate.categoryId !== (item.categoryId || null))
					updateData.categoryId = dataToValidate.categoryId;

				const currentEndDate = dataToValidate.endDate;
				const existingEndDate = item.endDate
					? new Date(item.endDate)
					: null;

				if (!currentEndDate && existingEndDate) {
					updateData.endDate = null;
				} else if (currentEndDate && !existingEndDate) {
					updateData.endDate = currentEndDate;
				} else if (
					currentEndDate &&
					existingEndDate &&
					currentEndDate.toISOString() !==
						existingEndDate.toISOString()
				) {
					updateData.endDate = currentEndDate;
				}

				if (Object.keys(updateData).length === 0) {
					return true;
				}
				updateBudgetSchema.parse(updateData);
			} else {
				createBudgetSchema.parse(dataToValidate);
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
		if (!validateForm() || !formData.startDate) return;

		try {
			let result = null;

			if (isEditMode && item) {
				const updateData: UpdateBudgetInput = {};

				const formAmount = parseFloat(formData.amount);
				if (formAmount !== item.amount) updateData.amount = formAmount;

				if (formData.period !== item.period)
					updateData.period = formData.period;

				if (
					formData.startDate.toISOString() !==
					new Date(item.startDate).toISOString()
				)
					updateData.startDate = formData.startDate;

				const formAlertThreshold = parseFloat(formData.alertThreshold);
				if (formAlertThreshold !== item.alertThreshold)
					updateData.alertThreshold = formAlertThreshold;

				if (formData.rollover !== item.rollover)
					updateData.rollover = formData.rollover;

				const formCategoryId = getCategoryIdForApi();
				if (formCategoryId !== (item.categoryId || null))
					updateData.categoryId = formCategoryId;

				const formEndDate = formData.endDate || null;
				const itemEndDate = item.endDate
					? new Date(item.endDate)
					: null;

				if (formEndDate && itemEndDate) {
					if (
						formEndDate.toISOString() !== itemEndDate.toISOString()
					) {
						updateData.endDate = formEndDate;
					}
				} else if (formEndDate && !itemEndDate) {
					updateData.endDate = formEndDate;
				} else if (!formEndDate && itemEndDate) {
					updateData.endDate = null;
				}

				if (Object.keys(updateData).length === 0) {
					toast.info("No changes to save");
					setOpen(false);
					return;
				}

				result = await updateBudget(item.id, updateData);
			} else {
				const createData: CreateBudgetInput = {
					amount: parseFloat(formData.amount),
					period: formData.period,
					startDate: formData.startDate,
					endDate: formData.endDate || null,
					alertThreshold: parseFloat(formData.alertThreshold),
					rollover: formData.rollover,
					categoryId: getCategoryIdForApi(),
				};
				result = await createBudget(createData);
			}

			if (result) {
				toast.success(
					isEditMode
						? "Budget updated successfully"
						: "Budget created successfully",
				);
				setOpen(false);
				onSuccess?.();
			}
		} catch (error) {
			// Context already handles error state
		}
	}

	// Fetch categories for AutoComplete using context
	const fetchCategories = React.useCallback(
		async (query: string): Promise<AutoCompleteOption[]> => {
			// Filter from already loaded categories in context
			const expenseCategories = categories.filter(
				(cat) => cat.type === "EXPENSE",
			);

			if (!query) {
				return expenseCategories.map((cat) => ({
					value: cat.id,
					label: cat.name,
					color: cat.color ?? undefined,
				}));
			}

			const q = query.toLowerCase();
			return expenseCategories
				.filter(
					(cat) =>
						cat.name.toLowerCase().includes(q) ||
						cat.id.toLowerCase().includes(q),
				)
				.map((cat) => ({
					value: cat.id,
					label: cat.name,
					color: cat.color ?? undefined,
				}));
		},
		[categories],
	);

	const defaultTrigger = isEditMode ? null : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Budget
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Budget" : "Create Budget"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the budget allocation details."
							: "Set up a new budget to track your spending."}
					</DialogDescription>
				</DialogHeader>
				<form id="budget-form" onSubmit={handleSubmit}>
					<FieldGroup>
						{/* Amount Field */}
						<Field data-invalid={!!errors.amount}>
							<FieldLabel htmlFor="amount">
								Budget Amount{" "}
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
								Total amount allocated for this budget.
							</FieldDescription>
							{errors.amount && (
								<FieldError
									errors={[{ message: errors.amount }]}
								/>
							)}
						</Field>

						{/* Category Field — Using AutoComplete with context */}
						<Field data-invalid={!!errors.categoryId}>
							<FieldLabel htmlFor="categoryId">
								Category
							</FieldLabel>
							<AutoComplete
								name="categoryId"
								value={formData.categoryId}
								onValueChange={(value) =>
									handleChange("categoryId", value)
								}
								options={categories
									.filter((cat) => cat.type === "EXPENSE")
									.map((cat) => ({
										value: cat.id,
										label: cat.name,
										color: cat.color ?? undefined,
									}))}
								placeholder="Select a category..."
								searchPlaceholder="Search categories..."
								emptyMessage="No categories found."
								clearable
							/>
							<FieldDescription>
								Assign this budget to a specific expense
								category.
							</FieldDescription>
							{errors.categoryId && (
								<FieldError
									errors={[{ message: errors.categoryId }]}
								/>
							)}
						</Field>

						{/* Period and Alert Threshold Grid */}
						<div className="grid grid-cols-2 gap-4">
							<Field data-invalid={!!errors.period}>
								<FieldLabel htmlFor="period">
									Period{" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Select
									value={formData.period}
									onValueChange={(value) =>
										handleChange(
											"period",
											value as BudgetPeriod,
										)
									}
								>
									<SelectTrigger id="period">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="DAILY">
											Daily
										</SelectItem>
										<SelectItem value="WEEKLY">
											Weekly
										</SelectItem>
										<SelectItem value="MONTHLY">
											Monthly
										</SelectItem>
										<SelectItem value="YEARLY">
											Yearly
										</SelectItem>
									</SelectContent>
								</Select>
								<FieldDescription>
									Budget reset frequency.
								</FieldDescription>
								{errors.period && (
									<FieldError
										errors={[{ message: errors.period }]}
									/>
								)}
							</Field>

							<Field data-invalid={!!errors.alertThreshold}>
								<FieldLabel htmlFor="alertThreshold">
									Alert At (%)
								</FieldLabel>
								<Input
									id="alertThreshold"
									type="number"
									min="0"
									max="100"
									step="1"
									value={formData.alertThreshold}
									onChange={(e) =>
										handleChange(
											"alertThreshold",
											e.target.value,
										)
									}
									placeholder="80"
								/>
								<FieldDescription>
									Notify when % of budget is spent.
								</FieldDescription>
								{errors.alertThreshold && (
									<FieldError
										errors={[
											{ message: errors.alertThreshold },
										]}
									/>
								)}
							</Field>
						</div>

						{/* Date Fields with Calendar */}
						<div className="grid grid-cols-2 gap-4">
							<Field data-invalid={!!errors.startDate}>
								<FieldLabel>
									Start Date{" "}
									<span className="text-destructive">*</span>
								</FieldLabel>
								<Popover>
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
											{formData.startDate ? (
												format(
													formData.startDate,
													"PPP",
												)
											) : (
												<span>Pick a date</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto p-0"
										align="start"
									>
										<Calendar
											mode="single"
											selected={formData.startDate}
											onSelect={(date) =>
												handleChange("startDate", date)
											}
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

							<Field data-invalid={!!errors.endDate}>
								<FieldLabel>End Date</FieldLabel>
								<Popover>
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
											{formData.endDate ? (
												format(formData.endDate, "PPP")
											) : (
												<span>Pick a date</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto p-0"
										align="start"
									>
										<Calendar
											mode="single"
											selected={formData.endDate}
											onSelect={(date) =>
												handleChange("endDate", date)
											}
											initialFocus
											disabled={(date) =>
												formData.startDate
													? date < formData.startDate
													: false
											}
										/>
									</PopoverContent>
								</Popover>
								<FieldDescription>Optional.</FieldDescription>
								{errors.endDate && (
									<FieldError
										errors={[{ message: errors.endDate }]}
									/>
								)}
							</Field>
						</div>

						{/* Rollover Toggle */}
						<Field>
							<div className="flex items-center justify-between">
								<div>
									<FieldLabel
										htmlFor="rollover"
										className="mb-0"
									>
										Rollover
									</FieldLabel>
									<FieldDescription>
										Carry over unspent amount to the next
										period.
									</FieldDescription>
								</div>
								<Switch
									id="rollover"
									checked={formData.rollover}
									onCheckedChange={(checked) =>
										handleChange("rollover", checked)
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
						form="budget-form"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{isEditMode ? "Save Changes" : "Create Budget"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

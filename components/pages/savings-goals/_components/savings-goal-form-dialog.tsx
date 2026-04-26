// components/pages/savings-goals/_components/savings-goal-form-dialog.tsx
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSavingsGoals } from "@/components/context/savings-goals-context/savings-goals-context";
import { useCategories } from "@/components/context/categories-context/categories-context";
import {
	createSavingsGoalSchema,
	updateSavingsGoalSchema,
} from "@/lib/savings-goal-service/validation";
import type {
	CreateSavingsGoalInput,
	UpdateSavingsGoalInput,
} from "@/lib/savings-goal-service/validation";
import type { SavingsGoalWithProgress } from "@/lib/savings-goal-service/types";
import { ZodError } from "zod";
import {
	AutoComplete,
	type AutoCompleteOption,
} from "@/components/shared/auto-complete";

type FormData = {
	name: string;
	targetAmount: string;
	deadline: Date | undefined;
	notes: string;
	linkedCategoryId: string;
};

interface FormErrors {
	name?: string;
	targetAmount?: string;
	deadline?: string;
	notes?: string;
	linkedCategoryId?: string;
}

interface SavingsGoalFormDialogProps {
	mode?: "create" | "edit";
	item?: SavingsGoalWithProgress | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function SavingsGoalFormDialog({
	mode = "create",
	item = null,
	trigger,
	onSuccess,
}: SavingsGoalFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [calendarOpen, setCalendarOpen] = React.useState(false);
	const { createGoal, updateGoal, isLoading } = useSavingsGoals();
	const { categories } = useCategories();
	const isEditMode = mode === "edit" && item;

	const [formData, setFormData] = React.useState<FormData>({
		name: "",
		targetAmount: "",
		deadline: undefined,
		notes: "",
		linkedCategoryId: "",
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

	// Get selected category option
	const selectedCategoryOption = React.useMemo(() => {
		if (!formData.linkedCategoryId) return undefined;
		return categoryOptions.find(
			(opt) => opt.value === formData.linkedCategoryId,
		);
	}, [categoryOptions, formData.linkedCategoryId]);

	// Get minimum date for deadline (tomorrow)
	const getMinDate = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow;
	};

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && item) {
			setFormData({
				name: item.name,
				targetAmount: item.targetAmount.toString(),
				deadline: new Date(item.deadline),
				notes: item.notes || "",
				linkedCategoryId: item.linkedCategoryId || "",
			});
		}
	}, [isEditMode, item]);

	// Reset form when dialog closes in create mode
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({
				name: "",
				targetAmount: "",
				deadline: undefined,
				notes: "",
				linkedCategoryId: "",
			});
			setErrors({});
		}
	}, [open, isEditMode]);

	function handleChange(
		field: keyof FormData,
		value: string | Date | undefined,
	) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function handleCategoryChange(value: string, option?: AutoCompleteOption) {
		handleChange("linkedCategoryId", value);
	}

	function validateForm(): boolean {
		try {
			if (isEditMode) {
				const updateData: UpdateSavingsGoalInput = {};
				if (formData.name !== item?.name)
					updateData.name = formData.name;
				if (parseFloat(formData.targetAmount) !== item?.targetAmount)
					updateData.targetAmount = parseFloat(formData.targetAmount);
				if (
					formData.deadline &&
					formData.deadline !== new Date(item!.deadline)
				)
					updateData.deadline = formData.deadline;
				if (formData.notes !== (item?.notes || ""))
					updateData.notes = formData.notes || null;
				if (
					formData.linkedCategoryId !== (item?.linkedCategoryId || "")
				) {
					updateData.linkedCategoryId =
						formData.linkedCategoryId || null;
				}

				if (Object.keys(updateData).length === 0) {
					return true; // No changes
				}
				updateSavingsGoalSchema.parse(updateData);
			} else {
				createSavingsGoalSchema.parse({
					name: formData.name,
					targetAmount: parseFloat(formData.targetAmount),
					deadline: formData.deadline,
					notes: formData.notes || null,
					linkedCategoryId: formData.linkedCategoryId || null,
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
			const updateData: UpdateSavingsGoalInput = {};
			if (formData.name !== item.name) updateData.name = formData.name;
			if (parseFloat(formData.targetAmount) !== item.targetAmount)
				updateData.targetAmount = parseFloat(formData.targetAmount);
			if (
				formData.deadline &&
				formData.deadline !== new Date(item.deadline)
			)
				updateData.deadline = formData.deadline;
			if (formData.notes !== (item.notes || ""))
				updateData.notes = formData.notes || null;
			if (formData.linkedCategoryId !== (item.linkedCategoryId || "")) {
				updateData.linkedCategoryId = formData.linkedCategoryId || null;
			}

			if (Object.keys(updateData).length === 0) {
				toast.info("No changes to save");
				setOpen(false);
				return;
			}

			result = await updateGoal(item.id, updateData);
		} else {
			const createData: CreateSavingsGoalInput = {
				name: formData.name,
				targetAmount: parseFloat(formData.targetAmount),
				deadline: formData.deadline!,
				status: "ACTIVE",
				notes: formData.notes || null,
				linkedCategoryId: formData.linkedCategoryId || null,
			};
			result = await createGoal(createData);
		}

		if (result) {
			toast.success(
				isEditMode
					? "Savings goal updated successfully"
					: "Savings goal created successfully",
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const defaultTrigger = isEditMode ? null : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Goal
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditMode
							? "Edit Savings Goal"
							: "Create Savings Goal"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update your savings goal details."
							: "Set a new savings target and track your progress."}
					</DialogDescription>
				</DialogHeader>
				<form id="savings-goal-form" onSubmit={handleSubmit}>
					<FieldGroup>
						<Field data-invalid={!!errors.name}>
							<FieldLabel htmlFor="name">
								Goal Name{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									handleChange("name", e.target.value)
								}
								placeholder="e.g., Emergency Fund, New Car"
								autoFocus
							/>
							<FieldDescription>
								Give your goal a descriptive name.
							</FieldDescription>
							{errors.name && (
								<FieldError
									errors={[{ message: errors.name }]}
								/>
							)}
						</Field>

						<Field data-invalid={!!errors.targetAmount}>
							<FieldLabel htmlFor="targetAmount">
								Target Amount ($){" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="targetAmount"
								type="number"
								min="0.01"
								step="0.01"
								value={formData.targetAmount}
								onChange={(e) =>
									handleChange("targetAmount", e.target.value)
								}
								placeholder="0.00"
							/>
							<FieldDescription>
								How much do you want to save?
							</FieldDescription>
							{errors.targetAmount && (
								<FieldError
									errors={[{ message: errors.targetAmount }]}
								/>
							)}
						</Field>

						<Field data-invalid={!!errors.deadline}>
							<FieldLabel htmlFor="deadline">
								Deadline{" "}
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
											!formData.deadline &&
												"text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{formData.deadline ? (
											format(formData.deadline, "PPP")
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
										selected={formData.deadline}
										onSelect={(date) => {
											handleChange("deadline", date);
											setCalendarOpen(false);
										}}
										disabled={(date) => date < getMinDate()}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
							<FieldDescription>
								When do you want to reach your goal?
							</FieldDescription>
							{errors.deadline && (
								<FieldError
									errors={[{ message: errors.deadline }]}
								/>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor="linkedCategory">
								Linked Category
							</FieldLabel>
							<AutoComplete
								options={categoryOptions}
								value={formData.linkedCategoryId}
								onValueChange={handleCategoryChange}
								placeholder="Select a category..."
								searchPlaceholder="Search category..."
								emptyMessage="No category found."
								clearable={true}
								className="w-full"
							/>
							<FieldDescription>
								Link this goal to a spending category for
								auto-tracking.
							</FieldDescription>
						</Field>

						<Field data-invalid={!!errors.notes}>
							<FieldLabel htmlFor="notes">Notes</FieldLabel>
							<Textarea
								id="notes"
								value={formData.notes}
								onChange={(e) =>
									handleChange("notes", e.target.value)
								}
								placeholder="Any additional details..."
								rows={3}
							/>
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
						form="savings-goal-form"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{isEditMode ? "Save Changes" : "Create Goal"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

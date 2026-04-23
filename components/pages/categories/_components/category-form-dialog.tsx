// components/pages/categories/_components/category-form-dialog.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Loader2, Check, ChevronsUpDown } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useCategories } from "@/components/context/categories-context/categories-context";

import {
	createCategorySchema,
	updateCategorySchema,
} from "@/lib/category-service/validation";
import type {
	CreateCategoryInput,
	UpdateCategoryInput,
} from "@/lib/category-service/validation";
import type { Category } from "@/lib/category-service/types";
import { ZodError } from "zod";

import { ICON_OPTIONS, getIconByName, getIconOption } from "@/lib/icon-utils";

// ============================================
// TYPES
// ============================================

type CategoryFormData = CreateCategoryInput;

interface FormErrors {
	name?: string;
	type?: string;
	color?: string;
	icon?: string;
}

interface CategoryFormDialogProps {
	mode?: "create" | "edit";
	category?: Category | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

// ============================================
// FORM COMPONENT
// ============================================

export function CategoryFormDialog({
	mode = "create",
	category = null,
	trigger,
	onSuccess,
}: CategoryFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [iconSearchOpen, setIconSearchOpen] = React.useState(false);
	const { createCategory, updateCategory, isLoading } = useCategories();

	const isEditMode = mode === "edit" && category;

	// Form state
	const [formData, setFormData] = React.useState<CategoryFormData>({
		name: "",
		type: "EXPENSE",
		color: "#FF5733",
		icon: "",
		order: 0,
	});
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && category) {
			setFormData({
				name: category.name,
				type: category.type,
				color: category.color || "#71717a",
				icon: category.icon || "",
				order: category.order,
			});
		}
	}, [isEditMode, category]);

	// Get selected icon data
	const selectedIcon = formData.icon ? getIconOption(formData.icon) : null;
	const SelectedIconComponent = formData.icon
		? getIconByName(formData.icon)
		: null;

	// Handle input change
	function handleChange(field: keyof CategoryFormData, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	// Handle type selection
	function handleTypeChange(value: "INCOME" | "EXPENSE" | "TRANSFER") {
		setFormData((prev) => ({ ...prev, type: value }));
		if (errors.type) {
			setErrors((prev) => ({ ...prev, type: undefined }));
		}
	}

	// Handle icon selection
	function handleIconSelect(iconName: string) {
		setFormData((prev) => ({ ...prev, icon: iconName }));
		setIconSearchOpen(false);
		if (errors.icon) {
			setErrors((prev) => ({ ...prev, icon: undefined }));
		}
	}

	// Validate form
	function validateForm(): boolean {
		try {
			if (isEditMode) {
				updateCategorySchema.parse(formData);
			} else {
				createCategorySchema.parse(formData);
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

	// Handle submit
	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!validateForm()) return;

		let result: Category | null = null;

		if (isEditMode && category) {
			result = await updateCategory(
				category.id,
				formData as UpdateCategoryInput,
			);
		} else {
			result = await createCategory(formData);
		}

		if (result) {
			toast.success(
				isEditMode
					? `Category "${result.name}" updated successfully`
					: `Category "${result.name}" created successfully`,
			);
			resetForm();
			setOpen(false);
			onSuccess?.();
		}
	}

	// Reset form
	function resetForm() {
		setFormData({
			name: "",
			type: "EXPENSE",
			color: "#FF5733",
			icon: "",
			order: 0,
		});
		setErrors({});
	}

	// Handle cancel
	function handleCancel() {
		resetForm();
		setOpen(false);
	}

	const typeOptions = [
		{ value: "INCOME" as const, label: "Income" },
		{ value: "EXPENSE" as const, label: "Expense" },
		{ value: "TRANSFER" as const, label: "Transfer" },
	];

	const defaultTrigger = isEditMode ? (
		<Button variant="ghost" size="icon" className="h-8 w-8">
			<Plus className="h-4 w-4" />
		</Button>
	) : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Category
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Category" : "Create Category"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the category details."
							: "Add a new category to organize your transactions."}
					</DialogDescription>
				</DialogHeader>
				<form id="category-form" onSubmit={handleSubmit}>
					<FieldGroup>
						{/* Name Field */}
						<Field data-invalid={!!errors.name}>
							<FieldLabel htmlFor="category-name">
								Name
							</FieldLabel>
							<Input
								id="category-name"
								value={formData.name}
								onChange={(e) =>
									handleChange("name", e.target.value)
								}
								placeholder="e.g. Food & Dining"
								aria-invalid={!!errors.name}
								autoComplete="off"
							/>
							<FieldDescription>
								Choose a clear and descriptive name.
							</FieldDescription>
							{errors.name && (
								<FieldError
									errors={[
										{ message: errors.name } as {
											message: string;
										},
									]}
								/>
							)}
						</Field>

						{/* Type Field */}
						<Field data-invalid={!!errors.type}>
							<FieldLabel>Type</FieldLabel>
							<div className="flex gap-3">
								{typeOptions.map(({ value, label }) => (
									<Label
										key={value}
										className={`flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer transition-colors ${
											formData.type === value
												? "bg-primary text-primary-foreground border-primary"
												: "bg-background hover:bg-muted"
										}`}
									>
										<input
											type="radio"
											className="sr-only"
											name="category-type"
											checked={formData.type === value}
											onChange={() =>
												handleTypeChange(value)
											}
										/>
										{label}
									</Label>
								))}
							</div>
							<FieldDescription>
								Select the transaction type for this category.
							</FieldDescription>
							{errors.type && (
								<FieldError
									errors={[
										{ message: errors.type } as {
											message: string;
										},
									]}
								/>
							)}
						</Field>

						{/* Color Field */}
						<Field data-invalid={!!errors.color}>
							<FieldLabel htmlFor="category-color">
								Color (optional)
							</FieldLabel>
							<div className="flex items-center gap-3">
								<div className="relative">
									<div
										className="h-10 w-10 rounded-md border cursor-pointer"
										style={{
											backgroundColor:
												formData.color || "#FF5733",
										}}
										onClick={() =>
											document
												.getElementById(
													"category-color",
												)
												?.click()
										}
									/>
									<input
										id="category-color"
										type="color"
										value={formData.color || "#FF5733"}
										onChange={(e) =>
											handleChange(
												"color",
												e.target.value,
											)
										}
										className="absolute inset-0 opacity-0 cursor-pointer"
										aria-invalid={!!errors.color}
									/>
								</div>
								<Input
									value={formData.color || ""}
									onChange={(e) =>
										handleChange("color", e.target.value)
									}
									placeholder="#FF5733"
									className="flex-1 font-mono"
									aria-invalid={!!errors.color}
									autoComplete="off"
								/>
							</div>
							<FieldDescription>
								Pick a color or enter a hex code.
							</FieldDescription>
							{errors.color && (
								<FieldError
									errors={[
										{ message: errors.color } as {
											message: string;
										},
									]}
								/>
							)}
						</Field>

						{/* Icon Field */}
						<Field data-invalid={!!errors.icon}>
							<FieldLabel>Icon (optional)</FieldLabel>
							<Popover
								open={iconSearchOpen}
								onOpenChange={setIconSearchOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										role="combobox"
										aria-expanded={iconSearchOpen}
										className="w-full justify-between"
									>
										{selectedIcon ? (
											<span className="flex items-center gap-2">
												{SelectedIconComponent && (
													<SelectedIconComponent className="h-4 w-4" />
												)}
												{selectedIcon.label}
											</span>
										) : (
											<span className="text-muted-foreground">
												Select an icon...
											</span>
										)}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-[--radix-popover-trigger-width] p-0"
									align="start"
								>
									<Command>
										<CommandInput placeholder="Search icons..." />
										<CommandList>
											<CommandEmpty>
												No icon found.
											</CommandEmpty>
											<CommandGroup className="overflow-auto">
												{ICON_OPTIONS.map((icon) => {
													const IconComponent =
														getIconByName(
															icon.value,
														);
													return (
														<CommandItem
															key={icon.value}
															value={icon.value}
															className={`!bg-transparent hover:!bg-secondary ${icon.value===selectedIcon?.value && "!bg-secondary"}`}
															onSelect={() =>
																handleIconSelect(
																	icon.value,
																)
															}
														>
															<IconComponent className="h-4 w-4 mr-2" />
															{icon.label}
															{formData.icon ===
																icon.value && (
																<Check className="ml-auto h-4 w-4" />
															)}
														</CommandItem>
													);
												})}
											</CommandGroup>
										</CommandList>
									</Command>
								</PopoverContent>
							</Popover>
							<FieldDescription>
								Choose an icon to represent this category.
							</FieldDescription>
							{errors.icon && (
								<FieldError
									errors={[
										{ message: errors.icon } as {
											message: string;
										},
									]}
								/>
							)}
						</Field>
					</FieldGroup>
				</form>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={handleCancel}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="category-form"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{isEditMode ? "Save Changes" : "Create Category"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

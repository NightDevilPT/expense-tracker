// components/pages/tags/_components/tags-form-dialog.tsx
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
import { useTags } from "@/components/context/tags-context/tags-context";
import {
	createTagSchema,
	updateTagSchema,
	type CreateTagInput,
	type UpdateTagInput,
} from "@/lib/tag-service/validation";
import type { Tag, TagWithCount } from "@/lib/tag-service/types";
import { ZodError } from "zod";

type FormData = {
	name: string;
	color?: string;
};

interface FormErrors {
	name?: string;
	color?: string;
}

interface TagsFormDialogProps {
	mode?: "create" | "edit";
	item?: Tag | TagWithCount | null;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

// Predefined colors for quick selection
const PREDEFINED_COLORS = [
	"#FF5733", // Red-Orange
	"#33FF57", // Green
	"#3357FF", // Blue
	"#F333FF", // Purple
	"#FFD733", // Yellow
	"#FF33A8", // Pink
	"#33FFF5", // Cyan
	"#FF8C33", // Orange
	"#8C33FF", // Violet
	"#33FF8C", // Mint
];

export function TagsFormDialog({
	mode = "create",
	item = null,
	trigger,
	onSuccess,
}: TagsFormDialogProps) {
	const [open, setOpen] = React.useState(false);
	const { createTag, updateTag, isLoading } = useTags();
	const isEditMode = mode === "edit" && item;

	const [formData, setFormData] = React.useState<FormData>({
		name: "",
		color: "#FF5733", // Default color
	});
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Populate form when editing
	React.useEffect(() => {
		if (isEditMode && item) {
			setFormData({
				name: item.name,
				color: item.color || "#FF5733",
			});
		}
	}, [isEditMode, item]);

	// Reset form when dialog opens/closes
	React.useEffect(() => {
		if (!open && !isEditMode) {
			setFormData({ name: "", color: "#FF5733" });
			setErrors({});
		}
	}, [open, isEditMode]);

	function handleChange(field: keyof FormData, value: string) {
		setFormData((prev) => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	}

	function validateForm(): boolean {
		try {
			if (isEditMode) {
				// For edit, only validate fields that are present
				const updateData: Partial<FormData> = {};
				if (formData.name !== item?.name)
					updateData.name = formData.name;
				if (formData.color !== item?.color)
					updateData.color = formData.color;

				if (Object.keys(updateData).length === 0) {
					// No changes
					return true;
				}
				updateTagSchema.parse(updateData);
			} else {
				createTagSchema.parse(formData);
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

		let result: Tag | null = null;

		if (isEditMode && item) {
			// Only send fields that changed
			const updateData: UpdateTagInput = {};
			if (formData.name !== item.name) updateData.name = formData.name;
			if (formData.color !== item.color)
				updateData.color = formData.color;

			if (Object.keys(updateData).length === 0) {
				toast.info("No changes to save");
				setOpen(false);
				return;
			}

			result = await updateTag(item.id, updateData);
		} else {
			result = await createTag(formData);
		}

		if (result) {
			toast.success(
				isEditMode
					? "Tag updated successfully"
					: "Tag created successfully",
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const defaultTrigger = isEditMode ? null : (
		<Button>
			<Plus className="h-4 w-4 mr-2" />
			New Tag
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditMode ? "Edit Tag" : "Create New Tag"}
					</DialogTitle>
					<DialogDescription>
						{isEditMode
							? "Update the tag name or color."
							: "Add a new tag to organize your transactions."}
					</DialogDescription>
				</DialogHeader>
				<form id="tags-form" onSubmit={handleSubmit}>
					<FieldGroup>
						<Field data-invalid={!!errors.name}>
							<FieldLabel htmlFor="name">
								Tag Name{" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									handleChange("name", e.target.value)
								}
								placeholder="e.g., Food, Rent, Entertainment"
								autoFocus
							/>
							<FieldDescription>
								Tag names should be unique and descriptive.
							</FieldDescription>
							{errors.name && (
								<FieldError
									errors={[{ message: errors.name }]}
								/>
							)}
						</Field>

						<Field data-invalid={!!errors.color}>
							<FieldLabel htmlFor="color">Color</FieldLabel>
							<div className="space-y-3">
								<div className="flex items-center gap-2">
									<Input
										id="color"
										type="color"
										value={formData.color}
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
										placeholder="#FF5733"
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
								Choose a color to make this tag easily
								recognizable.
							</FieldDescription>
							{errors.color && (
								<FieldError
									errors={[{ message: errors.color }]}
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
					<Button type="submit" form="tags-form" disabled={isLoading}>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						{isEditMode ? "Save Changes" : "Create Tag"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

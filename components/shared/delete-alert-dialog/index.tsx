// components/shared/delete-alert-dialog/index.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

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

interface DeleteAlertDialogProps {
	title?: string;
	description?: string;
	itemName?: string;
	itemType?: string;
	onDelete: () => Promise<boolean>;
	onSuccess?: () => void;
	trigger?: React.ReactNode;
	isLoading?: boolean;
}

export function DeleteAlertDialog({
	title = "Delete Item",
	description,
	itemName,
	itemType = "item",
	onDelete,
	onSuccess,
	trigger,
	isLoading = false,
}: DeleteAlertDialogProps) {
	const [open, setOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	const defaultDescription = description || (
		<>
			Are you sure you want to delete{" "}
			{itemName ? (
				<span className="font-semibold">{itemName}</span>
			) : (
				`this ${itemType}`
			)}
			? This action cannot be undone.
		</>
	);

	async function handleDelete() {
		setIsDeleting(true);
		try {
			const success = await onDelete();

			if (success) {
				toast.success(
					itemName
						? `"${itemName}" deleted successfully`
						: `${itemType} deleted successfully`,
				);
				setOpen(false);
				// ✅ Call onSuccess callback after successful delete
				onSuccess?.();
			} else {
				toast.error(
					`Failed to delete ${itemName || itemType}. It may have existing dependencies.`,
				);
			}
		} catch {
			toast.error("An unexpected error occurred. Please try again.");
		} finally {
			setIsDeleting(false);
		}
	}

	const isProcessing = isDeleting || isLoading;

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="ghost" size="icon" className="h-8 w-8">
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
						<AlertTriangle className="h-6 w-6 text-destructive" />
					</div>
					<DialogTitle className="text-center">{title}</DialogTitle>
					<DialogDescription className="text-center">
						{defaultDescription}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="flex gap-2 sm:justify-center">
					<Button
						type="button"
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isProcessing}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleDelete}
						disabled={isProcessing}
					>
						{isProcessing && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

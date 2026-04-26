// components/pages/savings-goals/_components/contribute-dialog.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { PiggyBank, Loader2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { useSavingsGoals } from "@/components/context/savings-goals-context/savings-goals-context";
import { contributeToGoalSchema } from "@/lib/savings-goal-service/validation";
import type { ContributeToGoalInput } from "@/lib/savings-goal-service/validation";
import type { SavingsGoalWithProgress } from "@/lib/savings-goal-service/types";
import { ZodError } from "zod";

interface FormErrors {
	amount?: string;
	notes?: string;
}

interface ContributeDialogProps {
	goal: SavingsGoalWithProgress;
	trigger?: React.ReactNode;
	onSuccess?: () => void;
}

export function ContributeDialog({
	goal,
	trigger,
	onSuccess,
}: ContributeDialogProps) {
	const [open, setOpen] = React.useState(false);
	const { contributeToGoal, isLoading } = useSavingsGoals();

	const [amount, setAmount] = React.useState("");
	const [notes, setNotes] = React.useState("");
	const [errors, setErrors] = React.useState<FormErrors>({});

	// Reset form when dialog opens/closes
	React.useEffect(() => {
		if (!open) {
			setAmount("");
			setNotes("");
			setErrors({});
		}
	}, [open]);

	function validateForm(): boolean {
		try {
			contributeToGoalSchema.parse({
				amount: parseFloat(amount),
				notes: notes || undefined,
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

		const contributionData: ContributeToGoalInput = {
			amount: parseFloat(amount),
			notes: notes || undefined,
		};

		const result = await contributeToGoal(goal.id, contributionData);

		if (result) {
			toast.success(
				`Contributed $${contributionData.amount.toLocaleString()} to "${goal.name}"`,
			);
			setOpen(false);
			onSuccess?.();
		}
	}

	const remaining = goal.targetAmount - goal.currentAmount;
	const suggestedAmount = Math.min(
		goal.suggestedMonthlyContribution,
		remaining,
	);

	const defaultTrigger = trigger || (
		<Button variant="outline" size="sm">
			<PiggyBank className="h-4 w-4 mr-2" />
			Contribute
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Contribute to Goal</DialogTitle>
					<DialogDescription>
						Add funds to "{goal.name}"
					</DialogDescription>
				</DialogHeader>

				{/* Goal Progress Summary */}
				<div className="bg-muted/50 rounded-lg p-4 space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							Current Progress
						</span>
						<span className="font-medium">
							{goal.progress.toFixed(1)}%
						</span>
					</div>
					<Progress value={goal.progress} className="h-2" />
					<div className="flex justify-between text-xs text-muted-foreground">
						<span>
							${goal.currentAmount.toLocaleString()} saved
						</span>
						<span>${goal.targetAmount.toLocaleString()} goal</span>
					</div>
					{remaining > 0 && (
						<p className="text-xs text-muted-foreground">
							Remaining: ${remaining.toLocaleString()}
						</p>
					)}
				</div>

				<form id="contribute-form" onSubmit={handleSubmit}>
					<FieldGroup>
						<Field data-invalid={!!errors.amount}>
							<FieldLabel htmlFor="amount">
								Contribution Amount ($){" "}
								<span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="amount"
								type="number"
								min="0.01"
								step="0.01"
								max={remaining}
								value={amount}
								onChange={(e) => {
									setAmount(e.target.value);
									if (errors.amount) {
										setErrors((prev) => ({
											...prev,
											amount: undefined,
										}));
									}
								}}
								placeholder="0.00"
								autoFocus
							/>
							<div className="flex gap-2 mt-1">
								{suggestedAmount > 0 && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											setAmount(
												suggestedAmount.toFixed(2),
											)
										}
									>
										Suggested: ${suggestedAmount.toFixed(2)}
									</Button>
								)}
								{remaining > 0 && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											setAmount(remaining.toFixed(2))
										}
									>
										Complete: ${remaining.toFixed(2)}
									</Button>
								)}
							</div>
							{errors.amount && (
								<FieldError
									errors={[{ message: errors.amount }]}
								/>
							)}
						</Field>

						<Field>
							<FieldLabel htmlFor="notes">
								Notes (Optional)
							</FieldLabel>
							<Textarea
								id="notes"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="e.g., Monthly contribution"
								rows={2}
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
						form="contribute-form"
						disabled={isLoading}
					>
						{isLoading && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						Contribute
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

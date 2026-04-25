// prisma/seed/db-source/notifications.ts

import { NotificationStatus, NotificationType } from "@/generated/prisma/enums";
import { randomItem, randomBool } from "../utils";
import { PrismaClient } from "@/generated/prisma/client";

const NOTIFICATION_TEMPLATES: {
	title: string;
	message: string;
	type: NotificationType;
}[] = [
	{
		title: "Budget Alert",
		message: "You've used 80% of your Food & Dining budget.",
		type: "BUDGET_ALERT",
	},
	{
		title: "Goal Milestone",
		message: "You've reached 50% of your Emergency Fund goal!",
		type: "GOAL_MILESTONE",
	},
	{
		title: "Recurring Reminder",
		message: "Your Netflix subscription is due tomorrow.",
		type: "RECURRING_REMINDER",
	},
	{
		title: "System Notice",
		message: "Your account was accessed from a new device.",
		type: "SYSTEM",
	},
	{
		title: "Budget Alert",
		message: "Transportation budget exceeded by ₹500.",
		type: "BUDGET_ALERT",
	},
	{
		title: "Goal Milestone",
		message: "Congratulations! Vacation fund goal completed.",
		type: "GOAL_MILESTONE",
	},
	{
		title: "Recurring Reminder",
		message: "Gym membership payment due in 3 days.",
		type: "RECURRING_REMINDER",
	},
];

const STATUSES: NotificationStatus[] = ["UNREAD", "READ", "ARCHIVED"];

export async function seedNotifications(
	prisma: PrismaClient,
	userId: string,
): Promise<void> {
	for (const tmpl of NOTIFICATION_TEMPLATES) {
		const status = randomItem(STATUSES);
		await prisma.notification.create({
			data: {
				title: tmpl.title,
				message: tmpl.message,
				type: tmpl.type,
				status,
				readAt: status === "READ" ? new Date() : null,
				metadata: {},
				userId,
			},
		});
	}
}

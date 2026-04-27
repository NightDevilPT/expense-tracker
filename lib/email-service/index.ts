// lib/email-service/index.ts

import nodemailer from "nodemailer";
import { EmailTemplate } from "./types";
import type { EmailSendResult } from "./types";
import { Logger } from "@/lib/logger-service";
import { templateRegistry, type TemplatePayloadMap } from "./template";
import type { Transporter } from "nodemailer";

const logger = new Logger("EMAIL-SERVICE");

// Email provider configuration
const emailConfig = {
	host: "smtp.gmail.com",
	port: 587,
	secure: false,
	auth: {
		user: process.env.EMAIL_USER || "",
		pass: process.env.EMAIL_PASSWORD || "",
	},
};

// Create transporter once (reuse)
const transporter: Transporter = nodemailer.createTransport(emailConfig);

/**
 * Verify transporter connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
	try {
		await transporter.verify();
		logger.info("Email transporter verified successfully");
		return true;
	} catch (error) {
		logger.error("Email transporter verification failed", error);
		return false;
	}
}

/**
 * Core function to send email
 * Gets provider, sends mail, nothing else
 * Type dynamically inferred from template enum using TemplatePayloadMap
 */
export async function sendEmail<T extends EmailTemplate>(
	templateName: T,
	data: TemplatePayloadMap[T],
): Promise<EmailSendResult> {
	const startTime = Date.now();

	try {
		logger.info("Sending email", {
			template: templateName,
			to: data.to,
		});

		// Get template from registry
		const template = templateRegistry[templateName];

		if (!template) {
			throw new Error(`Template not found: ${templateName}`);
		}

		// Render HTML from template
		const htmlContent = template.render(data);

		// Send mail using provider
		const info = await transporter.sendMail({
			from: `"Budget Tracker" <${emailConfig.auth.user}>`,
			to: data.to,
			subject: data.subject,
			html: htmlContent,
		});

		const duration = Date.now() - startTime;
		logger.info("Email sent successfully", {
			template: templateName,
			messageId: info.messageId,
			duration: `${duration}ms`,
		});

		return {
			success: true,
			messageId: info.messageId,
		};
	} catch (error: unknown) {
		const duration = Date.now() - startTime;
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		logger.error("Failed to send email", {
			template: templateName,
			error: errorMessage,
			duration: `${duration}ms`,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
}

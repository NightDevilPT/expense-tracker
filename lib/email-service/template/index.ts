// lib/email-service/template/index.ts

import { EmailTemplate } from "../types";
import type { OtpEmailPayload, BaseEmailPayload } from "../types";
import { otpMailTemplate } from "./otp-mail";

/**
 * Type for template render function
 */
type TemplateRenderFunction<T extends BaseEmailPayload> = (data: T) => string;

/**
 * Template registry entry type
 */
interface TemplateRegistryEntry<T extends BaseEmailPayload> {
	payloadType: T;
	render: TemplateRenderFunction<T>;
}

/**
 * Template Registry
 * Maps template enum to its payload type and render function
 *
 * To add a new template:
 * 1. Create template file in this folder
 * 2. Add enum value in types.ts
 * 3. Add payload type in types.ts
 * 4. Add entry here following the same pattern
 */
export const templateRegistry: Record<
	EmailTemplate,
	TemplateRegistryEntry<any>
> = {
	[EmailTemplate.OTP_MAIL]: {
		payloadType: {} as OtpEmailPayload,
		render: otpMailTemplate,
	},
	// Future templates:
	// [EmailTemplate.WELCOME_MAIL]: {
	//   payloadType: {} as WelcomeEmailPayload,
	//   render: welcomeMailTemplate,
	// },
};

/**
 * Type map to extract payload type from template enum
 * Add new mappings here when adding templates
 */
export type TemplatePayloadMap = {
	[EmailTemplate.OTP_MAIL]: OtpEmailPayload;
	// [EmailTemplate.WELCOME_MAIL]: WelcomeEmailPayload;
	// [EmailTemplate.TRANSACTION_ADDED]: TransactionAddedEmailPayload;
};

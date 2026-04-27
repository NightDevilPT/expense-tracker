// lib/email-service/template/otp-mail.ts

import type { OtpEmailPayload } from "../types";
import { components } from "./common";

export function otpMailTemplate(data: OtpEmailPayload): string {
	const content = `
    ${components.greeting(data.userName)}
    ${components.text("Use the verification code below to sign in to your account. This code is valid for a single use.")}
    ${components.codeBox(data.otp, "Verification Code")}
    ${components.mutedText("This code will expire in <strong>" + data.expiryMinutes + " minutes</strong>. If you didn't request this code, you can safely ignore this email.")}
  `;

	return components.wrapper(content);
}

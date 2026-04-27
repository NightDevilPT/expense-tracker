// lib/email-service/template/common.ts

/**
 * Clean, minimal email components using Expense Tracker theme
 * No icons, no emojis - professional typography only
 */

const theme = {
	background: "#ffffff",
	foreground: "#1a1a1a",
	primaryForeground: "#fafafa",
	secondary: "#f5f5f5",
	mutedForeground: "#737373",
	border: "#e5e5e5",
	success: "#22c55e",
	warning: "#f59e0b",
	info: "#3b82f6",
	destructive: "#ef4444",
} as const;

const fonts = {
	primary:
		"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
	mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Courier New', monospace",
} as const;

export const components = {
	/**
	 * App name header - clean text only
	 */
	logo: (): string => `
    <div style="text-align: center; padding: 24px 0 8px 0;">
      <p style="margin: 0; font-size: 18px; font-weight: 600; color: ${theme.foreground}; letter-spacing: -0.3px;">Expense Tracker</p>
    </div>
  `,

	/**
	 * Greeting
	 */
	greeting: (userName: string): string => `
    <p style="margin: 0 0 24px 0; font-size: 20px; font-weight: 600; color: ${theme.foreground}; letter-spacing: -0.3px; line-height: 1.4;">
      Hi ${userName},
    </p>
  `,

	/**
	 * Body text
	 */
	text: (content: string): string => `
    <p style="margin: 0 0 16px 0; font-size: 15px; color: #525252; line-height: 1.6;">
      ${content}
    </p>
  `,

	/**
	 * Muted text
	 */
	mutedText: (content: string): string => `
    <p style="margin: 0; font-size: 13px; color: ${theme.mutedForeground}; line-height: 1.5;">
      ${content}
    </p>
  `,

	/**
	 * Section heading
	 */
	heading: (text: string): string => `
    <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${theme.foreground}; letter-spacing: -0.2px;">
      ${text}
    </h3>
  `,

	/**
	 * Primary button
	 */
	button: (text: string, url: string): string => `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" style="display: inline-block; background: ${theme.foreground}; color: ${theme.primaryForeground}; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: -0.2px;">
        ${text}
      </a>
    </div>
  `,

	/**
	 * Info callout
	 */
	infoBox: (message: string): string => `
    <div style="background: #f8f9fa; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
      <p style="margin: 0; font-size: 13px; color: ${theme.mutedForeground}; line-height: 1.5;">${message}</p>
    </div>
  `,

	/**
	 * Card container
	 */
	card: (content: string): string => `
    <div style="background: ${theme.background}; border: 1px solid ${theme.border}; border-radius: 12px; padding: 28px; margin: 16px 0;">
      ${content}
    </div>
  `,

	/**
	 * Detail row
	 */
	detailRow: (label: string, value: string): string => `
    <div style="padding: 10px 0; border-bottom: 1px solid ${theme.border};">
      <span style="font-size: 13px; color: ${theme.mutedForeground};">${label}</span>
      <span style="font-size: 14px; color: ${theme.foreground}; font-weight: 500; float: right;">${value}</span>
      <div style="clear: both;"></div>
    </div>
  `,

	/**
	 * Detail group
	 */
	detailGroup: (details: Array<{ label: string; value: string }>): string => `
    <div style="background: ${theme.secondary}; border-radius: 8px; padding: 4px 16px; margin: 20px 0;">
      ${details.map((d) => components.detailRow(d.label, d.value)).join("")}
    </div>
  `,

	/**
	 * Divider
	 */
	divider: (): string => `
    <hr style="border: none; border-top: 1px solid ${theme.border}; margin: 0;">
  `,

	/**
	 * Code display - clean centered boxes
	 */
	codeBox: (code: string, label?: string): string => `
    <div style="text-align: center; margin: 32px 0;">
      ${label ? `<p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 500; color: ${theme.mutedForeground}; text-transform: uppercase; letter-spacing: 1.5px;">${label}</p>` : ""}
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
        <tr>
          ${code
				.split("")
				.map(
					(digit) => `
            <td style="padding: 0 5px;">
              <div style="
                background: ${theme.secondary};
                border: 1px solid ${theme.border};
                border-radius: 8px;
                width: 44px;
                height: 52px;
                text-align: center;
                line-height: 52px;
                font-size: 22px;
                font-weight: 600;
                color: ${theme.foreground};
                font-family: ${fonts.mono};
              ">${digit}</div>
            </td>
          `,
				)
				.join("")}
        </tr>
      </table>
    </div>
  `,

	/**
	 * Footer
	 */
	footer: (): string => `
    <div style="text-align: center; padding: 8px 0;">
      <p style="margin: 0 0 2px 0; font-size: 12px; color: ${theme.mutedForeground};">
        Expense Tracker
      </p>
      <p style="margin: 0; font-size: 11px; color: ${theme.mutedForeground};">
        This is an automated message. Please do not reply.
      </p>
    </div>
  `,

	/**
	 * Full email wrapper
	 */
	wrapper: (content: string): string => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background-color: ${theme.secondary}; font-family: ${fonts.primary};">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding: 40px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: ${theme.background}; border: 1px solid ${theme.border}; border-radius: 12px;">
              
              <!-- Logo -->
              <tr>
                <td style="padding: 32px 40px 0 40px;">
                  ${components.logo()}
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 20px 40px 0 40px;">
                  ${components.divider()}
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 24px 40px;">
                  ${content}
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 40px;">
                  ${components.divider()}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 28px 40px;">
                  ${components.footer()}
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
} as const;

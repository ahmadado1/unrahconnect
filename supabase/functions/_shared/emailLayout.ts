/** Shared UmrahConnect transactional email layout (Resend HTML). */

export const BRAND = {
  navy: "#1E3A5F",
  navyDark: "#152A45",
  gold: "#C9A84C",
  goldSoft: "#E8D5A3",
  cream: "#F7F5F0",
  white: "#FFFFFF",
  text: "#1A2332",
  muted: "#5C6B7A",
  border: "#E2E8F0",
  success: "#1B7A4E",
}

/** Public logo URL (jsDelivr CDN over GitHub main). */
export const LOGO_URL =
  "https://cdn.jsdelivr.net/gh/ahmadado1/unrahconnect@main/assets/images/logo.jpg"

export const SITE_URL = "https://myumrahconnect.com"
export const INFO_EMAIL = "info@myumrahconnect.com"
export const SUPPORT_EMAIL = "support@myumrahconnect.com"
export const FROM_EMAIL = "UmrahConnect <noreply@myumrahconnect.com>"

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

type WrapOptions = {
  preheader?: string
  title?: string
}

/**
 * Professional email shell: navy header + logo, white content card, brand footer.
 */
export function wrapEmail(bodyHtml: string, options: WrapOptions = {}): string {
  const preheader = escapeHtml(options.preheader || "")
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(options.title || "UmrahConnect")}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream};-webkit-font-smoothing:antialiased;">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.white};border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(30,58,95,0.10);">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND.navy};padding:28px 32px 24px;text-align:center;">
              <img src="${LOGO_URL}" alt="UmrahConnect" width="88" height="88" style="display:block;margin:0 auto 14px;border-radius:16px;border:1px solid rgba(201,168,76,0.35);" />
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.5px;color:${BRAND.white};font-weight:700;">UmrahConnect</div>
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.goldSoft};margin-top:6px;letter-spacing:0.4px;">Your Umrah &amp; Hajj companion</div>
              <div style="height:3px;width:56px;background:${BRAND.gold};margin:18px auto 0;border-radius:2px;"></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F1F4F8;padding:24px 32px;border-top:1px solid ${BRAND.border};text-align:center;">
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.navy};font-weight:600;">UmrahConnect</p>
              <p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted};line-height:1.5;">
                Supporting pilgrims with guides, prayer times, Quran, and trusted services.
              </p>
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;">
                <a href="mailto:${INFO_EMAIL}" style="color:${BRAND.navy};text-decoration:none;font-weight:600;">${INFO_EMAIL}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND.navy};text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;">
                <a href="${SITE_URL}" style="color:${BRAND.navy};text-decoration:none;font-weight:600;">myumrahconnect.com</a>
              </p>
              <p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#8A97A5;">
                © ${year} UmrahConnect. All rights reserved.<br />
                This is an automated message related to your UmrahConnect account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function detailRow(label: string, value: string, opts?: { last?: boolean; emphasis?: boolean }) {
  const border = opts?.last ? "none" : `1px solid ${BRAND.border}`
  const valueColor = opts?.emphasis ? BRAND.gold : BRAND.text
  const valueWeight = opts?.emphasis ? "700" : "600"
  return `<tr>
  <td style="padding:12px 0;border-bottom:${border};font-size:13px;color:${BRAND.muted};width:40%;">${escapeHtml(label)}</td>
  <td style="padding:12px 0;border-bottom:${border};font-size:13px;color:${valueColor};font-weight:${valueWeight};text-align:right;">${escapeHtml(value)}</td>
</tr>`
}

export function ctaButton(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">
  <tr>
    <td style="background:${BRAND.gold};border-radius:28px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:${BRAND.navy};text-decoration:none;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`
}

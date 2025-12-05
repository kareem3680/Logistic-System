import dotenv from "dotenv";
import axios from "axios";
dotenv.config({ path: "config.env", quiet: true });

/**
 * Email Utility (Brevo API Edition)
 * ✅ Works on Render Free plan (no SMTP)
 * ✅ Same structure / style as your old version
 * ✅ Keeps your HTML template & escape safety
 */

/* ------------------------- Config / Helpers ------------------------- */

const env = {
  apiKey: process.env.BREVO_API_KEY,
  from: process.env.EMAIL_FROM || "noreply@stylesdispatch.com",
  brand: process.env.EMAIL_BRAND_NAME || "Styles Dispatch",
};

// Basic HTML escaping for safe text insertion
function escapeHtml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ------------------------- HTML Template ------------------------- */

function buildHtml({ message, title = env.brand }) {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0; padding:0; background:#f4f6f8; }
    .wrapper { width:100%; padding:24px 0; }
    .card { max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.06); overflow:hidden; }
    .header { background: linear-gradient(90deg,#0ea5a4,#06b6d4); color:#fff; padding:18px 24px; font-size:20px; }
    .body { padding:24px; color:#111827; line-height:1.6; font-size:15px; }
    .footer { padding:16px 24px; font-size:13px; color:#6b7280; background:#fbfdff; text-align:center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">${escapeHtml(title)}</div>
      <div class="body">
        ${safeMessage}
      </div>
      <div class="footer">
        This email was sent by ${escapeHtml(
          title
        )}. If you didn’t expect this message, please ignore it.
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* ------------------------- sendEmail Function ------------------------- */

const sendEmail = async (options = {}) => {
  const { email, subject, message, html, from } = options;

  if (!email) throw new Error("sendEmail: 'email' is required");
  if (!subject) throw new Error("sendEmail: 'subject' is required");
  if (!message && !html)
    throw new Error("sendEmail: 'message' or 'html' is required");

  const htmlContent =
    html ||
    buildHtml({
      message,
      title: env.brand,
    });

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: from || env.from, name: env.brand },
        to: [{ email }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "api-key": env.apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Email sent to ${email}`);
    return response.data;
  } catch (err) {
    console.error(
      "🛑 Email sending failed:",
      err?.response?.data || err.message
    );
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;

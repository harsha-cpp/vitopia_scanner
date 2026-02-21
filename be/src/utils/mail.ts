import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import * as ordersRepo from "../db/orders.js";
import { generateQRCode } from "./qr-code.js";
import { generateStyledQRImage } from "./qr-image.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
  }
  return _resend;
}

const FROM_EMAIL = process.env.MAIL_FROM || "VITopia '26 <tickets@vitap.ac.in>";

export interface TicketEmailData {
  name: string;
  orderId: string;
  eventName: string;
  quantity: number;
  date: string;
  venue: string;
  email: string;
}

export function buildEmailHtml(data: TicketEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Inter',sans-serif;color:#ffffff;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050505;padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card — frosted glass -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:28px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);">
          
          <!-- Branding Header -->
          <tr>
            <td style="padding:48px 40px 32px;text-align:center;background:linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%);">
              <img src="cid:logo" alt="VITopia '26" style="width:170px;height:auto;display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Hero Section — glass panel -->
          <tr>
            <td style="padding:0 40px 32px;">
              <div style="text-align:center;padding:44px 32px;background:linear-gradient(145deg, rgba(154,230,0,0.08) 0%, rgba(154,230,0,0.02) 50%, rgba(255,255,255,0.03) 100%);border:1px solid rgba(154,230,0,0.2);border-radius:24px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3);">
                <h2 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;text-transform:uppercase;">Confirmed, ${data.name.split(' ')[0]}.</h2>
                <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.6;max-width:320px;margin-left:auto;margin-right:auto;">Your access is secured. Show this QR at entry.</p>
              </div>
            </td>
          </tr>

          <!-- Ticket Information — glass card -->
          <tr>
            <td style="padding:0 40px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.07);border-radius:20px;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);">
                <!-- Event Details Header -->
                <tr>
                  <td style="padding:28px 28px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <span style="display:block;color:rgba(255,255,255,0.35);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Accessing Event</span>
                    <h3 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${data.eventName}</h3>
                  </td>
                </tr>
                
                <!-- Meta Grid -->
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="55%" style="padding-bottom:24px;">
                          <span style="display:block;color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Date &amp; Time</span>
                          <span style="display:block;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">${data.date}</span>
                        </td>
                        <td width="45%" style="padding-bottom:24px;">
                          <span style="display:block;color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Venue</span>
                          <span style="display:block;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">${data.venue}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:8px;">
                          <span style="display:block;color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Attendee</span>
                          <span style="display:block;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">${data.name}</span>
                          <span style="display:block;color:rgba(255,255,255,0.4);font-size:12px;">${data.email}</span>
                        </td>
                        <td style="padding-bottom:8px;">
                          <span style="display:block;color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Tickets</span>
                          <span style="display:block;color:rgba(255,255,255,0.9);font-size:15px;font-weight:600;">${data.quantity} Entry Pass${data.quantity > 1 ? 'es' : ''}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- QR Section — clean white -->
                <tr>
                  <td style="padding:32px;background-color:#ffffff;text-align:center;border-radius:0 0 19px 19px;">
                    <img src="cid:qrcode" alt="QR Code" style="width:220px;height:220px;display:block;margin:0 auto;" />
                    <div style="margin-top:20px;padding-top:20px;border-top:1px solid #eeeeee;">
                      <span style="display:block;color:#999999;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Order Reference</span>
                      <span style="display:block;color:#111111;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;">${data.orderId.toUpperCase()}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security & Rules — glass panel -->
          <tr>
            <td style="padding:0 40px 48px;">
              <div style="padding:28px;background:linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);border:1px solid rgba(255,255,255,0.06);border-radius:16px;">
                <h4 style="margin:0 0 16px;font-size:13px;font-weight:700;color:#9AE600;text-transform:uppercase;letter-spacing:1.5px;">Security &amp; Guidelines</h4>
                <table width="100%" cellpadding="0" cellspacing="0" style="color:rgba(255,255,255,0.45);font-size:13px;line-height:1.6;">
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;width:20px;color:#ff4444;">•</td>
                    <td style="padding-bottom:10px;"><strong style="color:#ff6666;">DO NOT SHARE:</strong> If found duplicated, both holders will be denied entry.</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;width:20px;color:rgba(255,255,255,0.25);">•</td>
                    <td style="padding-bottom:10px;"><strong style="color:rgba(255,255,255,0.6);">One-time entry.</strong> Management reserves the right to frisk for security.</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;width:20px;color:rgba(255,255,255,0.25);">•</td>
                    <td style="padding-bottom:10px;"><strong style="color:rgba(255,255,255,0.6);">No re-entry</strong> once you exit the venue perimeter.</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;vertical-align:top;width:20px;color:rgba(255,255,255,0.25);">•</td>
                    <td style="padding-bottom:10px;"><strong style="color:rgba(255,255,255,0.6);">Prohibited:</strong> Alcohol, tobacco, substances, weapons, outside food/drinks.</td>
                  </tr>
                  <tr>
                    <td style="vertical-align:top;width:20px;color:rgba(255,255,255,0.25);">•</td>
                    <td><strong style="color:rgba(255,255,255,0.6);">Arrive early</strong> — at least 30 minutes before the event.</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
          
          <!-- Footer — subtle glass -->
          <tr>
            <td style="padding:36px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);background:linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.3);">
                VIT-AP University · Amaravati, Andhra Pradesh · 522237<br />
                Questions? Contact <a href="mailto:rishi.23bce8982@vitapstudent.ac.in" style="color:#9AE600;text-decoration:none;">rishi.23bce8982@vitapstudent.ac.in</a>
              </p>
            </td>
          </tr>
        </table>
        
        <p style="margin:32px 0 0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;letter-spacing:0.5px;">
          THIS IS AN AUTOMATED MESSAGE. PLEASE DO NOT REPLY TO THIS EMAIL.
        </p>
            </td>
          </tr>
        </table>
        
        <p style="margin:32px 0 0;font-size:11px;color:#333333;text-align:center;letter-spacing:0.5px;">
          THIS IS AN AUTOMATED MESSAGE. PLEASE DO NOT REPLY TO THIS EMAIL.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Sends a ticket email to the user for a specific order.
 * @param orderId Internal order ID
 * @param emailOverride Optional email to send the ticket to (instead of the user's email)
 */
export async function sendTicketEmail(orderId: string, emailOverride?: string) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const order = await ordersRepo.getByOrderId(orderId);
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const recipientEmail = emailOverride || order.user?.email || "";
  if (!recipientEmail) {
    throw new Error(`No recipient email for order: ${orderId}`);
  }

  // Format the date nicely
  const eventDate = order.event?.date ? new Date(Number(order.event.date)) : new Date();
  const formattedDate = eventDate.toLocaleDateString("en-IN", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const qrToken = generateQRCode({ orderId: order.orderId });
  const qrBuffer = await generateStyledQRImage(qrToken);

  // Load logo
  const logoPath = path.join(__dirname, "../assets/vitopia.png");
  let logoBuffer: Buffer | null = null;
  try {
    logoBuffer = fs.readFileSync(logoPath);
  } catch (e) {
    console.warn("Could not read vitopia.png logo for email", e);
  }

  const attachments: any[] = [
    {
      filename: "ticket.png",
      content: qrBuffer,
      contentType: "image/png",
      contentId: "qrcode",
      contentDisposition: "inline",
    },
  ];

  if (logoBuffer) {
    attachments.push({
      filename: "logo.png",
      content: logoBuffer,
      contentType: "image/png",
      contentId: "logo",
      contentDisposition: "inline",
    });
  }

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: [recipientEmail],
    subject: `Your VITopia '26 Ticket — ${order.event?.name || "Event"}`,
    html: buildEmailHtml({
      name: order.user?.name || "Attendee",
      orderId: order.orderId,
      eventName: order.event?.name || "Event",
      quantity: order.quantity,
      date: formattedDate,
      venue: order.event?.venue || "VIT-AP Campus",
      email: recipientEmail,
    }),
    attachments,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  // Update order as mailed
  await ordersRepo.updateOrder(orderId, { mailed: true });

  return { success: true, data };
}

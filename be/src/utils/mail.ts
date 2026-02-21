import { Resend } from "resend";
import * as ordersRepo from "../db/orders.js";
import { generateQRCode } from "./qr-code.js";
import { generateStyledQRImage } from "./qr-image.js";

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
}

export function buildEmailHtml(data: TicketEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#000;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#0a0a0a,#1a1a1a);padding:40px 32px;border-bottom:1px solid #222;">
              <h1 style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                VITopia <span style="color:#9AE600;">'26</span>
              </h1>
              <p style="margin:8px 0 0;color:#666;font-size:14px;">Your ticket is ready</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                Hey <strong>${data.name}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#999;">
                Your registration for <strong style="color:#fff;">${data.eventName}</strong> is confirmed.
                Show the attached QR code at the gate for entry.
              </p>
              <table cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #222;border-radius:12px;width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #1a1a1a;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order ID</span>
                    <div style="color:#9AE600;font-family:monospace;font-size:14px;margin-top:4px;">${data.orderId}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tickets</span>
                    <div style="color:#fff;font-size:14px;margin-top:4px;">${data.quantity} × ${data.eventName}</div>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
                QR code is attached as an image. Keep it handy on your phone for quick entry.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#0a0a0a;border-top:1px solid #1a1a1a;">
              <p style="margin:0;font-size:12px;color:#444;text-align:center;">
                VIT-AP University · Amaravati, AP · vitopia.vitap.ac.in
              </p>
            </td>
          </tr>
        </table>
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

    const recipientEmail = emailOverride || order.user?.email;
    if (!recipientEmail) {
        throw new Error(`No recipient email for order: ${orderId}`);
    }

    const qrToken = generateQRCode({ orderId: order.orderId });
    const qrBuffer = await generateStyledQRImage(qrToken);
    const qrBase64 = qrBuffer.toString("base64");

    const { data, error } = await getResend().emails.send({
        from: FROM_EMAIL,
        to: [recipientEmail],
        subject: `Your VITopia '26 Ticket — ${order.event?.name || "Event"}`,
        html: buildEmailHtml({
            name: order.user?.name || "Attendee",
            orderId: order.orderId,
            eventName: order.event?.name || "Event",
            quantity: order.quantity,
        }),
        attachments: [
            {
                filename: `ticket-${order.orderId}.png`,
                content: qrBase64,
                contentType: "image/png",
            },
        ],
    });

    if (error) {
        throw new Error(`Resend error: ${error.message}`);
    }

    // Update order as mailed
    await ordersRepo.updateOrder(orderId, { mailed: true });

    return { success: true, data };
}

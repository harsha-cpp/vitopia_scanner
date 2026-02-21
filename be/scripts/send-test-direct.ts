import dotenv from "dotenv";
import { Resend } from "resend";
import { generateQRCode } from "../src/utils/qr-code.js";
import { generateStyledQRImage } from "../src/utils/qr-image.js";

dotenv.config();

/**
 * One-off script to send a test email bypasssing the database.
 */
async function sendRawTestMail() {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = "surya.24bcs7011@vitapstudent.ac.in";
    const orderId = "ORD-TEST-999";

    console.log(`Sending test email to ${to}...`);

    const qrToken = generateQRCode({ orderId });
    const qrBuffer = await generateStyledQRImage(qrToken);
    const qrBase64 = qrBuffer.toString("base64");

    const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: [to],
        subject: "VITopia '26 Test Ticket",
        html: `
      <h1>VITopia '26 Test Ticket</h1>
      <p>This is a test email sent from the scanner utility.</p>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>Attached is your test QR code.</p>
    `,
        attachments: [
            {
                filename: `ticket-${orderId}.png`,
                content: qrBase64,
                contentType: "image/png",
            },
        ],
    });

    if (error) {
        console.error("Error sending email:", error);
    } else {
        console.log("Email sent successfully!", data);
    }
}

sendRawTestMail();

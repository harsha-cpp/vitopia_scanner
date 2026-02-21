import dotenv from "dotenv";
import { sendTicketEmail } from "../src/utils/mail.js";

// Load environment variables
dotenv.config();

/**
 * cd be && pnpm tsx scripts/test-mail.ts <ORDER_ID> [OPTIONAL_EMAIL]
 */
async function main() {
    const orderId = process.argv[2];
    const emailOverride = process.argv[3];

    if (!orderId) {
        console.error("Usage: pnpm tsx scripts/test-mail.ts <ORDER_ID> [OPTIONAL_EMAIL]");
        process.exit(1);
    }

    console.log(`Starting test mail for order: ${orderId}...`);
    if (emailOverride) {
        console.log(`Overriding recipient to: ${emailOverride}`);
    }

    try {
        const result = await sendTicketEmail(orderId, emailOverride);
        console.log("SUCCESS!", JSON.stringify(result, null, 2));
    } catch (err: any) {
        console.error("FAILED!", err.message);
        process.exit(1);
    }
}

main();

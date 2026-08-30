/**
 * smsProvider.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SMS delivery adapter — currently a logging stub.
 *
 * To activate real sending, set these env vars and uncomment a provider block:
 *   SMS_PROVIDER=twilio          (or africastalking / vonage)
 *   TWILIO_ACCOUNT_SID=ACxxxx
 *   TWILIO_AUTH_TOKEN=xxxx
 *   TWILIO_FROM=+1234567890
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PROVIDER = process.env.SMS_PROVIDER || 'stub';

/**
 * Send an SMS.
 * @param {object} opts
 * @param {string} opts.to   E.164 phone number e.g. +254712345678
 * @param {string} opts.body Message text (max 160 chars for single SMS)
 * @returns {Promise<{provider: string, messageId: string|null}>}
 */
const sendSms = async ({ to, body }) => {
  if (PROVIDER === 'twilio') {
    // ── Twilio (uncomment + npm install twilio) ───────────────────────────
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const msg = await client.messages.create({
    //   body,
    //   from: process.env.TWILIO_FROM,
    //   to,
    // });
    // return { provider: 'twilio', messageId: msg.sid };
  }

  if (PROVIDER === 'africastalking') {
    // ── Africa's Talking (uncomment + npm install africastalking) ────────
    // const AfricasTalking = require('africastalking');
    // const at = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
    // const result = await at.SMS.send({ to: [to], message: body, from: process.env.AT_SENDER_ID });
    // return { provider: 'africastalking', messageId: result.SMSMessageData?.Recipients?.[0]?.messageId || null };
  }

  // ── Stub — log only ──────────────────────────────────────────────────────
  console.log(`[smsProvider:stub] To: ${to} | Body: ${body}`);
  return { provider: 'stub', messageId: null };
};

module.exports = { sendSms };

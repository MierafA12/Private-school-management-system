/**
 * emailProvider.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Email delivery adapter.
 *
 * Active provider: Bird (MessageBird)
 *   EMAIL_PROVIDER=bird
 *   BIRD_API_KEY=bk_xxxxxxxxx   ← replace with your real key
 *   EMAIL_FROM=onboarding@messagebird.dev
 *   EMAIL_FROM_NAME=Haile-Manas Academy
 *
 * To switch providers set EMAIL_PROVIDER=sendgrid or EMAIL_PROVIDER=smtp
 * and fill in the corresponding env vars in the commented blocks below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PROVIDER = process.env.EMAIL_PROVIDER || 'stub';

/**
 * Send an email.
 * @param {object} opts
 * @param {string}   opts.to      Recipient email address
 * @param {string}   opts.subject Email subject line
 * @param {string}   opts.text    Plain-text body
 * @param {string}  [opts.html]   Optional HTML body
 * @returns {Promise<{provider: string, messageId: string|null}>}
 */
const sendEmail = async ({ to, subject, text, html }) => {

  // ── Bird (MessageBird) ───────────────────────────────────────────────────
  if (PROVIDER === 'bird') {
    const { BirdClient } = require('@messagebird/sdk');
    const bird = new BirdClient({ apiKey: process.env.BIRD_API_KEY });

    const result = await bird.email.send({
      from:    process.env.EMAIL_FROM || 'onboarding@messagebird.dev',
      to:      Array.isArray(to) ? to : [to],
      subject,
      html:    html || `<p>${text}</p>`,
    });

    return { provider: 'bird', messageId: result?.id || null };
  }

  // ── SendGrid (uncomment + npm install @sendgrid/mail) ────────────────────
  if (PROVIDER === 'sendgrid') {
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const [response] = await sgMail.send({
    //   to,
    //   from: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME },
    //   subject, text, html: html || text,
    // });
    // return { provider: 'sendgrid', messageId: response.headers['x-message-id'] || null };
  }

  // ── Nodemailer SMTP (uncomment + npm install nodemailer) ─────────────────
  if (PROVIDER === 'smtp') {
    // const nodemailer = require('nodemailer');
    // const transporter = nodemailer.createTransport({
    //   host:   process.env.SMTP_HOST,
    //   port:   parseInt(process.env.SMTP_PORT) || 587,
    //   secure: process.env.SMTP_SECURE === 'true',
    //   auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // });
    // const info = await transporter.sendMail({
    //   from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    //   to, subject, text, html,
    // });
    // return { provider: 'smtp', messageId: info.messageId };
  }

  // ── Stub (default when no provider is configured) ────────────────────────
  console.log(`[emailProvider:stub] To: ${to} | Subject: ${subject}`);
  return { provider: 'stub', messageId: null };
};

module.exports = { sendEmail };

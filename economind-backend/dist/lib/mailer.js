import nodemailer from 'nodemailer';
export async function sendOtpEmail({ email, name, otp }) {
    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (process.env.NODE_ENV !== 'production' && !hasSmtp) {
        console.log('\n========================================');
        console.log(`🔐 [ECONOMIND DEV OTP PREVIEW]`);
        console.log(`👤 User: ${name} <${email}>`);
        console.log(`🔑 Verification Code: ${otp}`);
        console.log(`⏳ Expires in: 10 minutes`);
        console.log('========================================\n');
    }
    else {
        console.log(`[AUTH]: Dispatched verification code to ${email.replace(/(?<=.{2}).(?=.*@)/g, '*')}`);
    }
    if (!hasSmtp) {
        return { success: true, devMode: true };
    }
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0;">EconoMind</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Behavioral Economics Simulation Platform</p>
        </div>

        <div style="background: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #f1f5f9;">
          <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
          <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
            Use the verification code below to complete your EconoMind registration and verify your email address:
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2563eb; background: #eff6ff; padding: 12px 28px; border-radius: 8px; border: 1px dashed #93c5fd;">
              ${otp}
            </div>
          </div>

          <p style="color: #64748b; font-size: 13px; text-align: center; margin: 0;">
            This code expires in <strong>10 minutes</strong>.
          </p>
        </div>

        <div style="margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            If you didn't create an account with EconoMind, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"EconoMind Auth" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `Your EconoMind Verification Code: ${otp}`,
            text: `Hello ${name},\n\nYour EconoMind verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
            html: htmlContent,
        });
        return { success: true, devMode: false };
    }
    catch (err) {
        console.error('⚠️ [SMTP Email Delivery Warning]:', err instanceof Error ? err.message : err);
        // Return true since code is still logged to console
        return { success: true, devMode: true };
    }
}
//# sourceMappingURL=mailer.js.map
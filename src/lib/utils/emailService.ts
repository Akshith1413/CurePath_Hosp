import nodemailer from "nodemailer";

export const sendWelcomeEmail = async (toEmail: string, hospitalName: string, registrationNumber: string) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn(`[EmailService Warning]: SMTP credentials not configured in .env. Skipping registration welcome email to ${toEmail}.`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"CurePath Node Registry" <${user}>`,
      to: toEmail,
      subject: `Welcome to CurePath trust grid: Node Registered (${registrationNumber})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #00e1d9 100%); padding: 25px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 800;">CurePath Node Activation</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Secure blockchain-based healthcare trust grid</p>
          </div>
          <div style="padding: 30px 20px; color: #1f2937; line-height: 1.6;">
            <p>Dear Administrator,</p>
            <p>Congratulations! Your hospital institution, <strong>${hospitalName}</strong>, has successfully registered and activated a cryptographic node on the CurePath healthcare system.</p>
            
            <div style="margin: 25px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #374151; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Node Registration Parameters</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; width: 140px;">Institution Name:</td>
                  <td style="padding: 5px 0; font-weight: 700; color: #111827;">${hospitalName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Node ID (Reg No):</td>
                  <td style="padding: 5px 0; font-weight: 700; color: #111827; font-family: monospace;">${registrationNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Admin Account:</td>
                  <td style="padding: 5px 0; font-weight: 700; color: #111827;">${toEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280;">Node Status:</td>
                  <td style="padding: 5px 0; font-weight: 700; color: #10b981;">ACTIVE & SECURED</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 12px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              This is an automated notification from your local hospital node database. Do not reply to this email. For ledger inquiries or certificate renewals, contact the blockchain coordinator.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService]: Welcome email successfully dispatched to ${toEmail}.`);
  } catch (err: any) {
    console.error(`[EmailService Error]: Welcome email delivery failed for ${toEmail}:`, err.message || err);
  }
};

export const sendLoginAlertEmail = async (toEmail: string, hospitalName: string, ipAddress: string) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    const mailOptions = {
      from: `"CurePath Node Security" <${user}>`,
      to: toEmail,
      subject: `[Security Alert] New Login Session Authorized for ${hospitalName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #1f2937; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #f59e0b;">⚠️ Security Login Alert</h2>
          </div>
          <div style="padding: 20px; color: #1f2937; line-height: 1.6;">
            <p>A new administrative login session has been successfully authorized on your CurePath node.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (err: any) {
    console.error("[EmailService Error]: Login alert email delivery failed:", err.message || err);
  }
};

export const sendDeleteAlertEmail = async (toEmail: string, hospitalName: string, entityType: string, entityName: string) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"CurePath Node Auditor" <${user}>`,
      to: toEmail,
      subject: `[Audit Alert] Resource Deleted: ${entityType} - ${entityName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #ef4444; padding: 20px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800;">🗑️ Resource Deletion Alert</h2>
          </div>
          <div style="padding: 20px; color: #1f2937; line-height: 1.6;">
            <p>An administrative deletion operation has been executed on your CurePath database node.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (err: any) {
    console.error("[EmailService Error]: Deletion alert email delivery failed:", err.message || err);
  }
};

export const sendPasswordResetEmail = async (toEmail: string, otpCode: string) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn(`[EmailService Warning]: SMTP credentials not configured in .env. Skipping password reset email to ${toEmail}. Code would be: ${otpCode}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"CurePath Node Security" <${user}>`,
      to: toEmail,
      subject: `[Security Verification] Password Reset request for CurePath Node`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #3b82f6; padding: 25px; border-radius: 12px 12px 0 0; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 800;">Password Recovery</h2>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Verify your terminal session password reset request</p>
          </div>
          <div style="padding: 30px 20px; color: #1f2937; line-height: 1.6;">
            <div style="margin: 30px 0; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; letter-spacing: 0.05em;">Verification OTP Code</p>
              <div style="display: inline-block; padding: 15px 40px; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; font-size: 32px; font-weight: 800; font-family: monospace; letter-spacing: 0.1em; color: #1f2937; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);">
                ${otpCode}
              </div>
            </div>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EmailService]: Password reset OTP code sent to ${toEmail}.`);
  } catch (err: any) {
    console.error("[EmailService Error]: Password reset email delivery failed:", err.message || err);
  }
};

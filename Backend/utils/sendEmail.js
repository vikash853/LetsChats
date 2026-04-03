const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, username, token) => {
  const verifyURL = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"LetsChats" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your LetsChats account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#07051a;color:#fff;padding:40px;border-radius:16px;">
        <h1 style="color:#a78bfa;margin:0 0 8px">💬 LetsChats</h1>
        <h2 style="margin:0 0 20px;font-size:22px">Hi ${username}! Verify your email</h2>
        <p style="color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 28px">
          Click the button below to verify your email and activate your account. This link expires in 24 hours.
        </p>
        <a href="${verifyURL}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;">
          Verify Email Address
        </a>
        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:24px 0 0;">
          If you did not create this account, ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail };

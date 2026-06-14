import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No account found with that email' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3',
      [resetToken, resetExpires, user.id]
    );

    // Check if SMTP is enabled in app_settings
    const smtpEnabledResult = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'smtp_enabled'"
    );

    const smtpEnabled =
      smtpEnabledResult.rows.length > 0 && smtpEnabledResult.rows[0].value === 'true';

    if (smtpEnabled) {
      // Get SMTP credentials from app_settings
      const smtpEmailResult = await pool.query(
        "SELECT value FROM app_settings WHERE key = 'smtp_email'"
      );
      const smtpPasswordResult = await pool.query(
        "SELECT value FROM app_settings WHERE key = 'smtp_password'"
      );

      const smtpEmail = smtpEmailResult.rows[0]?.value;
      const smtpPassword = smtpPasswordResult.rows[0]?.value;

      if (smtpEmail && smtpPassword) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpEmail,
            pass: smtpPassword,
          },
        });

        await transporter.sendMail({
          from: smtpEmail,
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h2>Password Reset</h2>
            <p>You requested a password reset. Use the following token to reset your password:</p>
            <p><strong>${resetToken}</strong></p>
            <p>This token expires in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
          `,
        });

        return NextResponse.json({
          success: true,
          message: 'Password reset email sent',
        });
      }
    }

    // Dev mode: return token in response
    return NextResponse.json({
      success: true,
      message: 'SMTP not configured. Token returned for dev mode.',
      token: resetToken,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

// Helper to get settings
async function getSettings() {
  const result = await pool.query("SELECT key, value FROM app_settings WHERE key IN ('smtp_enabled', 'smtp_email', 'smtp_password', 'registration_enabled')");
  const settings = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const settings = await getSettings();
    
    // Check if registration is enabled
    if (settings.registration_enabled === 'false') {
      return NextResponse.json({ error: 'User registration is currently disabled by administrator' }, { status: 403 });
    }

    // OPTION A: If SMTP is off, bypass OTP and register directly
    if (settings.smtp_enabled !== 'true') {
      await pool.query(
        'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
        [name, email, password, 'user', true]
      );
      return NextResponse.json({
        success: true,
        bypassed: true,
        message: 'Registration successful (SMTP disabled, OTP bypassed)',
      });
    }

    // SMTP is ON - Generate and send OTP
    if (!settings.smtp_email || !settings.smtp_password) {
      return NextResponse.json({ error: 'SMTP settings are incomplete. Please contact administrator.' }, { status: 500 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Store in registration_otps (upsert in case they request again)
    await pool.query(
      `INSERT INTO registration_otps (email, otp, expires_at, name, password) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = $3, name = $4, password = $5`,
      [email, otp, expiresAt, name, password]
    );

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: settings.smtp_email,
        pass: settings.smtp_password,
      },
    });

    const mailOptions = {
      from: `"Student Fee Management" <${settings.smtp_email}>`,
      to: email,
      subject: 'Registration OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #3b82f6;">Verify your email address</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering. Please use the following OTP to complete your registration:</p>
          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 14px;">This OTP will expire in 10 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      bypassed: false,
      message: 'OTP sent successfully to ' + email,
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP. Please check email settings.' }, { status: 500 });
  }
}

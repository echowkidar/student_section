import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function POST(request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const otpRecord = await pool.query('SELECT * FROM registration_otps WHERE email = $1', [email]);
    
    if (otpRecord.rows.length === 0) {
      return NextResponse.json({ error: 'No pending registration found for this email' }, { status: 400 });
    }

    const record = otpRecord.rows[0];

    if (record.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 401 });
    }

    // Check if user already registered in the meantime
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // Create user
    await pool.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
      [record.name, record.email, record.password, 'user', true]
    );

    // Delete OTP record
    await pool.query('DELETE FROM registration_otps WHERE email = $1', [email]);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

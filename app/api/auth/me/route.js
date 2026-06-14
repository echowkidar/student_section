import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

const JWT_SECRET = process.env.JWT_SECRET || 'sfm-secret-key-2024';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sfm_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const result = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

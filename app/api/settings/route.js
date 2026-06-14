import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET() {
  try {
    const result = await pool.query('SELECT key, value FROM app_settings');

    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, value]
    );

    return NextResponse.json({
      success: true,
      message: 'Setting saved successfully',
    });
  } catch (error) {
    console.error('Save setting error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

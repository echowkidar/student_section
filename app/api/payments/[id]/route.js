import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET(request, context) {
  // Extract id directly, since params can sometimes be a Promise in Next.js 15, we await it if needed
  // Or we just get it from URL if we don't want to use context.params
  const parts = request.url.split('/');
  const id = parts[parts.length - 1];

  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM payment WHERE id = $1 LIMIT 1', [id]);
    
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment: res.rows[0] });
  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment details' }, { status: 500 });
  } finally {
    client.release();
  }
}

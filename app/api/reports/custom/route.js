import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');

  const client = await pool.connect();
  try {
    let query = 'SELECT id, amount, status, method, created_at, notes, description FROM payment WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate + 'T00:00:00Z');
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate + 'T23:59:59Z');
      paramIndex++;
    }

    if (status && status !== 'All') {
      if (status === 'Success') {
        query += ` AND (status = 'captured' OR status = 'Success')`;
      } else {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
    }

    query += ' ORDER BY created_at DESC LIMIT 500'; // Limit to avoid massive payloads for printing

    const res = await client.query(query, params);
    
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    console.error('Custom Report API Error:', error);
    return NextResponse.json({ error: 'Failed to generate custom report' }, { status: 500 });
  } finally {
    client.release();
  }
}

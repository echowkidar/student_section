import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET() {
  const client = await pool.connect();

  try {
    const hallsRes = await client.query('SELECT "Abdullah Hall" as name, "Girls" as gender, "ABD" as code FROM hall_name_code');
    const halls = hallsRes.rows;

    const collectionsRes = await client.query(`
      SELECT 
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'hall_code' ELSE NULL END as hall_code,
        COUNT(*) as student_count,
        SUM(CAST(amount AS NUMERIC)) as total_collected
      FROM payment
      WHERE status = 'captured' OR status = 'Success'
      GROUP BY CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'hall_code' ELSE NULL END
    `);

    // Merge data
    const results = collectionsRes.rows.map(row => {
      const code = row.hall_code;
      const hallDetails = halls.find(h => h.code === code) || { name: code ? `Unknown (${code})` : 'No Hall Assigned', gender: 'N/A' };
      return {
        code,
        name: hallDetails.name,
        gender: hallDetails.gender,
        studentCount: parseInt(row.student_count, 10),
        totalCollected: parseFloat(row.total_collected) || 0
      };
    });

    return NextResponse.json({
      success: true,
      data: results.sort((a, b) => b.totalCollected - a.totalCollected)
    });
  } catch (error) {
    console.error('Hall-wise API Error:', error);
    return NextResponse.json({ error: 'Failed to generate hall-wise report' }, { status: 500 });
  } finally {
    client.release();
  }
}

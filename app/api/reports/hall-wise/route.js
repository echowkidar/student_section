import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET() {
  const client = await pool.connect();

  try {
    const hallsRes = await client.query('SELECT * FROM hall_name_code');
    const halls = hallsRes.rows;

    const collectionsRes = await client.query(`
      SELECT 
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'hall_code' ELSE NULL END as hall_code,
        COUNT(*) as student_count,
        SUM(CAST(amount AS NUMERIC)) as total_collected
      FROM payment
      WHERE status = 'captured' OR status = 'Success'
      GROUP BY CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'hall_code' ELSE NULL END
      ORDER BY total_collected DESC
    `);

    const genderSummaryRes = await client.query(`
      WITH HallCollections AS (
        SELECT 
          CASE WHEN notes IS NOT NULL AND notes LIKE '{%' THEN notes::json->>'hall_code' ELSE NULL END as hall_code,
          SUM(CAST(amount AS NUMERIC)) as total_collected
        FROM payment
        WHERE status = 'captured' OR status = 'Success'
        GROUP BY 1
      )
      SELECT 
        COALESCE(h."Girls", 'Unknown') as gender,
        SUM(hc.total_collected) as total_collected
      FROM HallCollections hc
      LEFT JOIN hall_name_code h ON h."ABD" = hc.hall_code
      GROUP BY 1
    `);

    return NextResponse.json({
      hallMaster: halls,
      hallCollection: collectionsRes.rows,
      genderSummary: genderSummaryRes.rows
    });
  } catch (error) {
    console.error('Hall-wise API Error:', error);
    return NextResponse.json({ error: 'Failed to generate hall-wise report' }, { status: 500 });
  } finally {
    client.release();
  }
}

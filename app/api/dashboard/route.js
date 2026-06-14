import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET() {
  try {
    const [
      totalRes,
      typeRes,
      methodRes,
      monthlyRes,
      facultyRes,
      residentialRes,
      recentRes,
      dailyRes
    ] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_count,
          SUM(CAST(amount AS NUMERIC)) as total_amount,
          AVG(CAST(amount AS NUMERIC)) as avg_amount,
          MAX(CAST(amount AS NUMERIC)) as max_amount
        FROM payment
      `),
      pool.query(`
        SELECT 
          split_part(description, '|', 1) as payment_type,
          COUNT(*) as count,
          SUM(CAST(amount AS NUMERIC)) as total
        FROM payment 
        GROUP BY split_part(description, '|', 1)
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT 
          method,
          COUNT(*) as count,
          SUM(CAST(amount AS NUMERIC)) as total
        FROM payment 
        GROUP BY method 
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT 
          SUBSTRING(created_at FROM 4 FOR 7) as month_year,
          COUNT(*) as count,
          SUM(CAST(amount AS NUMERIC)) as total
        FROM payment 
        WHERE created_at IS NOT NULL
        GROUP BY SUBSTRING(created_at FROM 4 FOR 7)
        ORDER BY month_year
      `),
      pool.query(`
        SELECT 
          COALESCE(acf."FACNAME", 'Unknown') as faculty_name,
          COUNT(*) as count,
          SUM(CAST(p.amount AS NUMERIC)) as total
        FROM payment p
        LEFT JOIN admission_course_code_fee acf 
          ON acf."CLASSCODE" = (
            CASE 
              WHEN p.notes IS NOT NULL AND p.notes LIKE '{%' 
              THEN p.notes::json->>'programme_code' 
              ELSE NULL 
            END
          )
        WHERE split_part(p.description, '|', 1) IN ('Admission Form Fee', 'Admisson Fee', 'Continuation Fee')
        GROUP BY acf."FACNAME"
        ORDER BY total DESC
        LIMIT 15
      `),
      pool.query(`
        SELECT 
          CASE 
            WHEN notes::json->>'residential_status' IN ('YES', 'R', 'Resident', 'RR') THEN 'Resident'
            WHEN notes::json->>'residential_status' IN ('NO', 'NR', 'Non-Resident') THEN 'Non-Resident'
            ELSE 'Not Specified'
          END as status,
          COUNT(*) as count,
          SUM(CAST(amount AS NUMERIC)) as total
        FROM payment 
        WHERE notes IS NOT NULL AND notes LIKE '{%'
        GROUP BY 
          CASE 
            WHEN notes::json->>'residential_status' IN ('YES', 'R', 'Resident', 'RR') THEN 'Resident'
            WHEN notes::json->>'residential_status' IN ('NO', 'NR', 'Non-Resident') THEN 'Non-Resident'
            ELSE 'Not Specified'
          END
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT 
          id, amount, method, created_at, description,
          CASE 
            WHEN notes IS NOT NULL AND notes LIKE '{%' 
            THEN notes::json->>'name' 
            ELSE NULL 
          END as student_name,
          CASE 
            WHEN notes IS NOT NULL AND notes LIKE '{%' 
            THEN notes::json->>'programme_code' 
            ELSE NULL 
          END as programme_code,
          split_part(description, '|', 1) as payment_type
        FROM payment 
        ORDER BY created_at DESC 
        LIMIT 10
      `),
      pool.query(`
        SELECT 
          SUBSTRING(created_at FROM 1 FOR 10) as day,
          COUNT(*) as count,
          SUM(CAST(amount AS NUMERIC)) as total
        FROM payment
        WHERE created_at IS NOT NULL
        GROUP BY SUBSTRING(created_at FROM 1 FOR 10)
        ORDER BY day DESC
        LIMIT 30
      `)
    ]);

    return NextResponse.json({
      summary: totalRes.rows[0],
      paymentTypes: typeRes.rows,
      paymentMethods: methodRes.rows,
      monthlyTrend: monthlyRes.rows,
      facultyCollection: facultyRes.rows,
      residentialBreakdown: residentialRes.rows,
      recentPayments: recentRes.rows,
      dailyTrend: dailyRes.rows.reverse(),
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

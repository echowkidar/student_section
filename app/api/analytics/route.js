import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function GET() {
  const client = await pool.connect();
  try {
    // Collection trend - hourly for last 7 days worth
    const hourlyRes = await client.query(`
      SELECT 
        SUBSTRING(created_at FROM 12 FOR 2) as hour,
        COUNT(*) as count,
        SUM(CAST(amount AS NUMERIC)) as total
      FROM payment
      WHERE created_at IS NOT NULL
      GROUP BY SUBSTRING(created_at FROM 12 FOR 2)
      ORDER BY hour
    `);

    // Payment method trend over months
    const methodTrendRes = await client.query(`
      SELECT 
        SUBSTRING(created_at FROM 4 FOR 7) as month_year,
        method,
        COUNT(*) as count,
        SUM(CAST(amount AS NUMERIC)) as total
      FROM payment
      WHERE created_at IS NOT NULL
      GROUP BY SUBSTRING(created_at FROM 4 FOR 7), method
      ORDER BY month_year, method
    `);

    // Amount distribution (buckets)
    const amountDistRes = await client.query(`
      SELECT 
        CASE 
          WHEN CAST(amount AS NUMERIC) <= 200 THEN '₹0-200'
          WHEN CAST(amount AS NUMERIC) <= 500 THEN '₹201-500'
          WHEN CAST(amount AS NUMERIC) <= 800 THEN '₹501-800'
          WHEN CAST(amount AS NUMERIC) <= 2000 THEN '₹801-2000'
          WHEN CAST(amount AS NUMERIC) <= 5000 THEN '₹2001-5000'
          WHEN CAST(amount AS NUMERIC) <= 10000 THEN '₹5001-10000'
          WHEN CAST(amount AS NUMERIC) <= 20000 THEN '₹10001-20000'
          ELSE '₹20000+'
        END as amount_range,
        COUNT(*) as count,
        SUM(CAST(amount AS NUMERIC)) as total
      FROM payment
      GROUP BY 
        CASE 
          WHEN CAST(amount AS NUMERIC) <= 200 THEN '₹0-200'
          WHEN CAST(amount AS NUMERIC) <= 500 THEN '₹201-500'
          WHEN CAST(amount AS NUMERIC) <= 800 THEN '₹501-800'
          WHEN CAST(amount AS NUMERIC) <= 2000 THEN '₹801-2000'
          WHEN CAST(amount AS NUMERIC) <= 5000 THEN '₹2001-5000'
          WHEN CAST(amount AS NUMERIC) <= 10000 THEN '₹5001-10000'
          WHEN CAST(amount AS NUMERIC) <= 20000 THEN '₹10001-20000'
          ELSE '₹20000+'
        END
      ORDER BY MIN(CAST(amount AS NUMERIC))
    `);

    // Top 10 programmes by collection
    const topProgrammesRes = await client.query(`
      SELECT 
        CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
          THEN notes::json->>'programme_code' 
          ELSE 'Unknown' 
        END as programme,
        COUNT(*) as student_count,
        SUM(CAST(amount AS NUMERIC)) as total_collected
      FROM payment
      WHERE notes IS NOT NULL AND notes LIKE '{%'
        AND notes::json->>'programme_code' IS NOT NULL
      GROUP BY CASE WHEN notes IS NOT NULL AND notes LIKE '{%' 
          THEN notes::json->>'programme_code' 
          ELSE 'Unknown' 
        END
      ORDER BY total_collected DESC
      LIMIT 15
    `);

    // Day of week analysis
    const dayOfWeekRes = await client.query(`
      SELECT 
        SUBSTRING(created_at FROM 1 FOR 2) as day,
        SUBSTRING(created_at FROM 4 FOR 2) as month,
        COUNT(*) as count,
        SUM(CAST(amount AS NUMERIC)) as total
      FROM payment
      WHERE created_at IS NOT NULL
      GROUP BY SUBSTRING(created_at FROM 1 FOR 2), SUBSTRING(created_at FROM 4 FOR 2)
      ORDER BY month, day
    `);

    // Refund analysis
    const refundRes = await client.query(`
      SELECT 
        CASE 
          WHEN CAST(amount_refunded AS NUMERIC) > 0 THEN 'Refunded'
          ELSE 'No Refund'
        END as refund_status,
        COUNT(*) as count,
        SUM(CAST(amount AS NUMERIC)) as total_amount,
        SUM(CAST(amount_refunded AS NUMERIC)) as total_refunded
      FROM payment
      WHERE amount_refunded IS NOT NULL
      GROUP BY CASE WHEN CAST(amount_refunded AS NUMERIC) > 0 THEN 'Refunded' ELSE 'No Refund' END
    `);

    return NextResponse.json({
      hourlyDistribution: hourlyRes.rows,
      methodTrend: methodTrendRes.rows,
      amountDistribution: amountDistRes.rows,
      topProgrammes: topProgrammesRes.rows,
      dailyBreakdown: dayOfWeekRes.rows,
      refundAnalysis: refundRes.rows,
    });
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

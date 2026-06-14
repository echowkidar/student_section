import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';

const pool = new Pool({
  connectionString: 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tableName = formData.get('table') || 'payment';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read the file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (data.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const columns = Object.keys(data[0]);
    
    // Preview mode - just return the data structure
    const preview = formData.get('preview') === 'true';
    if (preview) {
      return NextResponse.json({
        columns,
        rowCount: data.length,
        sampleRows: data.slice(0, 10),
        sheetName,
      });
    }

    // Import mode - insert into database
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check for duplicates if importing to payment table
      let duplicateCount = 0;
      let insertedCount = 0;
      let skippedCount = 0;

      if (tableName === 'payment') {
        for (const row of data) {
          // Check if payment ID already exists
          if (row.id) {
            const existsRes = await client.query(
              'SELECT 1 FROM payment WHERE id = $1',
              [row.id]
            );
            if (existsRes.rows.length > 0) {
              duplicateCount++;
              skippedCount++;
              continue;
            }
          }

          // Build insert query dynamically
          const cols = Object.keys(row).map(k => `"${k}"`).join(', ');
          const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(row);

          await client.query(
            `INSERT INTO payment (${cols}) VALUES (${placeholders})`,
            values
          );
          insertedCount++;
        }
      } else {
        // For other tables, just insert all
        for (const row of data) {
          const cols = Object.keys(row).map(k => `"${k}"`).join(', ');
          const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
          const values = Object.values(row);

          await client.query(
            `INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`,
            values
          );
          insertedCount++;
        }
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        totalRows: data.length,
        insertedCount,
        duplicateCount,
        skippedCount,
      });
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Import API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

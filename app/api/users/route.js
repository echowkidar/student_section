import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:strongpassword@217.217.249.153:5432/postgres',
});

const JWT_SECRET = process.env.JWT_SECRET || 'sfm-secret-key-2024';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sfm_session')?.value;

  if (!token) {
    return { error: 'Not authenticated', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return { error: 'Access denied. Admin role required.', status: 403 };
    }
    return { user: decoded };
  } catch {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const result = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create': {
        const { name, email, password, role, is_active } = body;

        if (!name || !email || !password) {
          return NextResponse.json(
            { error: 'Name, email, and password are required' },
            { status: 400 }
          );
        }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          );
        }

        const result = await pool.query(
          'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, is_active, created_at',
          [name, email, password, role || 'user', is_active !== undefined ? is_active : true]
        );

        return NextResponse.json({
          success: true,
          message: 'User created successfully',
          user: result.rows[0],
        });
      }

      case 'update': {
        const { id, name, email, role, is_active } = body;

        if (!id) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
          fields.push(`name = $${paramIndex++}`);
          values.push(name);
        }
        if (email !== undefined) {
          fields.push(`email = $${paramIndex++}`);
          values.push(email);
        }
        if (role !== undefined) {
          fields.push(`role = $${paramIndex++}`);
          values.push(role);
        }
        if (is_active !== undefined) {
          fields.push(`is_active = $${paramIndex++}`);
          values.push(is_active);
        }

        if (fields.length === 0) {
          return NextResponse.json(
            { error: 'No fields to update' },
            { status: 400 }
          );
        }

        values.push(id);
        const result = await pool.query(
          `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, role, is_active, created_at`,
          values
        );

        if (result.rows.length === 0) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'User updated successfully',
          user: result.rows[0],
        });
      }

      case 'delete': {
        const { id } = body;

        if (!id) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount === 0) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'User deleted successfully',
        });
      }

      case 'change_password': {
        const { id, password } = body;

        if (!id || !password) {
          return NextResponse.json(
            { error: 'User ID and new password are required' },
            { status: 400 }
          );
        }

        const result = await pool.query(
          'UPDATE users SET password = $1 WHERE id = $2',
          [password, id]
        );

        if (result.rowCount === 0) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Password changed successfully',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, update, delete, or change_password' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Users POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

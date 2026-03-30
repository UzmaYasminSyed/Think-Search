import { pool } from './client.js';

export async function initDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        username VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index on email for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create index on username for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Create blogs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        slug VARCHAR(500) UNIQUE NOT NULL,
        tags TEXT[] DEFAULT '{}',
        is_published BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        reading_time INTEGER DEFAULT 0,
        cover_image_url TEXT,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for blogs
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published, published_at);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(is_featured) WHERE is_featured = true;
    `);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}


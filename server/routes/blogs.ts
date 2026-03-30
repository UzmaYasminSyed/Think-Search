import express from 'express';
import { pool } from '../db/client.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Helper to verify JWT token and get user ID
const verifyToken = (req: express.Request): string | null => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    return decoded.userId;
  } catch {
    return null;
  }
};

// GET /api/blogs - Get all published blogs
router.get('/', async (req, res) => {
  try {
    const { limit = '12', offset = '0', featured, search } = req.query;
    
    let query = `
      SELECT 
        id, title, excerpt, slug, tags, is_published, is_featured,
        view_count, like_count, comment_count, reading_time,
        cover_image_url, created_at, updated_at, published_at, user_id
      FROM blogs
      WHERE is_published = true
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    if (featured === 'true') {
      query += ' AND is_featured = true';
    }
    
    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR excerpt ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY published_at DESC, created_at DESC LIMIT $' + paramIndex + ' OFFSET $' + (paramIndex + 1);
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blogs/my - Get current user's blogs (requires auth)
router.get('/my', async (req, res) => {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status } = req.query;
    let query = `
      SELECT 
        id, title, excerpt, slug, tags, is_published, is_featured,
        view_count, like_count, comment_count, reading_time,
        cover_image_url, created_at, updated_at, published_at, user_id
      FROM blogs
      WHERE user_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (status === 'published') {
      query += ' AND is_published = true';
    } else if (status === 'drafts') {
      query += ' AND is_published = false';
    }
    
    query += ' ORDER BY updated_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blogs/:slug - Get blog by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await pool.query(
      `SELECT 
        id, title, content, excerpt, slug, tags, is_published, is_featured,
        view_count, like_count, comment_count, reading_time,
        cover_image_url, created_at, updated_at, published_at, user_id
      FROM blogs
      WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const blog = result.rows[0];
    
    // Increment view count
    await pool.query(
      'UPDATE blogs SET view_count = view_count + 1 WHERE id = $1',
      [blog.id]
    );
    
    blog.view_count += 1;

    res.json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/blogs - Create new blog (requires auth)
router.post('/', async (req, res) => {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      title,
      content,
      excerpt,
      slug,
      tags,
      cover_image_url,
      reading_time,
      is_published,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO blogs (
        user_id, title, content, excerpt, slug, tags, cover_image_url,
        reading_time, is_published, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING 
        id, title, excerpt, slug, tags, is_published, is_featured,
        view_count, like_count, comment_count, reading_time,
        cover_image_url, created_at, updated_at, published_at, user_id`,
      [
        userId,
        title.trim(),
        content.trim(),
        excerpt?.trim() || null,
        slug,
        tags || [],
        cover_image_url || null,
        reading_time || 0,
        is_published || false,
        is_published ? new Date().toISOString() : null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating blog:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'A blog with this slug already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/blogs/:id - Update blog (requires auth)
router.put('/:id', async (req, res) => {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      slug,
      tags,
      cover_image_url,
      reading_time,
      is_published,
      is_featured,
    } = req.body;

    // Check if blog exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM blogs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }
    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      values.push(content.trim());
    }
    if (excerpt !== undefined) {
      updateFields.push(`excerpt = $${paramIndex++}`);
      values.push(excerpt?.trim() || null);
    }
    if (slug !== undefined) {
      updateFields.push(`slug = $${paramIndex++}`);
      values.push(slug);
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      values.push(tags);
    }
    if (cover_image_url !== undefined) {
      updateFields.push(`cover_image_url = $${paramIndex++}`);
      values.push(cover_image_url || null);
    }
    if (reading_time !== undefined) {
      updateFields.push(`reading_time = $${paramIndex++}`);
      values.push(reading_time);
    }
    if (is_published !== undefined) {
      updateFields.push(`is_published = $${paramIndex++}`);
      values.push(is_published);
      if (is_published) {
        updateFields.push(`published_at = $${paramIndex++}`);
        values.push(new Date().toISOString());
      } else {
        updateFields.push(`published_at = $${paramIndex++}`);
        values.push(null);
      }
    }
    if (is_featured !== undefined) {
      updateFields.push(`is_featured = $${paramIndex++}`);
      values.push(is_featured);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, userId);

    const query = `
      UPDATE blogs
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING 
        id, title, excerpt, slug, tags, is_published, is_featured,
        view_count, like_count, comment_count, reading_time,
        cover_image_url, created_at, updated_at, published_at, user_id
    `;

    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating blog:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A blog with this slug already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/blogs/:id - Delete blog (requires auth)
router.delete('/:id', async (req, res) => {
  try {
    const userId = verifyToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if blog exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM blogs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Blog not found or unauthorized' });
    }

    await pool.query('DELETE FROM blogs WHERE id = $1', [id]);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


# Migration from Supabase to NeonDB - Authentication System

This guide explains the changes made to migrate from Supabase authentication to NeonDB with a custom authentication system.

## What Changed

1. **Backend Server**: Created a new Express.js backend server for authentication
2. **Database**: Migrated from Supabase to NeonDB (PostgreSQL)
3. **Authentication**: Custom JWT-based authentication (no email verification)
4. **Frontend**: Updated to use the new API endpoints

## Setup Instructions

### 1. Backend Server Setup

Create a `.env` file in the `server` directory:

```env
DATABASE_URL=postgresql://neondb_owner:npg_GtZ2snvh0qfQ@ep-dry-violet-a4luuynu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3001
FRONTEND_URL=http://localhost:8080
```

**Important**: Change `JWT_SECRET` to a secure random string in production!

### 2. Start the Backend Server

In one terminal, run:
```bash
npm run dev:server
```

This will:
- Start the Express server on port 3001
- Automatically initialize the database schema (users table)
- Enable hot-reload for development

### 3. Start the Frontend

In another terminal, run:
```bash
npm run dev
```

The frontend will run on port 8080 (default).

### 4. Optional: Frontend Environment Variables

If your backend runs on a different URL, create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## Database Schema

The following table is automatically created:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  username VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `POST /api/auth/signup` - Create a new user account
  - Body: `{ email, password, displayName?, username? }`
  - Returns: `{ user, token }`

- `POST /api/auth/signin` - Sign in existing user
  - Body: `{ email, password }`
  - Returns: `{ user, token }`

- `GET /api/auth/me` - Get current user (requires Bearer token)
  - Headers: `Authorization: Bearer <token>`
  - Returns: `{ user }`

## Authentication Flow

1. User signs up/signs in → receives JWT token
2. Token is stored in `localStorage` as `auth_token`
3. Token is sent with each API request in `Authorization` header
4. Token expires after 7 days (configurable in server)

## Key Differences from Supabase

- ✅ **No email verification** - Users can sign up and immediately use the app
- ✅ **Simpler authentication** - Just email and password
- ✅ **JWT tokens** - Standard JWT-based authentication
- ✅ **Direct database access** - Full control over user data

## Files Changed

### New Files
- `server/` - Backend server directory
  - `server/index.ts` - Main server file
  - `server/routes/auth.ts` - Authentication routes
  - `server/db/client.ts` - Database connection
  - `server/db/init.ts` - Database initialization
- `src/lib/api.ts` - Frontend API client

### Modified Files
- `src/pages/Auth.tsx` - Updated to use new API
- `src/hooks/useAuth.tsx` - Updated to work with JWT tokens
- `src/vite-env.d.ts` - Updated environment types
- `package.json` - Added backend dependencies and scripts

## Troubleshooting

### Database Connection Issues
- Verify the `DATABASE_URL` in `server/.env` is correct
- Check that NeonDB allows connections from your IP
- Ensure SSL is properly configured

### CORS Issues
- Make sure `FRONTEND_URL` in `server/.env` matches your frontend URL
- Check browser console for CORS errors

### Authentication Not Working
- Verify the backend server is running on port 3001
- Check browser console and network tab for API errors
- Ensure `VITE_API_URL` is set correctly if using a custom URL

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET** to a strong, random secret
2. **Update DATABASE_URL** to your production NeonDB URL
3. **Set FRONTEND_URL** to your production frontend URL
4. **Enable HTTPS** for both frontend and backend
5. **Set up proper environment variables** in your hosting platform

## Notes

- The Supabase client is still installed but no longer used for authentication
- Other Supabase features (if any) may need separate migration
- Database queries for blogs/search may still use Supabase - those are separate from authentication


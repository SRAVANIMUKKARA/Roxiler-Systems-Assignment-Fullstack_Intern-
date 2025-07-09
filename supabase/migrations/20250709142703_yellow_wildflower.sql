/*
  # Store Rating Platform Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, 20-60 chars)
      - `email` (text, unique)
      - `password` (text, hashed)
      - `address` (text, max 400 chars)
      - `role` (text, enum: admin, user, store_owner)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `stores`
      - `id` (uuid, primary key)
      - `name` (text, 20-60 chars)
      - `email` (text, unique)
      - `address` (text, max 400 chars)
      - `owner_id` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `ratings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `store_id` (uuid, foreign key to stores)
      - `rating` (integer, 1-5)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for role-based access
    - Create indexes for performance

  3. Views
    - Store ratings summary view
    - User statistics view
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'user', 'store_owner');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) >= 20 AND length(name) <= 60),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password text NOT NULL CHECK (length(password) >= 8 AND length(password) <= 16),
  address text NOT NULL CHECK (length(address) <= 400),
  role user_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) >= 20 AND length(name) <= 60),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  address text NOT NULL CHECK (length(address) <= 400),
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_store_id ON ratings(store_id);

-- Create view for store ratings summary
CREATE OR REPLACE VIEW store_ratings_summary AS
SELECT 
  s.id,
  s.name,
  s.email,
  s.address,
  s.owner_id,
  s.created_at,
  s.updated_at,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(r.id) as total_ratings
FROM stores s
LEFT JOIN ratings r ON s.id = r.store_id
GROUP BY s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
  COUNT(CASE WHEN role = 'store_owner' THEN 1 END) as store_owner_count,
  COUNT(*) as total_users
FROM users;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for stores table
CREATE POLICY "Anyone can read stores" ON stores
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert stores" ON stores
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Store owners can update own store" ON stores
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for ratings table
CREATE POLICY "Users can read all ratings" ON ratings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own ratings" ON ratings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ratings" ON ratings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Insert default admin user (password: Admin123!)
INSERT INTO users (name, email, password, address, role) 
VALUES (
  'System Administrator User',
  'admin@storerating.com',
  '$2b$10$rjQUGfYzGWYVGvbTZbL3/.lKTdAzWGmvbr7BDJdH5VhAjGGZgXNOm',
  '123 Admin Street, Admin City, Admin State 12345',
  'admin'
) ON CONFLICT (email) DO NOTHING;
-- ==========================================
-- FOODHUB SUPABASE SCHEMA (Phase 2)
-- Run this entire script in the Supabase SQL Editor
-- ==========================================

-- 1. Enable UUID Extension (usually enabled by default, but good to ensure)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

-- TABLE: categories
-- Simple categories like "Rice", "Swallow", "Drinks"
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: menu_items
-- The food items available for purchase
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Stored in Naira (e.g. 1500)
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: orders
-- Incoming orders from the public site
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_code TEXT NOT NULL, -- Short readable code e.g. "FH-1024"
    items JSONB NOT NULL, -- Snapshot of items: [{name, price, qty}]
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address JSONB NOT NULL, -- { street, lga, landmark }
    status TEXT DEFAULT 'pending', -- pending, preparing, ready, completed, cancelled
    total_amount INTEGER NOT NULL,
    delivery_fee INTEGER DEFAULT 0,
    payment_method TEXT DEFAULT 'cash', -- cash, card, bank_transfer
    payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
    payment_reference TEXT, -- Paystack/Flutterwave ref
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABLE: admins
-- Mapping authenticated Supabase users to Admin roles
-- Note: Insert into this table manually after signing up a user in Auth
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- --- CATEGORIES POLICIES ---

-- Public: Everyone can see categories
CREATE POLICY "Public Read Categories" 
ON public.categories FOR SELECT 
USING (true);

-- Admin: Full access
CREATE POLICY "Admin Full Access Categories" 
ON public.categories FOR ALL 
USING (auth.uid() IN (SELECT id FROM public.admins));


-- --- MENU ITEMS POLICIES ---

-- Public: Can only see AVAILABLE items
CREATE POLICY "Public Read Menu" 
ON public.menu_items FOR SELECT 
USING (is_available = true);

-- Admin: Full access (to see hidden items config, etc)
CREATE POLICY "Admin Full Access Menu" 
ON public.menu_items FOR ALL 
USING (auth.uid() IN (SELECT id FROM public.admins));


-- --- ORDERS POLICIES ---

-- Public: Guests can INSERT orders
-- (We allow anon inserts here. Alternatively, we could auth them anonymously, but for valid public access:)
CREATE POLICY "Public Create Orders" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Public: Guests CANNOT read orders list (Privacy). 
-- They can only read their specific order if we implemented a UUID check, but for now blocking Public Select list.
-- No SELECT policy for public = Implicitly denied.

-- Admin: Full access
CREATE POLICY "Admin Full Access Orders" 
ON public.orders FOR ALL 
USING (auth.uid() IN (SELECT id FROM public.admins));


-- --- ADMINS TABLE POLICIES ---

-- Public: No access
-- Admin: Read self
CREATE POLICY "Admin Read Self" 
ON public.admins FOR SELECT 
USING (auth.uid() = id);

-- ==========================================
-- 4. HELPER DATA (Optional Starter Data)
-- ==========================================

-- Insert some categories if empty
INSERT INTO public.categories (name, sort_order)
VALUES 
    ('Rice Dishes', 1),
    ('Swallow & Soups', 2),
    ('Sides & Snacks', 3),
    ('Drinks', 4)
ON CONFLICT (name) DO NOTHING;


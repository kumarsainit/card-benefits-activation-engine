-- ===================================================
-- V3__update_demo_credentials.sql
-- Ensure verified demo credentials and BCrypt password hashes exist
-- ===================================================

-- 1. Ensure Customer Alex Carter (customer@example.com / Password123!)
INSERT INTO customers (id, email, full_name, password_hash, role, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'customer@example.com', 'Alex Carter', '$2a$10$ZMBYefiPZkXvZWugMC.AR.gtsqLVqcwSiA6CcRtDsna8R0EILQQVi', 'ROLE_CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 2. Ensure Admin (admin@cbae.internal / AdminSecure2026!)
INSERT INTO customers (id, email, full_name, password_hash, role, created_at, updated_at)
VALUES 
    ('22222222-2222-2222-2222-222222222222', 'admin@cbae.internal', 'System Admin', '$2a$10$6VM/5n/KPh2E3vf4L7MHvOTFXMKFZGklH/6EFP0fNcnxpIcFj9fnC', 'ROLE_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- 3. Update cardholder names on demo cards
UPDATE cards
SET cardholder_name = 'Alex Carter'
WHERE customer_id = '11111111-1111-1111-1111-111111111111';

-- ===================================================
-- V2__seed_demo_data.sql
-- Seed Data for Card Benefit Activation Engine
-- Passwords are BCrypt hashes of 'Password123!'
-- ===================================================

-- 1. Demo Customers
INSERT INTO customers (id, email, full_name, password_hash, role, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'customer@example.com', 'Alex Carter', '$2a$10$ZMBYefiPZkXvZWugMC.AR.gtsqLVqcwSiA6CcRtDsna8R0EILQQVi', 'ROLE_CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'admin@cbae.internal', 'System Admin', '$2a$10$6VM/5n/KPh2E3vf4L7MHvOTFXMKFZGklH/6EFP0fNcnxpIcFj9fnC', 'ROLE_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;

-- 2. Demo Cards for John Doe
-- Card 1: Platinum Card (Rich Purchase & Return Protection)
-- Card 2: Sapphire Reserve (Rich Travel Delay & Purchase Protection)
INSERT INTO cards (id, customer_id, card_number_last4, card_network, card_tier, cardholder_name, expiry_month, expiry_year, status, created_at, updated_at)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '8842', 'AMEX', 'PLATINUM', 'John Doe', 11, 2028, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '4321', 'VISA', 'SAPPHIRE_RESERVE', 'John Doe', 8, 2029, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 3. Card Benefits for Card 1 (Platinum)
INSERT INTO card_benefits (id, card_id, benefit_type, max_coverage_amount, annual_max_limit, deductible_amount, coverage_window_days, min_delay_hours, terms_and_conditions, status)
VALUES
    ('baaaaaaa-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PURCHASE_PROTECTION', 10000.00, 50000.00, 0.00, 90, NULL, 'Covers accidental damage or theft within 90 days of purchase date. Up to $10,000 per incident.', 'ACTIVE'),
    ('baaaaaaa-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RETURN_PROTECTION', 300.00, 1000.00, 0.00, 90, NULL, 'Reimburses purchase amount when merchant denies return within 90 days. Up to $300 per item.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Card Benefits for Card 2 (Sapphire Reserve)
INSERT INTO card_benefits (id, card_id, benefit_type, max_coverage_amount, annual_max_limit, deductible_amount, coverage_window_days, min_delay_hours, terms_and_conditions, status)
VALUES
    ('bbbbbbbb-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TRAVEL_DELAY', 500.00, 2500.00, 0.00, NULL, 6, 'Covers reasonable unreimbursed expenses (meals, lodging) if common carrier travel is delayed by 6 or more hours.', 'ACTIVE'),
    ('bbbbbbbb-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PURCHASE_PROTECTION', 500.00, 10000.00, 0.00, 120, NULL, 'Covers accidental damage or theft within 120 days of purchase date. Up to $500 per incident.', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Configurable Benefit Rules
INSERT INTO benefit_rules (id, benefit_type, rule_code, rule_name, rule_description, parameters_json, is_active, priority)
VALUES
    (
        'c1111111-1111-1111-1111-111111111111',
        'PURCHASE_PROTECTION',
        'RULE_PURCHASE_PROTECTION_V1',
        'Standard Purchase Protection Evaluator',
        'Evaluates theft or accidental damage within card coverage window and per-incident limits',
        '{"maxCoveragePerIncident": 10000, "defaultWindowDays": 90, "eligibleMccList": ["5732", "5311", "5722", "5045", "5999", "5734"], "ineligibleMccList": ["5511", "6011", "7995"], "minAmount": 25.00}',
        TRUE,
        10
    ),
    (
        'c2222222-2222-2222-2222-222222222222',
        'RETURN_PROTECTION',
        'RULE_RETURN_PROTECTION_V1',
        'Standard Return Protection Evaluator',
        'Evaluates merchant refusal to accept returns within 90 days',
        '{"maxCoveragePerItem": 500, "defaultWindowDays": 90, "requireMerchantDenialProof": true, "eligibleMccList": ["5651", "5691", "5732", "5944", "5311", "5999"], "minAmount": 20.00}',
        TRUE,
        20
    ),
    (
        'c3333333-3333-3333-3333-333333333333',
        'TRAVEL_DELAY',
        'RULE_TRAVEL_DELAY_V1',
        'Common Carrier Travel Delay Evaluator',
        'Evaluates airline/train delays exceeding 4 to 6 hours for meal/lodging compensation',
        '{"minDelayHours": 6, "maxExpenseReimbursement": 500, "eligibleMccList": ["3000", "3001", "3005", "4511", "4112"], "coveredHazards": ["WEATHER", "MECHANICAL_EQUIPMENT_FAILURE", "AIR_TRAFFIC_CONTROL", "STRIKE"]}',
        TRUE,
        30
    )
ON CONFLICT (id) DO NOTHING;

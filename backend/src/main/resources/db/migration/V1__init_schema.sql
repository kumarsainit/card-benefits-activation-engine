-- ===================================================
-- V1__init_schema.sql
-- Card Benefit Activation Engine Schema Initializer
-- ===================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_CUSTOMER',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    card_number_last4 VARCHAR(4) NOT NULL,
    card_network VARCHAR(50) NOT NULL, -- VISA, MASTERCARD, AMEX
    card_tier VARCHAR(100) NOT NULL,   -- PLATINUM, SAPPHIRE_RESERVE, GOLD, CASH_BACK
    cardholder_name VARCHAR(255) NOT NULL,
    expiry_month INT NOT NULL,
    expiry_year INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_benefits (
    id UUID PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    benefit_type VARCHAR(100) NOT NULL, -- PURCHASE_PROTECTION, RETURN_PROTECTION, TRAVEL_DELAY
    max_coverage_amount NUMERIC(12, 2) NOT NULL,
    annual_max_limit NUMERIC(12, 2) NOT NULL,
    deductible_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    coverage_window_days INT,
    min_delay_hours INT,
    terms_and_conditions TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_card_benefit UNIQUE (card_id, benefit_type)
);

CREATE TABLE IF NOT EXISTS benefit_rules (
    id UUID PRIMARY KEY,
    benefit_type VARCHAR(100) NOT NULL,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    parameters_json TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    transaction_reference VARCHAR(255) NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    merchant_name VARCHAR(255) NOT NULL,
    merchant_category VARCHAR(100),
    mcc_code VARCHAR(10),
    transaction_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SETTLED', -- PENDING, SETTLED, REFUNDED, CANCELLED
    category_classification VARCHAR(100),
    travel_metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_events (
    id UUID PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload_json TEXT NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS benefit_opportunities (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    benefit_id UUID NOT NULL REFERENCES card_benefits(id) ON DELETE CASCADE,
    benefit_type VARCHAR(100) NOT NULL,
    potential_claim_amount NUMERIC(12, 2) NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL, -- e.g. 0.9800
    eligibility_reasons TEXT NOT NULL,       -- JSON Array of reasons
    required_evidence_list TEXT NOT NULL,    -- JSON Array of needed evidence
    status VARCHAR(50) NOT NULL DEFAULT 'DETECTED', -- DETECTED, VIEWED, CLAIM_INITIATED, EXPIRED, DISMISSED
    prefill_data_json TEXT NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_transaction_benefit UNIQUE (transaction_id, benefit_type)
);

CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY,
    opportunity_id UUID REFERENCES benefit_opportunities(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    card_benefit_id UUID NOT NULL REFERENCES card_benefits(id) ON DELETE CASCADE,
    claim_reference_number VARCHAR(100) NOT NULL UNIQUE,
    requested_amount NUMERIC(12, 2) NOT NULL,
    approved_amount NUMERIC(12, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED', -- DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, PAID
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_notes TEXT,
    adjudication_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_evidences (
    id UUID PRIMARY KEY,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100) NOT NULL, -- RECEIPT, DAMAGE_PHOTO, POLICE_REPORT, MERCHANT_DENIAL_PROOF, AIRLINE_DELAY_STATEMENT
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100) NOT NULL, -- OPPORTUNITY_DETECTED, CLAIM_STATUS_UPDATED, OPPORTUNITY_EXPIRING
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
    deep_link VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    actor_id VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details_json TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_customer ON cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_card_benefits_card ON card_benefits(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(transaction_timestamp);
CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON benefit_opportunities(customer_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON benefit_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_claims_customer ON claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_read ON notifications(customer_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_name, entity_id);

import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, cardCreateSchema, claimSubmissionSchema } from '@/schemas';

describe('Validation Schemas (Zod)', () => {
  it('validates login form input correctly', () => {
    const valid = loginSchema.safeParse({
      email: 'customer@example.com',
      password: 'password123',
    });
    expect(valid.success).toBe(true);

    const invalidEmail = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(invalidEmail.success).toBe(false);
  });

  it('validates card enrollment form constraints', () => {
    const validCard = cardCreateSchema.safeParse({
      cardNumberLast4: '4321',
      cardNetwork: 'VISA',
      cardTier: 'SAPPHIRE_RESERVE',
      cardholderName: 'Alex Carter',
      expiryMonth: 12,
      expiryYear: 2028,
    });
    expect(validCard.success).toBe(true);

    const invalidCard = cardCreateSchema.safeParse({
      cardNumberLast4: '12', // Not 4 digits
      cardNetwork: 'VISA',
      cardTier: 'SAPPHIRE_RESERVE',
      cardholderName: 'A',
      expiryMonth: 13,
      expiryYear: 2020,
    });
    expect(invalidCard.success).toBe(false);
  });

  it('validates claim submission schema', () => {
    const validClaim = claimSubmissionSchema.safeParse({
      transactionId: '123e4567-e89b-12d3-a456-426614174000',
      cardBenefitId: '123e4567-e89b-12d3-a456-426614174001',
      requestedAmount: 450.0,
      incidentDate: '2026-09-01T10:00:00Z',
      submissionNotes: 'Flight delayed 7 hours due to storm',
    });
    expect(validClaim.success).toBe(true);

    const invalidClaim = claimSubmissionSchema.safeParse({
      transactionId: 'not-a-uuid',
      cardBenefitId: 'not-a-uuid',
      requestedAmount: -10,
      incidentDate: '',
    });
    expect(invalidClaim.success).toBe(false);
  });
});

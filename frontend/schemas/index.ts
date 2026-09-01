import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

export const cardCreateSchema = z.object({
  cardNumberLast4: z
    .string()
    .length(4, 'Must be exactly 4 digits')
    .regex(/^[0-9]{4}$/, 'Must contain only digits'),
  cardNetwork: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER']),
  cardTier: z.enum(['PLATINUM', 'SAPPHIRE_RESERVE', 'GOLD', 'STANDARD']),
  cardholderName: z.string().min(2, 'Cardholder name is required'),
  expiryMonth: z.coerce.number().min(1).max(12),
  expiryYear: z.coerce.number().min(new Date().getFullYear()),
});

export type CardCreateFormData = z.infer<typeof cardCreateSchema>;

export const claimSubmissionSchema = z.object({
  opportunityId: z.string().uuid().optional(),
  transactionId: z.string().uuid('Valid transaction ID is required'),
  cardBenefitId: z.string().uuid('Valid benefit ID is required'),
  requestedAmount: z.coerce.number().positive('Requested amount must be greater than 0'),
  incidentDate: z.string().min(1, 'Incident date is required'),
  submissionNotes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
});

export type ClaimSubmissionFormData = z.infer<typeof claimSubmissionSchema>;

export const claimReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'PARTIALLY_APPROVED', 'PAID', 'CLOSED']),
  approvedAmount: z.coerce.number().positive().optional(),
  adjudicationNotes: z.string().min(3, 'Adjudication notes are required'),
});

export type ClaimReviewFormData = z.infer<typeof claimReviewSchema>;

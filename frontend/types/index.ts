export type BenefitType = 'PURCHASE_PROTECTION' | 'RETURN_PROTECTION' | 'TRAVEL_DELAY';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER';

export type CardTier = 'PLATINUM' | 'SAPPHIRE_RESERVE' | 'GOLD' | 'STANDARD';

export type CardStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export type TransactionStatus = 'SETTLED' | 'PENDING' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED';

export type OpportunityStatus = 'DETECTED' | 'VIEWED' | 'CLAIM_INITIATED' | 'DISMISSED' | 'EXPIRED';

export type ClaimStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'PAID'
  | 'CLOSED';

export type EvidenceType = 'RECEIPT' | 'DAMAGE_PHOTO' | 'REPAIR_ESTIMATE' | 'POLICE_REPORT' | 'MERCHANT_DENIAL' | 'CARRIER_STATEMENT' | 'OTHER';

export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';

export type NotificationType = 'OPPORTUNITY_DETECTED' | 'CLAIM_STATUS_UPDATED' | 'CLAIM_ACTION_REQUIRED' | 'SYSTEM_ALERT';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: boolean;
  errorCode: string;
  message: string;
  timestamp: string;
  path?: string;
  fieldErrors?: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: User;
}

export interface CardBenefit {
  id: string;
  benefitType: BenefitType;
  benefitName: string;
  maxCoverageAmount: number;
  annualMaxLimit: number;
  deductibleAmount: number;
  coverageWindowDays?: number;
  minDelayHours?: number;
  termsAndConditions?: string;
  status: CardStatus;
}

export interface Card {
  id: string;
  cardNumberLast4: string;
  cardNetwork: CardNetwork;
  cardTier: CardTier;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  status: CardStatus;
  benefits: CardBenefit[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  cardNumberLast4?: string;
  transactionReference: string;
  amount: number;
  currency: string;
  merchantName: string;
  merchantCategory?: string;
  mccCode?: string;
  categoryClassification?: string;
  transactionTimestamp: string;
  status: TransactionStatus;
  travelMetadata?: {
    carrierName?: string;
    flightNumber?: string;
    delayDurationHours?: number;
    delayReason?: string;
    departureAirport?: string;
    arrivalAirport?: string;
  };
}

export interface BenefitOpportunity {
  id: string;
  cardId: string;
  cardNumberLast4: string;
  cardNetwork: string;
  cardTier: string;
  transactionId: string;
  transactionReference: string;
  transactionAmount: number;
  merchantName: string;
  transactionTimestamp: string;
  benefitType: BenefitType;
  benefitName: string;
  potentialClaimAmount: number;
  confidenceScore: number;
  eligibilityReasons: string[];
  requiredEvidence: string[];
  prefillData: Record<string, any>;
  status: OpportunityStatus;
  expiryDate?: string;
  createdAt: string;
}

export interface ClaimEvidence {
  id: string;
  evidenceType: EvidenceType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Claim {
  id: string;
  claimReferenceNumber: string;
  opportunityId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  transactionId: string;
  transactionReference: string;
  transactionAmount: number;
  merchantName: string;
  cardId: string;
  cardNumberLast4: string;
  cardTier: string;
  benefitType: BenefitType;
  benefitName: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: ClaimStatus;
  incidentDate: string;
  submissionNotes?: string;
  adjudicationNotes?: string;
  evidences: ClaimEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  deepLink?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminAnalytics {
  totalPotentialValueDetected: number;
  totalOpportunitiesDetected: number;
  totalClaimsSubmitted: number;
  totalClaimsApproved: number;
  totalClaimsUnderReview: number;
  totalValueUnlockedDollars: number;
  benefitUtilizationRatePercent: number;
  totalEnrolledCards: number;
}

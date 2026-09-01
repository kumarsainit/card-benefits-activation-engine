export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER';

export type CardTier = 'PLATINUM' | 'GOLD' | 'SAPPHIRE_RESERVE' | 'STANDARD';

export type BenefitType = 'PURCHASE_PROTECTION' | 'RETURN_PROTECTION' | 'TRAVEL_DELAY';

export type CardStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'BLOCKED';

export type TransactionStatus = 'PENDING' | 'SETTLED' | 'REFUNDED' | 'DISPUTED';

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

export type EvidenceType =
  | 'RECEIPT'
  | 'DAMAGE_PHOTO'
  | 'POLICE_REPORT'
  | 'MERCHANT_RETURN_DENIAL'
  | 'FLIGHT_DELAY_STATEMENT'
  | 'BOARDING_PASS'
  | 'OTHER';

export type NotificationType =
  | 'BENEFIT_DETECTED'
  | 'CLAIM_STATUS_UPDATE'
  | 'DOCUMENT_REQUEST'
  | 'EXPIRATION_REMINDER'
  | 'SYSTEM_ALERT';

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
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
  token?: string;
  expiresInSeconds?: number;
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
  customerId?: string;
  cardNumberLast4: string;
  cardNetwork: CardNetwork;
  cardTier: CardTier;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
  status: CardStatus;
  benefits?: CardBenefit[];
  createdAt: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  customerId?: string;
  cardNumberLast4?: string;
  cardNetwork?: string;
  cardTier?: string;
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
  createdAt?: string;
}

export interface BenefitOpportunity {
  id: string;
  customerId?: string;
  transactionId: string;
  cardId: string;
  benefitId: string;
  benefitType: BenefitType;
  benefitName: string;
  merchantName: string;
  transactionAmount: number;
  potentialClaimAmount: number;
  confidenceScore: number;
  eligibilityReasons: string[];
  requiredEvidenceList: string[];
  status: OpportunityStatus;
  cardNetwork?: string;
  cardNumberLast4?: string;
  expiryDate?: string;
  prefillData?: Record<string, any>;
  createdAt: string;
}

export interface ClaimEvidence {
  id: string;
  claimId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  evidenceType: EvidenceType;
  isVerified: boolean;
  uploadedAt: string;
}

export interface Claim {
  id: string;
  claimReferenceNumber: string;
  customerId: string;
  transactionId: string;
  cardBenefitId: string;
  opportunityId?: string;
  requestedAmount: number;
  approvedAmount?: number;
  status: ClaimStatus;
  incidentDate: string;
  submissionNotes?: string;
  adjudicationNotes?: string;
  merchantName?: string;
  benefitType?: BenefitType;
  benefitName?: string;
  evidences?: ClaimEvidence[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  customerId: string;
  title: string;
  message: string;
  notificationType: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  deepLink?: string;
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

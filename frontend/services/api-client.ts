import {
  ApiResponse,
  ApiErrorResponse,
  AuthResponse,
  User,
  Card,
  Transaction,
  BenefitOpportunity,
  Claim,
  ClaimEvidence,
  Notification,
  AdminAnalytics,
  ClaimStatus,
  OpportunityStatus,
} from '@/types';

export class ApiError extends Error {
  public status: number;
  public errorCode: string;
  public fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, errorCode: string = 'UNKNOWN_ERROR', fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
  }
}

const TOKEN_KEY = 'cbae_auth_token';
const REFRESH_TOKEN_KEY = 'cbae_refresh_token';
const USER_KEY = 'cbae_auth_user';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      '/api/v1';
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      return null;
    }
    return token.trim();
  }

  public setToken(token: string, refreshToken?: string, user?: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  public clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  public getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const str = localStorage.getItem(USER_KEY);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
      ...(options.headers as Record<string, string>),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return {} as T;
    }

    let json: any = null;
    try {
      json = await response.json();
    } catch {
      if (!response.ok) {
        throw new ApiError(response.status, response.statusText || 'HTTP Error');
      }
      return {} as T;
    }

    if (!response.ok || (json && json.success === false)) {
      const errorMsg = json?.message || `Request failed with status ${response.status}`;
      const errorCode = json?.errorCode || 'API_ERROR';
      const fieldErrors = json?.fieldErrors;
      throw new ApiError(response.status, errorMsg, errorCode, fieldErrors);
    }

    return (json?.data !== undefined ? json.data : json) as T;
  }

  // HTTP Method wrappers
  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, headers);
  }

  public post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      },
      headers
    );
  }

  public put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      },
      headers
    );
  }

  public patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      },
      headers
    );
  }

  public delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, headers);
  }

  // Auth endpoints
  public register(data: { email: string; password: string; fullName: string; role?: string }): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', data);
  }

  public login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', data);
  }

  public getMe(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  // Cards
  public getCards(): Promise<Card[]> {
    return this.get<Card[]>('/cards');
  }

  public getCardById(id: string): Promise<Card> {
    return this.get<Card>(`/cards/${id}`);
  }

  public createCard(data: {
    cardNumberLast4: string;
    cardNetwork: string;
    cardTier: string;
    cardholderName: string;
    expiryMonth: number;
    expiryYear: number;
  }): Promise<Card> {
    return this.post<Card>('/cards', data);
  }

  // Transactions
  public getTransactions(): Promise<Transaction[]> {
    return this.get<Transaction[]>('/transactions');
  }

  public getTransactionById(id: string): Promise<Transaction> {
    return this.get<Transaction>(`/transactions/${id}`);
  }

  public simulateScenario(scenarioName: string, customAmount?: number): Promise<Transaction> {
    return this.post<Transaction>('/transactions/simulate', { scenarioName, customAmount });
  }

  // Opportunities
  public getOpportunities(status?: OpportunityStatus): Promise<BenefitOpportunity[]> {
    const query = status ? `?status=${status}` : '';
    return this.get<BenefitOpportunity[]>(`/opportunities${query}`);
  }

  public getOpportunityById(id: string): Promise<BenefitOpportunity> {
    return this.get<BenefitOpportunity>(`/opportunities/${id}`);
  }

  public dismissOpportunity(id: string): Promise<BenefitOpportunity> {
    return this.post<BenefitOpportunity>(`/opportunities/${id}/dismiss`);
  }

  // Claims
  public getClaims(status?: ClaimStatus): Promise<Claim[]> {
    const query = status ? `?status=${status}` : '';
    return this.get<Claim[]>(`/claims${query}`);
  }

  public getClaimById(id: string): Promise<Claim> {
    return this.get<Claim>(`/claims/${id}`);
  }

  public submitClaim(data: {
    opportunityId?: string;
    transactionId: string;
    cardBenefitId: string;
    requestedAmount: number;
    incidentDate: string;
    submissionNotes?: string;
    initialEvidence?: any[];
  }, idempotencyKey?: string): Promise<Claim> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return this.post<Claim>('/claims', data, headers);
  }

  public addEvidence(claimId: string, evidence: {
    evidenceType: string;
    fileName: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
  }): Promise<ClaimEvidence> {
    return this.post<ClaimEvidence>(`/claims/${claimId}/evidence`, evidence);
  }

  // Notifications
  public getNotifications(): Promise<Notification[]> {
    return this.get<Notification[]>('/notifications');
  }

  public markNotificationAsRead(id: string): Promise<void> {
    return this.post<void>(`/notifications/${id}/read`);
  }

  // Admin
  public getAdminClaims(status?: ClaimStatus): Promise<Claim[]> {
    const query = status ? `?status=${status}` : '';
    return this.get<Claim[]>(`/admin/claims${query}`);
  }

  public reviewClaim(claimId: string, data: {
    status: ClaimStatus;
    approvedAmount?: number;
    adjudicationNotes?: string;
  }): Promise<Claim> {
    return this.post<Claim>(`/admin/claims/${claimId}/review`, data);
  }

  public getAdminAnalytics(): Promise<AdminAnalytics> {
    return this.get<AdminAnalytics>('/admin/analytics');
  }
}

export const apiClient = new ApiClient();

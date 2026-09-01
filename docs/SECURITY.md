# Card Benefits Activation Engine — Security Architecture & Hardening

## 1. Authentication & JWT Handling

- **Stateless Authentication**: REST endpoints use HMAC-SHA256 signed JSON Web Tokens (JWT) with standard expiration and refresh token rotation.
- **Client Transmission**: Client embeds tokens via `Authorization: Bearer <token>` HTTP headers.
- **Client Storage**: Tokens are stored in browser memory with `localStorage` fallback in development.

---

## 2. Authorization & Role-Based Access Control (RBAC)

- **Authorities**:
  - `ROLE_CUSTOMER`: Access limited strictly to own cards (`/api/v1/cards`), own transactions (`/api/v1/transactions`), own opportunities (`/api/v1/opportunities`), own claims (`/api/v1/claims`), and own notifications.
  - `ROLE_ADMIN`: Access to platform-wide adjudication queue (`/api/v1/admin/claims`), claim review decision endpoints (`/api/v1/admin/claims/{id}/review`), and platform analytics (`/api/v1/admin/analytics`).
- **Insecure Direct Object Reference (IDOR) Protection**:
  - Every resource retrieval (`getClaimById`, `getOpportunityById`, `addEvidenceToClaim`) verifies that the entity's `customerId` matches the authenticated `principal.getId()`.
  - Unauthorized access attempts throw `ResourceNotFoundException` / `403 Forbidden` without leaking resource existence.

---

## 3. Financial & Transaction Data Privacy

- **Payment Card Data**: No full Primary Account Numbers (PAN) or Card Verification Values (CVV) are stored in the database or transmitted over APIs. Cards are represented using masked last-4 digits (`cardNumberLast4`) and card network tokens.
- **Transaction Immutability**: Authoritative transaction facts (merchant name, swipe timestamp, dollar amount, MCC code) are read-only and immutable in the frontend. Claim prefill consumes verified backend facts directly.

---

## 4. Evidence Upload Security

- **File Type Whitelist**: Accepts only safe document and image MIME types (`image/jpeg`, `image/png`, `application/pdf`, `application/msword`).
- **File Size Validation**: Maximum 15MB file size limit enforced client-side and server-side.
- **Path Traversal Protection**: Storage paths are generated using UUID identifiers rather than client-supplied filenames. Raw storage paths are not exposed to the browser.
- **Non-executable Sandbox**: Uploaded documents are treated as untrusted static assets with `Content-Disposition` attachments.

---

## 5. Server-Sent Events (SSE) Security

- **Authenticated Stream Endpoint**: `GET /api/v1/notifications/stream?token=<jwt>` validates token validity and extracts customer ID via `JwtService`.
- **Known Trade-offs**: In development environments, query-parameter tokens allow browser native `EventSource` subscription without custom headers. In production banking environments, cookie-based sessions or an API Gateway token termination proxy is recommended.

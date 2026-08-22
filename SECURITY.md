# Security Guide - عهدتك

## Overview

This document outlines the security implementations and best practices for the Ahdatuk application.

## Security Features

### 1. Authentication & Authorization

- **Password Hashing**: Scrypt with 16-byte salt
- **Session Management**: 30-day sessions with httpOnly cookies
- **Session Validation**: Token hash verification with timing-safe comparison
- **OAuth 2.0**: Secure Google OAuth integration with PKCE

### 2. CSRF Protection

CSRF (Cross-Site Request Forgery) protection is available through the `csrf` library.

**Usage in Forms:**

```tsx
import { CSRFInput } from "@/components/csrf-input";

export function MyForm() {
  return (
    <form action={myAction}>
      <CSRFInput />
      {/* other form fields */}
    </form>
  );
}
```

**Verification in Server Actions:**

```typescript
import { verifyCsrfFromFormData } from "@/lib/csrf";

export async function myAction(formData: FormData) {
  if (!await verifyCsrfFromFormData(formData)) {
    throw new Error("CSRF token validation failed");
  }
  // Process form...
}
```

### 3. Security Headers

The application implements comprehensive security headers:

- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-XSS-Protection**: `1; mode=block` - XSS protection
- **Strict-Transport-Security**: HTTPS enforcement
- **Content-Security-Policy**: Restricts resource loading
- **Permissions-Policy**: Disables dangerous APIs
- **Referrer-Policy**: Controls referrer information

### 4. Input Validation

All user inputs are validated:

- **Domain Validation**: Comprehensive validation in `src/lib/domain.ts`
- **Form Data Limits**: Request body size limits in `src/lib/request-body.ts`
- **Rate Limiting**: IP-based rate limiting with configurable limits

### 5. Image Security

Images are sanitized and resized:

- **Max Input Pixels**: 40,000,000 to prevent DoS
- **Max Output Dimension**: 2400x2400
- **EXIF Data Removal**: Metadata is stripped
- **Format Blocking**: Dangerous formats are blocked

### 6. SQL Injection Prevention

- **Prisma ORM**: All database queries use parameterized queries
- **No String Interpolation**: Database inputs are never concatenated

### 7. Rate Limiting

Rate limiting is implemented for sensitive operations:

```typescript
import { clientAddress, enforceRateLimit } from "@/lib/rate-limit";

const ip = await clientAddress();
enforceRateLimit(`action:${ip}`, 5, 60 * 1000, "Too many attempts");
```

## Vulnerability Handling

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email details to: `security@ahdatuk.app`
3. Include steps to reproduce and impact assessment
4. Allow 90 days for response before public disclosure

## Security Checklist for Development

- [ ] Use CSRFInput in all forms
- [ ] Validate all user inputs
- [ ] Use prepared statements (Prisma handles this)
- [ ] Set secure cookie flags
- [ ] Implement rate limiting for sensitive operations
- [ ] Log security-relevant events
- [ ] Keep dependencies updated
- [ ] Run security audits: `npm audit`

## Environment Variables

Ensure these are set in production:

```
NODE_ENV=production
SESSION_SECRET=<32+ character random string>
GOOGLE_CLIENT_ID=<from Google Cloud>
GOOGLE_CLIENT_SECRET=<from Google Cloud>
DATABASE_URL=<PostgreSQL connection string>
```

## Useful Tools

- **npm audit**: Check for vulnerable dependencies
- **OWASP ZAP**: Security scanning
- **Burp Suite Community**: Penetration testing

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/basic-features/security)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

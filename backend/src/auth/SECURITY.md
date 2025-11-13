# Authentication Security Features

This document outlines the security measures implemented in the authentication system.

## Password Security

### Hashing
- **Algorithm**: bcrypt with 12 rounds (high security)
- **Timing Attack Protection**: Constant-time comparison via bcrypt.compare()
- **Salt**: Automatic per-password salt generation

### Password Policy
- **Minimum Length**: 12 characters
- **Maximum Length**: 128 characters
- **Complexity Requirements**:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Pattern Detection**: Blocks common weak patterns (repeated characters, sequences)

### Common Password Detection
- Checks against common password list
- In production, integrate with Have I Been Pwned API

## JWT Security

### Access Tokens
- **Lifetime**: 15 minutes (900 seconds)
- **Algorithm**: HS256 (symmetric key)
- **Secret**: Minimum 32 characters (validated at startup)
- **Claims**: sub (user_id), username, email, roles, iss (issuer)

### Refresh Tokens
- **Lifetime**: 7 days (604800 seconds)
- **Generation**: 64-byte cryptographically secure random (512 bits)
- **Storage**: Hashed with bcrypt before database storage
- **Rotation**: New token issued on every refresh, old token revoked

### Token Rotation
- Refresh tokens are rotated on every refresh
- Old tokens are immediately revoked
- Prevents token reuse if compromised

## Account Lockout

### Brute Force Protection
- **Max Attempts**: 5 failed attempts
- **Lockout Duration**: 15 minutes
- **Tracking Window**: 15 minutes
- **Scope**: Per username/IP combination

### Features
- Exponential backoff (lockout duration increases with repeated lockouts)
- Automatic unlock after cooldown period
- Attempts cleared on successful login

## Rate Limiting

### Endpoints
- **Login**: 5 attempts per minute
- **Refresh**: 10 attempts per minute
- **Other endpoints**: Configurable via ThrottlerModule

### Implementation
- Uses @nestjs/throttler
- IP-based rate limiting
- Prevents brute force and DoS attacks

## Request Security

### IP Tracking
- Extracts IP from X-Forwarded-For, X-Real-IP, or socket
- Used for rate limiting and audit logging

### Device Tracking
- User-Agent stored with refresh tokens
- IP address stored with refresh tokens
- Enables device management and anomaly detection

## Error Handling

### Information Leakage Prevention
- Generic error messages for invalid credentials
- Constant-time delays on failed login (prevents timing attacks)
- No distinction between "user not found" and "wrong password"

### Audit Logging
- All login attempts logged (success and failure)
- Failed attempts include IP and timestamp
- Account lockouts logged with unlock time

## Database Security

### Refresh Token Storage
- Tokens hashed with bcrypt before storage
- Cannot be retrieved in plaintext
- Automatic cleanup of expired tokens

### Query Security
- All queries use parameterized statements
- Prevents SQL injection
- Input validation via class-validator

## Best Practices Implemented

1. ✅ **Strong Password Hashing**: bcrypt with high rounds
2. ✅ **Token Rotation**: Refresh tokens rotated on every use
3. ✅ **Account Lockout**: Prevents brute force attacks
4. ✅ **Rate Limiting**: Prevents DoS and brute force
5. ✅ **Constant-Time Operations**: Prevents timing attacks
6. ✅ **Secure Token Storage**: Hashed refresh tokens
7. ✅ **Device Tracking**: IP and User-Agent tracking
8. ✅ **Error Message Security**: No information leakage
9. ✅ **Input Validation**: DTO validation with class-validator
10. ✅ **Audit Logging**: Comprehensive security event logging

## Production Recommendations

1. **Use Redis** for account lockout (instead of in-memory)
2. **Integrate HIBP API** for password breach checking
3. **Implement 2FA** for sensitive accounts
4. **Use RSA keys** for JWT signing in distributed systems
5. **Implement token blacklisting** for immediate revocation
6. **Add anomaly detection** for unusual login patterns
7. **Use HTTPS only** in production
8. **Implement CSP headers** for XSS protection
9. **Regular security audits** of authentication flow
10. **Monitor and alert** on suspicious activity


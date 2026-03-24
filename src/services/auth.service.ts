import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

// Types
export type JwtPayload = {
    accountId: string;
    role: string;
    username?: string;
    email?: string;
    status?: string;
    provider?: string; // 'email' | 'google' | 'facebook' etc.
};

// Note: Google auth types moved to oauth.service.ts

// Environment constants
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m'
const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? '7')
const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

/**
 * Creates a SHA-256 hash for storing tokens securely in DB
 * Note: We only store hashes, never raw tokens
 * Uses Web Crypto API for Edge Runtime compatibility
 */
async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Creates and signs a new JWT access token
 * @param payload The data to include in the token
 * @returns Signed JWT token string
 */
function signAccessToken(payload: JwtPayload): string {
    try {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL as any })
    } catch (error) {
        console.error('JWT signing error:', error)
        throw error
    }
}

/**
 * Adds the specified number of days to a date
 * @param date The base date
 * @param days Number of days to add
 * @returns A new Date with days added
 */
function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

// Password management functions
/**
 * Hashes a plaintext password
 * @param password The password to hash
 * @returns Promise resolving to the password hash
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
}

/**
 * Verifies a password against its hash
 * @param password The plaintext password
 * @param hash The password hash
 * @returns Promise resolving to true if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
}

// Account management functions
/**
 * Creates a new user account and automatically creates customer record
 * @param params Account creation parameters
 * @returns The created account data with customer info
 */
export async function createAccount(params: {
    username: string;
    email: string;
    passwordHash: string
}): Promise<any> {
    // Find customer role
    const customerRole = await prisma.role.findFirst({
        where: { RoleName: 'Customer' }
    });

    if (!customerRole) {
        throw new Error('Customer role not found');
    }

    // Create account first
    const account = await prisma.account.create({
        data: {
            Username: params.username,
            Email: params.email,
            PasswordHash: params.passwordHash,
            Avatar: '',
            RoleID: customerRole.RoleID,
            Status: 'Active'
        },
        select: { AccountID: true, Username: true, Email: true, role: true, Status: true }
    });

    // Automatically create customer record with default data
    const customer = await createCustomer({
        accountId: account.AccountID,
        fullName: params.username, // Use username as temporary full name
        phoneNumber: '00000000000', // 11 zeros as temporary phone number
        address: 'Default Address', // Default address
        preferredPaymentMethod: 'Cash' // Default payment method
    });

    return {
        ...account,
        customer: customer
    };
}

/**
 * Finds an account by username
 * @param username The username to search for
 * @returns The account if found, null otherwise
 */
export async function findAccountByUsername(username: string): Promise<any | null> {
    return prisma.account.findFirst({ where: { Username: username } })
}

/**
 * Creates a new customer record
 * @param params Customer creation parameters
 * @returns The created customer data
 */
export async function createCustomer(params: {
    accountId: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    preferredPaymentMethod?: 'Cash' | 'CreditCard' | 'MoMo' | 'BankTransfer';
}): Promise<any> {
    return prisma.customer.create({
        data: {
            FullName: params.fullName,
            PhoneNumber: params.phoneNumber,
            Address: params.address,
            DateOfBirth: params.dateOfBirth ? new Date(params.dateOfBirth) : null,
            Gender: params.gender || null,
            PreferredPaymentMethod: params.preferredPaymentMethod || 'Cash',
            AccountID: params.accountId
        },
        select: {
            CustomerID: true,
            FullName: true,
            PhoneNumber: true,
            Address: true,
            DateOfBirth: true,
            Gender: true,
            PreferredPaymentMethod: true,
            AccountID: true
        }
    })
}

/**
 * Creates a new account for enterprise and automatically creates enterprise record
 * @param params Enterprise account creation parameters
 * @returns The created account data with enterprise info
 */
export async function createAccountForEnterprise(params: {
    username: string;
    email: string;
    passwordHash: string;
    enterpriseName: string;
    address: string;
    phoneNumber: string;
    description?: string;
    openHours: string;
    closeHours: string;
}): Promise<any> {
    // Find enterprise role
    const enterpriseRole = await prisma.role.findFirst({
        where: { RoleName: 'Enterprise' }
    });

    if (!enterpriseRole) {
        throw new Error('Enterprise role not found');
    }

    // Create account first
    const account = await prisma.account.create({
        data: {
            Username: params.username,
            Email: params.email,
            PasswordHash: params.passwordHash,
            Avatar: '',
            Provider: 'email',
            RoleID: enterpriseRole.RoleID,
            Status: 'Active'
        },
        select: { AccountID: true, Username: true, Email: true, role: true, Status: true }
    });

    // Create enterprise record
    const enterprise = await createEnterprise({
        accountId: account.AccountID,
        enterpriseName: params.enterpriseName,
        address: params.address,
        phoneNumber: params.phoneNumber,
        description: params.description,
        openHours: params.openHours,
        closeHours: params.closeHours
    });

    return {
        ...account,
        enterprise: enterprise
    };
}

/**
 * Creates a new enterprise record
 * @param params Enterprise creation parameters
 * @returns The created enterprise data
 */
export async function createEnterprise(params: {
    accountId: string;
    enterpriseName: string;
    address: string;
    phoneNumber: string;
    description?: string;
    openHours: string;
    closeHours: string;
}): Promise<any> {
    return prisma.enterprise.create({
        data: {
            EnterpriseName: params.enterpriseName,
            Address: params.address,
            PhoneNumber: params.phoneNumber,
            Description: params.description || null,
            OpenHours: params.openHours,
            CloseHours: params.closeHours,
            IsActive: true,
            AccountID: params.accountId
        },
        select: {
            EnterpriseID: true,
            EnterpriseName: true,
            Address: true,
            PhoneNumber: true,
            Description: true,
            OpenHours: true,
            CloseHours: true,
            IsActive: true,
            AccountID: true
        }
    })
}

/**
 * Finds an account with enterprise details
 * @param username The username to search for
 * @returns The account with enterprise if found, null otherwise
 */
export async function findAccountByUsernameWithEnterprise(username: string): Promise<any | null> {
    return prisma.account.findFirst({
        where: { Username: username },
        include: {
            role: true,
            enterprise: true
        }
    })
}

// Token management functions
/**
 * Issues a new access token and refresh token pair
 * @param accountId The account ID to issue tokens for
 * @param role The user's role
 * @returns Object containing the tokens and expiration
 */
export async function issueTokens(accountId: string, role: string, provider: string = 'email'): Promise<{
    accessToken: string;
    refreshToken: string;
    expiredAt: Date;
}> {
    // Get user details for token
    const account = await prisma.account.findUnique({
        where: { AccountID: accountId },
        select: {
            Username: true,
            Email: true,
            Status: true,
            role: { select: { RoleName: true } }
        }
    })

    const accessToken = signAccessToken({
        accountId,
        role: account?.role?.RoleName || role,
        username: account?.Username,
        email: account?.Email,
        status: account?.Status,
        provider
    })

    // Generate refresh token (random string)
    const raw = cryptoRandom()
    const now = new Date()
    const expiredAt = addDays(now, REFRESH_TOKEN_TTL_DAYS)

    await prisma.authToken.create({
        data: {
            AccountID: accountId,
            RefreshToken: raw,
            AccessToken: await hashToken(accessToken),
            CreatedAt: now,
            ExpiredAt: expiredAt,
            RevokedAt: null,
            IsValid: true
        }
    })

    return { accessToken, refreshToken: raw, expiredAt }
}

/**
 * Issues a new access token using a valid refresh token
 * @param accountId The account ID to issue a token for
 * @param refreshToken The refresh token to validate
 * @returns New access token or null if refresh token invalid
 */
export async function rotateAccessTokenFromRefresh(accountId: string, refreshToken: string): Promise<string | null> {
    const token = await prisma.authToken.findFirst({
        where: { AccountID: accountId, RefreshToken: refreshToken, IsValid: true }
    })
    if (!token) return null
    if (token.ExpiredAt <= new Date()) return null

    // Get user details from account
    const account = await prisma.account.findUnique({
        where: { AccountID: accountId },
        select: {
            Username: true,
            Email: true,
            Status: true,
            role: { select: { RoleName: true } }
        }
    })

    if (!account) return null

    const newAccessToken = signAccessToken({
        accountId,
        role: account.role?.RoleName || 'customer',
        username: account.Username,
        email: account.Email,
        status: account.Status
    })

    // Update the stored access token hash for this refresh token
    await prisma.authToken.updateMany({
        where: { AccountID: accountId, RefreshToken: refreshToken, IsValid: true },
        data: { AccessToken: await hashToken(newAccessToken) }
    })

    return newAccessToken
}

/**
 * Invalidates a refresh token
 * @param accountId The account ID associated with the token
 * @param refreshToken The refresh token to revoke
 */
export async function revokeRefreshToken(accountId: string, refreshToken: string): Promise<void> {
    await prisma.authToken.updateMany({
        where: { AccountID: accountId, RefreshToken: refreshToken, IsValid: true },
        data: { IsValid: false, RevokedAt: new Date() }
    })
}

/**
 * Generates a cryptographically secure random string
 * Uses Web Crypto API for Edge Runtime compatibility
 * @returns Base64URL encoded random string
 */
function cryptoRandom(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Buffer.from(bytes).toString('base64url')
}

// Note: Google OAuth functions moved to oauth.service.ts
// Import findOrCreateGoogleUser from oauth.service.ts when needed
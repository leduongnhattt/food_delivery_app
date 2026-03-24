import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/db';
import { createCustomer } from './auth.service';
import { generateUsernameFromEmail } from '@/lib/utils';

// Types
export interface GoogleUserInfo {
    email: string;
    googleId: string;
    name: string;
    picture?: string;
}

export interface PhoneNumberInfo {
    formatted: string;
    countryCode: string;
    nationalNumber: string;
    isValid: boolean;
}

// Google OAuth Configuration
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Validates and formats phone number
 * @param phoneNumber Raw phone number input
 * @returns Formatted phone number info
 */
export function validateAndFormatPhoneNumber(phoneNumber: string): PhoneNumberInfo {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Default to Vietnam country code if not specified
    let countryCode = '84';
    let nationalNumber = cleaned;

    // Check if phone number starts with country code
    if (cleaned.startsWith('84') && cleaned.length >= 10) {
        countryCode = '84';
        nationalNumber = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length >= 10) {
        // Vietnamese phone number starting with 0
        countryCode = '84';
        nationalNumber = cleaned.substring(1);
    } else if (cleaned.length >= 9 && cleaned.length <= 11) {
        // Assume it's a national number without country code
        countryCode = '84';
        nationalNumber = cleaned;
    }

    // Format the phone number
    const formatted = `+${countryCode}${nationalNumber}`;

    // Basic validation for Vietnamese phone numbers
    const isValid = nationalNumber.length >= 9 && nationalNumber.length <= 10;

    return {
        formatted,
        countryCode,
        nationalNumber,
        isValid
    };
}

/**
 * Generates a temporary phone number for Google OAuth users
 * @param accountId Account ID to generate unique phone number
 * @returns Temporary phone number
 */
export function generateTemporaryPhoneNumber(): string {
    // Return 11 zeros as temporary phone number
    return '00000000000'
}

/**
 * Verifies Google ID token and extracts user information
 * @param idToken Google ID token
 * @returns Google user information
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.sub) {
            throw new Error('Invalid Google token payload');
        }

        return {
            email: payload.email,
            googleId: payload.sub,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture
        };
    } catch (error) {
        console.error('Google token verification failed:', error);
        throw new Error('Failed to verify Google token');
    }
}

/**
 * Finds existing Google OAuth user by Google ID
 * @param googleId Google user ID
 * @returns Existing account or null
 */
export async function findGoogleUserByGoogleId(googleId: string): Promise<any | null> {
    return prisma.account.findFirst({
        where: {
            Provider: 'google',
            ProviderAccountId: googleId,
        },
        include: {
            role: true
        }
    });
}

/**
 * Finds existing account by email
 * @param email Email address
 * @returns Existing account or null
 */
export async function findAccountByEmail(email: string): Promise<any | null> {
    return prisma.account.findFirst({
        where: { Email: email },
        include: {
            role: true
        }
    });
}

/**
 * Links Google account to existing email account
 * @param accountId Existing account ID
 * @param googleUser Google user information
 * @returns Updated account
 */
export async function linkGoogleToExistingAccount(accountId: string, googleUser: GoogleUserInfo): Promise<any> {
    const updated = await prisma.account.update({
        where: { AccountID: accountId },
        data: {
            Provider: 'google',
            ProviderAccountId: googleUser.googleId,
            EmailVerified: true,
            LastLogin: new Date(),
            Avatar: googleUser.picture || undefined
        },
        include: {
            role: true
        }
    });
    // Ensure a Customer exists; create one if missing
    const existingCustomer = await prisma.customer.findFirst({ where: { AccountID: accountId }, select: { CustomerID: true } })
    if (!existingCustomer) {
        const phone = generateTemporaryPhoneNumber()
        try {
            await createCustomer({
                accountId,
                fullName: googleUser.name,
                phoneNumber: phone,
                address: 'Default Address',
                preferredPaymentMethod: 'Cash'
            })
        } catch (e: any) {
            // Retry once with a different phone if unique constraint on phone occurs
            const message = typeof e?.message === 'string' ? e.message : ''
            if (message.includes('CUSTOMER_PhoneNumber_key')) {
                const retryPhone = generateTemporaryPhoneNumber()
                await createCustomer({
                    accountId,
                    fullName: googleUser.name,
                    phoneNumber: retryPhone,
                    address: 'Default Address',
                    preferredPaymentMethod: 'Cash'
                })
            } else {
                throw e
            }
        }
    }
    return updated
}

/**
 * Creates new Google OAuth account
 * @param googleUser Google user information
 * @returns New account with customer profile
 */
export async function createGoogleAccount(googleUser: GoogleUserInfo): Promise<any> {
    // Find customer role
    const customerRole = await prisma.role.findFirst({
        where: { RoleName: 'Customer' }
    });

    if (!customerRole) {
        throw new Error('Customer role not found');
    }

    // Generate clean username from email
    const username = generateUsernameFromEmail(googleUser.email);

    // Check if username already exists
    const existingAccount = await prisma.account.findFirst({
        where: { Username: username }
    });

    if (existingAccount) {
        throw new Error(`Username '${username}' already exists. Please contact support.`);
    }

    // Create new account
    const newAccount = await prisma.account.create({
        data: {
            Username: username,
            Email: googleUser.email,
            RoleID: customerRole.RoleID,
            Avatar: googleUser.picture || '',
            Status: 'Active',
            Provider: 'google',
            ProviderAccountId: googleUser.googleId,
            EmailVerified: true,
            LastLogin: new Date()
        },
        include: {
            role: true
        }
    });

    // Create customer profile with temporary phone number
    // Create customer; handle rare phone unique collisions with one retry
    const firstPhone = generateTemporaryPhoneNumber();
    try {
        await createCustomer({
            accountId: newAccount.AccountID,
            fullName: googleUser.name,
            phoneNumber: firstPhone,
            address: 'Default Address',
            preferredPaymentMethod: 'Cash'
        });
    } catch (e: any) {
        const message = typeof e?.message === 'string' ? e.message : ''
        if (message.includes('CUSTOMER_PhoneNumber_key')) {
            const retryPhone = generateTemporaryPhoneNumber()
            await createCustomer({
                accountId: newAccount.AccountID,
                fullName: googleUser.name,
                phoneNumber: retryPhone,
                address: 'Default Address',
                preferredPaymentMethod: 'Cash'
            })
        } else {
            throw e
        }
    }

    return newAccount;
}

/**
 * Updates last login time for existing account
 * @param accountId Account ID
 * @returns Updated account
 */
export async function updateLastLogin(accountId: string): Promise<any> {
    return prisma.account.update({
        where: { AccountID: accountId },
        data: { LastLogin: new Date() },
        include: {
            role: true
        }
    });
}

/**
 * Main function to find or create Google OAuth user
 * @param googleUser Google user information
 * @returns Found or created user account
 */
export async function findOrCreateGoogleUser(googleUser: GoogleUserInfo): Promise<any> {
    // Check if user exists with this Google ID
    const existingGoogleUser = await findGoogleUserByGoogleId(googleUser.googleId);

    if (existingGoogleUser) {
        // Update last login time
        return await updateLastLogin(existingGoogleUser.AccountID);
    }

    // Check if an account with this email already exists
    const existingEmailAccount = await findAccountByEmail(googleUser.email);

    if (existingEmailAccount) {
        // Link this Google account to the existing email account
        return await linkGoogleToExistingAccount(existingEmailAccount.AccountID, googleUser);
    }

    // Create a new account with customer role
    return await createGoogleAccount(googleUser);
}

/**
 * Validates phone number format and checks for duplicates
 * @param phoneNumber Phone number to validate
 * @param excludeAccountId Account ID to exclude from duplicate check
 * @returns Validation result
 */
export async function validatePhoneNumber(phoneNumber: string, excludeAccountId?: string): Promise<{
    isValid: boolean;
    formatted: string;
    error?: string;
}> {
    const phoneInfo = validateAndFormatPhoneNumber(phoneNumber);

    if (!phoneInfo.isValid) {
        return {
            isValid: false,
            formatted: phoneInfo.formatted,
            error: 'Invalid phone number format'
        };
    }

    // Check for duplicates in customer table
    const existingCustomer = await prisma.customer.findFirst({
        where: {
            PhoneNumber: phoneInfo.formatted,
            ...(excludeAccountId && {
                AccountID: { not: excludeAccountId }
            })
        }
    });

    if (existingCustomer) {
        return {
            isValid: false,
            formatted: phoneInfo.formatted,
            error: 'Phone number already exists'
        };
    }

    return {
        isValid: true,
        formatted: phoneInfo.formatted
    };
}

/**
 * Updates customer phone number
 * @param accountId Account ID
 * @param newPhoneNumber New phone number
 * @returns Updated customer
 */
export async function updateCustomerPhoneNumber(accountId: string, newPhoneNumber: string): Promise<any> {
    const validation = await validatePhoneNumber(newPhoneNumber, accountId);

    if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid phone number');
    }

    return prisma.customer.update({
        where: { AccountID: accountId },
        data: { PhoneNumber: validation.formatted },
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
    });
}

/**
 * Service for changing user password with current password verification
 */

import { buildAuthHeader } from '@/lib/auth-helpers'

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResponse {
    success: boolean;
    data?: { message: string };
    error?: { message: string };
}

/**
 * Change user password with current password verification
 */
export async function changePassword({
    currentPassword,
    newPassword
}: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...buildAuthHeader()
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    message: result.error || 'Failed to change password'
                }
            };
        }

        return {
            success: true,
            data: result
        };
    } catch (err) {
        return {
            success: false,
            error: {
                message: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        };
    }
}

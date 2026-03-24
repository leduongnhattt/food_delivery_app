import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

/**
 * GET /api/settings
 * Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to get customer settings from database
    // For now, we'll store settings in a JSON field or use localStorage
    // Since we don't have a settings table, we'll return default settings
    // In the future, you can create a UserSettings table
    
    // For now, return empty settings (client will use localStorage as fallback)
    return NextResponse.json({
      settings: null,
      message: 'Settings loaded from client storage'
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * Update user settings
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthenticatedUser(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { language, timezone } = body

    // TODO: In the future, create a UserSettings table to store these
    // For now, we'll just validate and return success
    // The client will handle storing in localStorage
    
    // Validate required fields
    if (!language || !timezone) {
      return NextResponse.json(
        { error: 'Language and timezone are required' },
        { status: 400 }
      )
    }

    // In a real implementation, you would:
    // 1. Create a UserSettings table in the database
    // 2. Store settings there linked to AccountID
    // 3. Return the saved settings

    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: body
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}


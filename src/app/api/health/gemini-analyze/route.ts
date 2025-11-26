import { NextRequest, NextResponse } from 'next/server'
import { GeminiHealthAI, type HealthProfile } from '@/services/gemini-health-ai.service'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate required fields
        const { age, gender, height, weight, activityLevel, healthGoal } = body

        if (!age || !gender || !height || !weight || !activityLevel || !healthGoal) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate data types and ranges
        if (age < 1 || age > 120) {
            return NextResponse.json(
                { error: 'Age must be between 1 and 120' },
                { status: 400 }
            )
        }

        if (height < 50 || height > 250) {
            return NextResponse.json(
                { error: 'Height must be between 50 and 250 cm' },
                { status: 400 }
            )
        }

        if (weight < 20 || weight > 300) {
            return NextResponse.json(
                { error: 'Weight must be between 20 and 300 kg' },
                { status: 400 }
            )
        }

        const validGenders = ['male', 'female', 'other']
        if (!validGenders.includes(gender)) {
            return NextResponse.json(
                { error: 'Invalid gender value' },
                { status: 400 }
            )
        }

        const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very-active']
        if (!validActivityLevels.includes(activityLevel)) {
            return NextResponse.json(
                { error: 'Invalid activity level' },
                { status: 400 }
            )
        }

        const validHealthGoals = ['weight-loss', 'weight-gain', 'muscle-gain', 'maintenance', 'health-improvement']
        if (!validHealthGoals.includes(healthGoal)) {
            return NextResponse.json(
                { error: 'Invalid health goal' },
                { status: 400 }
            )
        }

        // Create health profile
        const profile: HealthProfile = {
            age: Number(age),
            gender,
            height: Number(height),
            weight: Number(weight),
            activityLevel,
            healthGoal,
            dietaryRestrictions: body.dietaryRestrictions || ''
        }

        // Get Gemini AI-powered health analysis
        const result = await GeminiHealthAI.analyzeHealthWithGemini(profile)

        return NextResponse.json({
            success: true,
            data: result
        })

    } catch (error) {
        console.error('Gemini health analysis error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    )
}

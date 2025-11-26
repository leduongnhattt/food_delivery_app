import { GoogleGenerativeAI } from "@google/generative-ai";
// NOTE: Do not import client-only hooks here. Resolve locale server-side.

// Use existing locale system
type SupportedLocale = 'en' | 'vi';

// Get system locale in a server-safe way
function getSystemLocale(): SupportedLocale {
    const envLocale = (process.env.NEXT_PUBLIC_LOCALE || process.env.LOCALE || 'en').toLowerCase();
    return envLocale.startsWith('vi') ? 'vi' as SupportedLocale : 'en';
}

export interface HealthProfile {
    age: number;
    gender: 'male' | 'female' | 'other';
    height: number;
    weight: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
    healthGoal: 'weight-loss' | 'weight-gain' | 'muscle-gain' | 'maintenance' | 'health-improvement';
    dietaryRestrictions?: string;
}

export interface HealthAnalysis {
    bmi: number;
    bmiCategory: string;
    bmr: number;
    tdee: number;
    recommendedCalories: number;
    macronutrients: { protein: number; carbs: number; fat: number };
    healthStatus: string;
    healthRisks: string[];
    healthInsights: string[];
    recommendations: string[];
}

export interface ExerciseRecommendation {
    name: string;
    description: string;
    duration: string;
    frequency: string;
    difficultyLevel: string;
    benefits: string[];
    tutorialLink: string;
    equipment: string;
    instructions: string[];
}

export interface MealPlan {
    day: string;
    breakfast: {
        meal: string;
        calories: number;
        description: string;
    };
    lunch: {
        meal: string;
        calories: number;
        description: string;
    };
    dinner: {
        meal: string;
        calories: number;
        description: string;
    };
    snack: {
        meal: string;
        calories: number;
        description: string;
    };
    dailyTotalCalories: number;
}

export interface FoodRecommendation {
    category: string;
    eat: string[];
    avoid: string[];
    benefits?: string;
}

export interface GeminiHealthAnalysis {
    analysis: HealthAnalysis;
    exerciseRecommendations: ExerciseRecommendation[];
    foodRecommendations: FoodRecommendation[];
    weeklyMealPlan: MealPlan[];
    aiInsights: {
        category: string;
        priority: 'high' | 'medium' | 'low';
        insight: string;
        reasoning: string;
        actionable: string;
        confidence: number;
    }[];
    aiRecommendations: {
        type: string;
        title: string;
        description: string;
        reasoning: string;
        priority: number;
        timeframe: string;
        difficulty: string;
        expectedOutcome: string;
    }[];
    personalityProfile: {
        eatingStyle: string;
        motivation: string;
        challenges: string[];
        strengths: string[];
        preferences: string[];
    };
}

export class GeminiHealthAI {
    private static genAI: GoogleGenerativeAI | null = null;

    private static initializeGemini() {
        if (!this.genAI) {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.log("❌ GEMINI_API_KEY missing");
                return null;
            }
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
        return this.genAI;
    }

    static async analyzeHealthWithGemini(profile: HealthProfile): Promise<GeminiHealthAnalysis> {
        const genAI = this.initializeGemini();
        if (!genAI) {
            throw new Error('GEMINI_API_KEY is missing. Cannot generate AI content.');
        }

        const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest"];

        for (const modelName of modelsToTry) {
            try {
                console.log(`🧪 Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = this.createHealthAnalysisPrompt(profile);
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                return this.parseGeminiResponse(text);
            } catch (err: any) {
                console.log(`❌ Model ${modelName} failed:`, err.message);
                continue;
            }
        }
        throw new Error('All Gemini models failed to generate content.');
    }

    private static createHealthAnalysisPrompt(profile: HealthProfile): string {
        const locale = getSystemLocale();
        return this.getPromptTemplate(locale, profile);
    }

    private static getPromptTemplate(
        locale: SupportedLocale,
        profile: HealthProfile
    ): string {
        if (locale === 'vi') {
            return this.getVietnamesePrompt(profile);
        }
        return this.getEnglishPrompt(profile);
    }

    private static getVietnamesePrompt(
        profile: HealthProfile
    ): string {
        return `Bạn là một chuyên gia dinh dưỡng, huấn luyện viên thể dục và chuyên gia sức khỏe. Hãy phân tích hồ sơ sức khỏe sau và TỰ TÍNH TOÁN toàn bộ chỉ số (BMI, BMR, TDEE, macronutrients) theo công thức chuẩn, sau đó xuất JSON đúng schema bên dưới.

QUAN TRỌNG: Đối với các khuyến nghị tập thể dục, hãy cung cấp các liên kết website thể dục thực tế (Healthline, Mayo Clinic, Verywell Fit, WebMD, v.v.) với hướng dẫn chi tiết bằng văn bản. KHÔNG sử dụng video YouTube hoặc nội dung video. Tập trung vào các trang web sức khỏe và thể dục uy tín với hướng dẫn từng bước bằng văn bản.

HỒ SƠ:
- Tuổi: ${profile.age} tuổi
- Giới tính: ${profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'}
- Chiều cao: ${profile.height} cm
- Cân nặng: ${profile.weight} kg
- Mức độ hoạt động: ${this.getActivityLevelVietnamese(profile.activityLevel)}
- Mục tiêu sức khỏe: ${this.getHealthGoalVietnamese(profile.healthGoal)}
- Hạn chế ăn uống: ${profile.dietaryRestrictions || 'Không có'}

Bạn phải tự tính:
- BMI = cân nặng(kg) / (chiều cao(m))^2. Phân loại: <18.5 thiếu cân, 18.5-24.9 bình thường, 25-29.9 thừa cân, ≥30 béo phì.
- BMR (Mifflin-St Jeor): Nam = 10*kg + 6.25*cm - 5*tuổi + 5; Nữ = 10*kg + 6.25*cm - 5*tuổi - 161.
- TDEE = BMR * hệ số hoạt động. Hệ số: sedentary 1.2; light 1.375; moderate 1.55; active 1.725; very-active 1.9.
- recommendedCalories theo mục tiêu: weight-loss ~ 0.8*TDEE; weight-gain ~ 1.2*TDEE; muscle-gain ~ 1.1*TDEE; maintenance/health-improvement ~ 1.0*TDEE.
- macronutrients theo tỉ lệ mục tiêu: weight-loss P30% C35% F35%; muscle-gain P30% C40% F30%; weight-gain P20% C50% F30%; maintenance P25% C45% F30%.

Hãy cung cấp phân tích sức khỏe theo JSON CHÍNH XÁC này (điền số bạn tính):

{
  "analysis": {
    "bmi": <number>,
    "bmiCategory": "<string>",
    "bmr": <number>,
    "tdee": <number>,
    "recommendedCalories": <number>,
    "macronutrients": { "protein": <number>, "carbs": <number>, "fat": <number> },
    "healthStatus": "<string>",
    "healthRisks": ["<string>"],
    "healthInsights": ["<string>", "<string>", "<string>"],
    "recommendations": [
      "Tập trung vào thực phẩm nguyên chất, chưa qua chế biến",
      "Duy trì thời gian ăn uống nhất quán",
      "Uống đủ nước 8-10 ly nước mỗi ngày",
      "Bao gồm hoạt động thể chất thường xuyên"
    ]
  },
  "exerciseRecommendations": [
    // Tạo 2-3 khuyến nghị tập thể dục cụ thể với hướng dẫn chi tiết:
    // Cho mỗi bài tập, cung cấp:
    // - name: Tên bài tập cụ thể (ví dụ: "Squats", "Push-ups", "Plank")
    // - description: Mô tả ngắn gọn về bài tập
    // - duration: Thời gian thực hiện (ví dụ: "30 giây", "3 hiệp 10 lần")
    // - frequency: Tần suất thực hiện (ví dụ: "3 lần/tuần", "Hàng ngày")
    // - difficultyLevel: "Người mới bắt đầu", "Trung bình", hoặc "Nâng cao"
    // - benefits: Mảng các lợi ích sức khỏe cụ thể (ví dụ: ["Tăng cường sức mạnh chân", "Cải thiện thăng bằng"])
    // - tutorialLink: Liên kết website thể dục thực tế VÀ HỢP LỆ. Chỉ dùng các miền uy tín sau: 
    //   ["healthline.com", "mayoclinic.org", "verywellfit.com", "webmd.com", "cdc.gov", "who.int", "nhs.uk", "acefitness.org", "exrx.net"].
    //   KHÔNG bịa đặt URL, KHÔNG dùng trang không tồn tại. Tránh YouTube/video. Dùng đường dẫn bài viết thực, không kèm tham số thừa.
    // - equipment: Thiết bị cần thiết (ví dụ: "Không cần thiết bị", "Tạ tay", "Dây kháng lực")
    // - instructions: Hướng dẫn từng bước để thực hiện đúng kỹ thuật
    // QUAN TRỌNG: Chỉ sử dụng các trang web thể dục/sức khỏe, KHÔNG phải video YouTube. Tập trung vào hướng dẫn và hướng dẫn bằng văn bản.
  ],
  "foodRecommendations": [
    // Tạo 4-5 khuyến nghị danh mục thực phẩm dựa trên:
    // - Mục tiêu sức khỏe: ${this.getHealthGoalVietnamese(profile.healthGoal)}
    // - Tình trạng BMI: dựa trên BMI bạn tính
    // - Hạn chế ăn uống: ${profile.dietaryRestrictions || 'Không có'}
    // - Mục tiêu calo: theo recommendedCalories bạn tính
    // Bao gồm các loại thực phẩm cụ thể nên ăn và tránh cho mỗi danh mục
  ],
  "weeklyMealPlan": [
    // Tạo kế hoạch bữa ăn 7 ngày hoàn chỉnh với:
    // - 3 bữa chính mỗi ngày (sáng, trưa, tối)
    // - Bữa phụ tùy chọn
    // - Số calo cho mỗi bữa ăn
    // - Mô tả chi tiết về nguyên liệu và khẩu phần
    // - Tổng calo hàng ngày nên khoảng recommendedCalories bạn tính
    // - Xem xét hạn chế ăn uống: ${profile.dietaryRestrictions || 'Không có'}
    // - Tập trung vào mục tiêu ${this.getHealthGoalVietnamese(profile.healthGoal)}
    // - Bao gồm đa dạng và dinh dưỡng cân bằng
  ],
  "aiInsights": [
    {
      "category": "sức khỏe",
      "priority": "<high|medium|low>",
      "insight": "<string>",
      "reasoning": "<string>",
      "actionable": "<string>",
      "confidence": <number>
    }
  ],
  "aiRecommendations": [
    {
      "type": "dinh dưỡng",
      "title": "Kế hoạch Dinh dưỡng Cá nhân hóa",
      "description": "<string>",
      "reasoning": "<string>",
      "priority": 10,
      "timeframe": "4-8 tuần",
      "difficulty": "trung bình",
      "expectedOutcome": "${profile.healthGoal === 'weight-loss' ? 'Giảm cân dần dần 0.5-1kg mỗi tuần' : profile.healthGoal === 'weight-gain' ? 'Tăng cân khỏe mạnh 0.25-0.5kg mỗi tuần' : 'Duy trì cân nặng với các chỉ số sức khỏe được cải thiện'}"
    },
    {
      "type": "tập thể dục",
      "title": "Chương trình Thể dục",
      "description": "${profile.activityLevel === 'sedentary' ? 'Bắt đầu với 30 phút đi bộ hàng ngày, tiến tới 150 phút cardio hàng tuần' : 'Duy trì hoạt động hiện tại với thêm tập luyện sức mạnh 2-3 lần hàng tuần'}",
      "reasoning": "Mức độ hoạt động ${this.getActivityLevelVietnamese(profile.activityLevel)} hiện tại cần ${profile.activityLevel === 'sedentary' ? 'tăng dần' : 'tối ưu hóa'}",
      "priority": 9,
      "timeframe": "2-4 tuần",
      "difficulty": "${profile.activityLevel === 'sedentary' ? 'dễ' : 'trung bình'}",
      "expectedOutcome": "Cải thiện sức khỏe tim mạch, tăng sức mạnh, cải thiện thành phần cơ thể"
    },
    {
      "type": "lối sống",
      "title": "Theo dõi Sức khỏe",
      "description": "Theo dõi cân nặng, số đo, mức năng lượng và tâm trạng hàng tuần",
      "reasoning": "Theo dõi thường xuyên giúp điều chỉnh kế hoạch dựa trên tiến độ và kết quả",
      "priority": 8,
      "timeframe": "liên tục",
      "difficulty": "dễ",
      "expectedOutcome": "Hiểu rõ hơn về những gì phù hợp với cơ thể và lối sống của bạn"
    }
  ],
  "personalityProfile": {
    "eatingStyle": "${profile.healthGoal === 'weight-loss' ? 'có cấu trúc với kiểm soát khẩu phần' : profile.healthGoal === 'weight-gain' ? 'bữa ăn thường xuyên với tập trung calo' : 'cân bằng và linh hoạt'}",
    "motivation": "${this.getHealthGoalVietnamese(profile.healthGoal)} với tập trung vào sức khỏe lâu dài",
    "challenges": [
      "${profile.healthGoal === 'weight-loss' ? 'Quản lý khẩu phần và cảm giác thèm ăn' : profile.healthGoal === 'weight-gain' ? 'Ăn đủ calo một cách nhất quán trong ngày' : 'Duy trì động lực cho thói quen lành mạnh'}",
      "Tìm thời gian chuẩn bị bữa ăn và tập thể dục",
      "Duy trì nhất quán với thói quen và thói quen mới"
    ],
    "strengths": [
      "Tiếp cận chủ động để cải thiện sức khỏe",
      "Sẵn sàng theo dõi và giám sát tiến độ",
      "Cam kết đạt được mục tiêu ${this.getHealthGoalVietnamese(profile.healthGoal)}"
    ],
    "preferences": [
      "${profile.dietaryRestrictions ? 'Đáp ứng hạn chế ăn uống: ' + profile.dietaryRestrictions : 'Tiếp cận linh hoạt với lựa chọn thực phẩm và thời gian ăn uống'}",
      "Thay đổi lối sống thực tế và bền vững",
      "Hướng dẫn rõ ràng, có thể thực hiện với kết quả có thể đo lường"
    ]
  }
}

Chỉ trả về JSON này.`;
    }

    private static getEnglishPrompt(
        profile: HealthProfile
    ): string {
        return `You are a professional nutritionist, fitness trainer, and health expert. Analyze this health profile and provide comprehensive, actionable recommendations.

IMPORTANT: For exercise recommendations, provide real fitness website links (Healthline, Mayo Clinic, Verywell Fit, WebMD, etc.) with detailed written guides. Do NOT use YouTube videos or video content. Focus on reputable health and fitness websites with step-by-step written instructions.

PROFILE:
- Age: ${profile.age} years
- Gender: ${profile.gender}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- BMI: (AI will compute)
- Activity Level: ${profile.activityLevel}
- Health Goal: ${profile.healthGoal}
- Dietary Restrictions: ${profile.dietaryRestrictions || 'None'}

Provide a comprehensive health analysis in this exact JSON format:

{
  "analysis": {
    "bmi": <number>,
    "bmiCategory": "<string>",
    "bmr": <number>,
    "tdee": <number>,
    "recommendedCalories": <number>,
    "macronutrients": { "protein": <number>, "carbs": <number>, "fat": <number> },
    "healthStatus": "<string>",
    "healthRisks": ["<string>"],
    "healthInsights": ["<string>", "<string>", "<string>"]
    "recommendations": [
      "Focus on whole, unprocessed foods",
      "Maintain consistent meal timing",
      "Stay hydrated with 8-10 glasses of water daily",
      "Include regular physical activity"
    ]
  },
  "exerciseRecommendations": [
    // Generate 2-3 specific exercise recommendations with detailed guidance:
    // For each exercise, provide:
    // - name: Specific exercise name (e.g., "Squats", "Push-ups", "Plank")
    // - description: Brief description of what the exercise involves
    // - duration: How long to perform (e.g., "30 seconds", "3 sets of 10 reps")
    // - frequency: How often to do it (e.g., "3 times per week", "Daily")
    // - difficultyLevel: "Beginner", "Intermediate", or "Advanced"
    // - benefits: Array of specific health benefits (e.g., ["Builds leg strength", "Improves balance"])
    // - tutorialLink: Real and VALID fitness website link. Only allow domains:
    //   ["healthline.com", "mayoclinic.org", "verywellfit.com", "webmd.com", "cdc.gov", "who.int", "nhs.uk", "acefitness.org", "exrx.net"].
    //   Do not invent URLs. Avoid YouTube or video links. Use article pages with written, step-by-step guides.
    // - equipment: What equipment is needed (e.g., "No equipment", "Dumbbells", "Resistance band")
    // - instructions: Step-by-step instructions for proper form and execution
    // IMPORTANT: Use only fitness/health websites, NOT YouTube videos. Focus on written guides and tutorials.
  ],
  "foodRecommendations": [
    // Generate 4-5 food category recommendations based on:
    // - Health goal: ${profile.healthGoal}
    // - BMI status: based on computed BMI
    // - Dietary restrictions: from profile
    // - Target calories: based on computed recommendedCalories
    // Include specific foods to eat and avoid for each category
  ],
  "weeklyMealPlan": [
    // Generate a complete 7-day meal plan with:
    // - 3 main meals per day (breakfast, lunch, dinner)
    // - Optional snacks
    // - Calorie counts for each meal
    // - Detailed descriptions of ingredients and portions
    // - Total daily calories should be around your computed recommendedCalories
    // - Consider dietary restrictions: from profile
    // - Focus on user's healthGoal
    // - Include variety and balanced nutrition
  ],
  "aiInsights": [
    {
      "category": "health",
      "priority": "<high|medium|low>",
      "insight": "<string>",
      "reasoning": "<string>",
      "actionable": "<string>",
      "confidence": <number>
    }
  ],
  "aiRecommendations": [
    {
      "type": "nutrition",
      "title": "Personalized Nutrition Plan",
      "description": "<string>",
      "reasoning": "<string>",
      "priority": <number>,
      "timeframe": "<string>",
      "difficulty": "<string>",
      "expectedOutcome": "<string>"
    },
    {
      "type": "exercise",
      "title": "Fitness Program",
      "description": "<string>",
      "reasoning": "<string>",
      "priority": <number>,
      "timeframe": "<string>",
      "difficulty": "<string>",
      "expectedOutcome": "<string>"
    },
    {
      "type": "lifestyle",
      "title": "Health Monitoring",
      "description": "<string>",
      "reasoning": "<string>",
      "priority": <number>,
      "timeframe": "<string>",
      "difficulty": "<string>",
      "expectedOutcome": "<string>"
    }
  ],
  "personalityProfile": {
    "eatingStyle": "<string>",
    "motivation": "<string>",
    "challenges": ["<string>", "<string>"],
    "strengths": ["<string>", "<string>"],
    "preferences": ["<string>", "<string>"]
  }
}

Return only this JSON.`;
    }

    // Helper methods for Vietnamese translations
    private static getActivityLevelVietnamese(level: string): string {
        const translations: Record<string, string> = {
            'sedentary': 'Ít vận động (ít/không tập thể dục)',
            'light': 'Hoạt động nhẹ (tập thể dục nhẹ 1-3 ngày/tuần)',
            'moderate': 'Hoạt động vừa phải (tập thể dục vừa phải 3-5 ngày/tuần)',
            'active': 'Rất hoạt động (tập thể dục mạnh 6-7 ngày/tuần)',
            'very-active': 'Cực kỳ hoạt động (tập thể dục rất mạnh và công việc thể chất)'
        };
        return translations[level] || level;
    }

    private static getHealthGoalVietnamese(goal: string): string {
        const translations: Record<string, string> = {
            'weight-loss': 'Giảm cân',
            'weight-gain': 'Tăng cân',
            'muscle-gain': 'Tăng cơ',
            'maintenance': 'Duy trì cân nặng',
            'health-improvement': 'Cải thiện sức khỏe tổng thể'
        };
        return translations[goal] || goal;
    }

    private static getHealthStatusVietnamese(bmi: number): string {
        if (bmi < 18.5) return 'Thiếu cân - cần tăng cân';
        if (bmi < 25) return 'Cân nặng khỏe mạnh - duy trì tình trạng hiện tại';
        if (bmi < 30) return 'Thừa cân - cần quản lý cân nặng';
        return 'Béo phì - cần giảm cân để cải thiện sức khỏe';
    }

    private static getHealthRisksVietnamese(bmi: number, age: number): string[] {
        const risks = [];
        if (bmi >= 30) {
            risks.push('Tiểu đường type 2', 'Bệnh tim', 'Huyết áp cao', 'Ngưng thở khi ngủ');
        } else if (bmi >= 25) {
            risks.push('Tăng nguy cơ tiểu đường', 'Vấn đề tim mạch');
        }
        if (age > 50) {
            risks.push('Vấn đề sức khỏe liên quan đến tuổi tác');
        }
        return risks.length > 0 ? risks : ['Nguy cơ sức khỏe thấp với BMI hiện tại'];
    }

    private static parseGeminiResponse(text: string): GeminiHealthAnalysis {
        try {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (err) {
            console.error('⚠️ Error parsing Gemini response:', err);
            throw new Error('Failed to parse AI response.');
        }
    }

    private static getFallbackAnalysis(profile: HealthProfile): GeminiHealthAnalysis {
        const bmi = this.calculateBMI(profile.height, profile.weight);
        const bmr = this.calculateBMR(profile);
        const tdee = this.calculateTDEE(bmr, profile.activityLevel);
        const recommendedCalories = this.calculateRecommendedCalories(tdee, profile.healthGoal);
        const macros = this.calculateMacronutrients(recommendedCalories, profile.healthGoal);

        return {
            analysis: {
                bmi,
                bmiCategory: this.getBMICategory(bmi),
                bmr: Math.round(bmr),
                tdee: Math.round(tdee),
                recommendedCalories,
                macronutrients: macros,
                healthStatus: this.getHealthStatus(bmi),
                healthRisks: this.getHealthRisks(bmi, profile.age),
                // Keep fallback minimal; no opinionated text
                healthInsights: [],
                recommendations: []
            },
            // Do not provide generated content on fallback; leave empty
            exerciseRecommendations: [],
            foodRecommendations: [],
            weeklyMealPlan: [],
            aiInsights: [],
            aiRecommendations: [],
            personalityProfile: {
                eatingStyle: 'flexible',
                motivation: 'health',
                challenges: [],
                strengths: [],
                preferences: []
            }
        };
    }

    // Helper functions
    private static calculateBMI(height: number, weight: number): number {
        const h = height / 100;
        return weight / (h * h);
    }

    private static getBMICategory(bmi: number): string {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal weight';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    private static getHealthStatus(bmi: number): string {
        if (bmi < 18.5) return 'Underweight - needs weight gain';
        if (bmi < 25) return 'Healthy weight - maintain current status';
        if (bmi < 30) return 'Overweight - consider weight management';
        return 'Obese - requires weight loss for health improvement';
    }

    private static getHealthRisks(bmi: number, age: number): string[] {
        const risks = [];
        if (bmi >= 30) {
            risks.push('Type 2 diabetes', 'Heart disease', 'High blood pressure', 'Sleep apnea');
        } else if (bmi >= 25) {
            risks.push('Increased risk of diabetes', 'Cardiovascular issues');
        }
        if (age > 50) {
            risks.push('Age-related health concerns');
        }
        return risks.length > 0 ? risks : ['Low health risks with current BMI'];
    }


    private static calculateBMR(profile: HealthProfile): number {
        const { age, gender, height, weight } = profile;
        return gender === 'male'
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;
    }

    private static calculateTDEE(bmr: number, activityLevel: string): number {
        const mult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, 'very-active': 1.9 };
        return bmr * (mult[activityLevel as keyof typeof mult] || 1.2);
    }

    private static calculateRecommendedCalories(tdee: number, goal: string): number {
        const mult = { 'weight-loss': 0.8, 'weight-gain': 1.2, 'muscle-gain': 1.1, maintenance: 1.0, 'health-improvement': 1.0 };
        return Math.round(tdee * (mult[goal as keyof typeof mult] || 1.0));
    }

    private static calculateMacronutrients(calories: number, goal: string) {
        let protein = 0.25, carbs = 0.45, fat = 0.3;
        if (goal === 'muscle-gain') { protein = 0.3; carbs = 0.4; fat = 0.3; }
        if (goal === 'weight-loss') { protein = 0.3; carbs = 0.35; fat = 0.35; }
        if (goal === 'weight-gain') { protein = 0.2; carbs = 0.5; fat = 0.3; }
        return {
            protein: Math.round((calories * protein) / 4),
            carbs: Math.round((calories * carbs) / 4),
            fat: Math.round((calories * fat) / 9)
        };
    }
}
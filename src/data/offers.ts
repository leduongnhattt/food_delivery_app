export type Offer = {
    code: string
    discount: number
    description: string
    eligible: boolean
}

export const AVAILABLE_OFFERS: Offer[] = [
    { code: 'WELCOME10', discount: 10000, description: 'New user discount', eligible: true },
    { code: 'SAVE20', discount: 20000, description: 'Orders over 200k', eligible: true },
    { code: 'LUNCHONLY', discount: 15000, description: 'Valid 11:00-14:00', eligible: false },
]



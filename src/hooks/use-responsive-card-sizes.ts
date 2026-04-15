interface CardSizeConfig {
    mobile: string;
    small: string;
    medium: string;
    large: string;
    xl: string;
}

interface ScrollAmountConfig {
    mobile: number;
    tablet: number;
    desktop: number;
    large: number;
}

export const useResponsiveCardSizes = () => {
    const cardSizes: CardSizeConfig = {
        mobile: 'w-[220px]',
        small: 'xs:w-[240px]',
        medium: 'sm:w-[260px]',
        large: 'md:w-[280px]',
        xl: 'lg:w-[300px]'
    };

    const scrollAmounts: ScrollAmountConfig = {
        mobile: 240,
        tablet: 280,
        desktop: 300,
        large: 320
    };

    const getCurrentScrollAmount = (): number => {
        if (typeof window === 'undefined') return scrollAmounts.large;

        const width = window.innerWidth;
        if (width < 640) return scrollAmounts.mobile;
        if (width < 768) return scrollAmounts.tablet;
        if (width < 1024) return scrollAmounts.desktop;
        return scrollAmounts.large;
    };

    const getCardSizeClasses = (): string => {
        return `${cardSizes.mobile} ${cardSizes.small} ${cardSizes.medium} ${cardSizes.large} ${cardSizes.xl}`;
    };

    return {
        cardSizes,
        scrollAmounts,
        getCurrentScrollAmount,
        getCardSizeClasses
    };
};

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
        mobile: 'w-[240px]',
        small: 'xs:w-[260px]',
        medium: 'sm:w-[280px]',
        large: 'md:w-[300px]',
        xl: 'lg:w-[320px]'
    };

    const scrollAmounts: ScrollAmountConfig = {
        mobile: 260,
        tablet: 300,
        desktop: 320,
        large: 340
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

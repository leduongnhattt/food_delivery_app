import { useState, useEffect } from 'react';

interface UseScrollIndicatorsOptions {
    totalItems: number;
    itemsPerPage?: number;
    isMobile?: boolean;
}

export const useScrollIndicators = ({
    totalItems,
    itemsPerPage = 2,
    isMobile = true
}: UseScrollIndicatorsOptions) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const pages = Math.ceil(totalItems / itemsPerPage);
        setTotalPages(pages);
    }, [totalItems, itemsPerPage]);

    const updateCurrentPage = (scrollLeft: number, containerWidth: number) => {
        const pageWidth = containerWidth;
        const newPage = Math.round(scrollLeft / pageWidth);
        setCurrentPage(Math.min(newPage, totalPages - 1));
    };

    const generateDots = () => {
        return Array.from({ length: totalPages }).map((_, index) => ({
            index,
            isActive: index === currentPage
        }));
    };

    return {
        currentPage,
        totalPages,
        updateCurrentPage,
        generateDots,
        shouldShowIndicators: isMobile && totalPages > 1
    };
};

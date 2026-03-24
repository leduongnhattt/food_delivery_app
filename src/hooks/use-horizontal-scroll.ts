import { useRef, useState, useEffect } from 'react';

interface UseHorizontalScrollOptions {
    momentumMultiplier?: number;
    velocityThreshold?: number;
    dragMultiplier?: number;
}

export const useHorizontalScroll = (options: UseHorizontalScrollOptions = {}) => {
    const {
        momentumMultiplier = 300,
        velocityThreshold = 0.5,
        dragMultiplier = 1.5
    } = options;

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [velocity, setVelocity] = useState(0);
    const [lastMoveTime, setLastMoveTime] = useState(0);
    const [lastMoveX, setLastMoveX] = useState(0);

    // Check scroll position to show/hide arrows
    const checkScrollPosition = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    // Mouse drag functionality with momentum
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        setVelocity(0);
        setLastMoveTime(Date.now());
        setLastMoveX(e.pageX);
        scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();

        const currentTime = Date.now();
        const currentX = e.pageX;
        const deltaTime = currentTime - lastMoveTime;
        const deltaX = currentX - lastMoveX;

        // Calculate velocity for momentum
        if (deltaTime > 0) {
            const newVelocity = deltaX / deltaTime;
            setVelocity(newVelocity);
        }

        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * dragMultiplier;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;

        setLastMoveTime(currentTime);
        setLastMoveX(currentX);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';

            // Apply momentum scrolling
            if (Math.abs(velocity) > velocityThreshold) {
                const momentum = velocity * momentumMultiplier;
                const currentScroll = scrollContainerRef.current.scrollLeft;
                const targetScroll = currentScroll - momentum;

                scrollContainerRef.current.scrollTo({
                    left: targetScroll,
                    behavior: 'smooth'
                });
            }
        }
        setVelocity(0);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
        }
    };

    // Touch support for mobile with momentum
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        setVelocity(0);
        setLastMoveTime(Date.now());
        setLastMoveX(e.touches[0].pageX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();

        const currentTime = Date.now();
        const currentX = e.touches[0].pageX;
        const deltaTime = currentTime - lastMoveTime;
        const deltaX = currentX - lastMoveX;

        // Calculate velocity for momentum
        if (deltaTime > 0) {
            const newVelocity = deltaX / deltaTime;
            setVelocity(newVelocity);
        }

        const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * dragMultiplier;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;

        setLastMoveTime(currentTime);
        setLastMoveX(currentX);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        // Apply momentum scrolling for touch
        if (scrollContainerRef.current && Math.abs(velocity) > velocityThreshold) {
            const momentum = velocity * momentumMultiplier;
            const currentScroll = scrollContainerRef.current.scrollLeft;
            const targetScroll = currentScroll - momentum;

            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
        setVelocity(0);
    };

    // Button scroll functionality
    const scroll = (direction: 'left' | 'right'): void => {
        if (scrollContainerRef.current) {
            // Dynamic scroll amount based on screen size
            const isMobile = window.innerWidth < 640; // sm breakpoint
            const isTablet = window.innerWidth < 768; // md breakpoint
            const isDesktop = window.innerWidth < 1024; // lg breakpoint

            let scrollAmount;
            if (isMobile) {
                scrollAmount = 260; // 240px card + 20px gap
            } else if (isTablet) {
                scrollAmount = 300; // 280px card + 20px gap
            } else if (isDesktop) {
                scrollAmount = 320; // 300px card + 20px gap
            } else {
                scrollAmount = 340; // 320px card + 20px gap
            }

            const currentScroll = scrollContainerRef.current.scrollLeft;
            const targetScroll = direction === 'left'
                ? currentScroll - scrollAmount
                : currentScroll + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    // Update arrow visibility on scroll
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            checkScrollPosition(); // Initial check

            return () => {
                container.removeEventListener('scroll', checkScrollPosition);
            };
        }
    }, []);

    return {
        scrollContainerRef,
        isDragging,
        showLeftArrow,
        showRightArrow,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        scroll
    };
};

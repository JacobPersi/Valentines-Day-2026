import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export const useResponsive = () => {
    const [isMobile, setIsMobile] = useState(() => {
        // Initialize based on current window size
        if (typeof window !== 'undefined') {
            return window.innerWidth < MOBILE_BREAKPOINT;
        }
        return false;
    });

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        // Set initial value
        checkMobile();

        // Listen for resize events
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return {
        isMobile,
        isDesktop: !isMobile,
        breakpoint: MOBILE_BREAKPOINT
    };
};

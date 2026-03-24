import { useState } from 'react';

export function usePasswordToggle() {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return {
        showPassword,
        togglePasswordVisibility,
    };
}

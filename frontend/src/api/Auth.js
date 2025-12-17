const API_URL = import.meta.env.VITE_API_URL;


export const signUpApi = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        let payload;
        try {
            payload = await response.json();
        } catch (e) {
            payload = null;
        }

        if (!response.ok) {
            const errMessage = payload && payload.message ? payload.message : response.statusText || 'Unknown error';
            throw new Error(`Error signing up: ${errMessage}`);
        }

        return [payload.message, payload.data];
    } catch (error) {
        console.error('Error in signUpApi:', error);
        throw error;
    }
};

export const signInApi = async (credentials) => {
    try {
        const response = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        let payload;
        try {
            payload = await response.json();
        } catch (e) {
            payload = null;
        }

        if (!response.ok) {
            const errMessage = "Thông tin đăng nhập không chính xác ";
            throw new Error(`Error signing in: ${errMessage}`);
        }

        return [payload.message, payload.data];
    } catch (error) {
        console.error('Error in signInApi:', error);
        throw error;
    }
};
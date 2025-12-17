const API_URL = import.meta.env.VITE_API_URL;

export const updateUserApi = async (user) => {
    const token = localStorage.getItem('authToken'); 
    const payload = { ...user };
    delete payload.username;
    delete payload.authorities;
    const response = await fetch(`${API_URL}/users/update/${user.username}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message || 'Update failed');
    }
    return [data.message, data.data];
};

export const fetchUsersApi = async () => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/users`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        let payload;
        try {
            payload = await response.json();
        } catch (e) {
            payload = null;
        }

        if (!response.ok) {
            const errMessage = payload ? payload.message : 'Unknown error';
            throw new Error(`Error fetching users: ${errMessage}`);
        }

        return [payload.message, payload.data];
    } catch (error) {
        console.error('Error in fetchUsersApi:', error);
        throw error;
    }
};

export const fetchUserByUsernameApi = async (username) => {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/users/${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        let payload;
        try {
            payload = await response.json();
        } catch (e) {
            payload = null;
        }

        if (!response.ok) {
            const errMessage = payload ? payload.message : 'Unknown error';
            throw new Error(`Error fetching user by username: ${errMessage}`);
        }

        return [payload.message, payload.data];
    } catch (error) {
        console.error('Error in fetchUserByUsernameApi:', error);
        throw error;
    }
};

export const deleteUserApi = async (username) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/users/delete/${username}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (response.status === 401 || response.status === 403) {
        throw new Error('User không đủ quyền hạn truy cập');
    }
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || 'Delete failed');
    }
    return [data.message, data.data];
}
import UserCard from './components/User/UserCard';
import { useState, useEffect } from 'react';
import { fetchUsersApi } from './api/Api.js';

// Ham nay se chi chay duy nhat 1 lan de khoi tao danh sach nguoi dung tu backend
const UserList = (props) => {
    const [users, setUsers] = useState([]);
    const handleSignOut = () => {
        localStorage.removeItem('authToken');
        props.setIsLoggedIn(false);
    }; 
    const fetchUsers = async () => {
        try {
            const [message, data] = await fetchUsersApi();
            setUsers(data || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };
    useEffect(() => {
        fetchUsers();
    }, []);
    
    return (
        <div> 
            <h1>User List</h1>
            <button onClick={handleSignOut}>Sign out</button>
            {users.map(user => (
                <UserCard key={user.id} user={user} rerender={fetchUsers} />
            ))}
        </div>
    );
}

export default UserList;
import React, { useState } from 'react'
import UserUpdate from '../Form/UserUpdate';
import { deleteUserApi } from '../../api/Api.js';
import './UserCard.css'

const UserCard = (props) => {
    const [user, setUser] = useState(props.user);
    const [showForm, setShowForm] = useState(false);
    const [deleteApiMessage, setDeleteApiMessage] = useState('');
    const updateUser = (newUser) => {
        setUser(newUser); 
    }
    const handleUpdateForm = (e) => {
        setShowForm(!showForm); 
        e.target.textContent = showForm ? 'Update thông tin ' : 'Đóng form';
    }

    const handleDeleteUser = async () => {
        try {
            const [message, data] = await deleteUserApi(props.user.username);
            setDeleteApiMessage(message || 'Xóa người dùng thành công');
            props.rerender(); 
        } catch (err) {
            console.error('Xóa người dùng thất bại ', err);
            setDeleteApiMessage(err.message || 'Lỗi khi xóa người dùng');
        }
    }
    return <>
        <div className="usercard">
            <h2>Username: {user.username}</h2>
            <p>First name: {user.firstname}</p> 
            <p>Last Name: {user.lastname}</p>
            <p>Phone Number: {user.phoneNum}</p>
            <p>Address: {user.address}</p>
            <p>DOB: {user.dob}</p>
            {deleteApiMessage && <p className="api-message">{deleteApiMessage}</p>}
            <button onClick={handleDeleteUser}>Xóa người dùng</button>
            <button onClick={handleUpdateForm}>Cập nhật thông tin</button>
            <div className={`userform-container ${showForm ? 'visible' : ''}`}>
            <UserUpdate className="userform" action="Update Info" user={user} updateUser={updateUser}/>
            </div>

        </div></>

}
export default UserCard
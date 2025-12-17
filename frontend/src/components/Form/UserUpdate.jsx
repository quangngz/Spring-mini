import React, { useState, useEffect } from "react";
import "./UserForm.css";
import { fetchUserByUsernameApi, updateUserApi } from '../../api/Api.js';
/**
 * Component de cap nhat thong tin nguoi dung
 * @param {*} props  user hien tai cua UserCard
 * @returns 
 */
const UserUpdate = (props) => {
  // Tao bufferUser de chua thong tin nguoi dung khi chua submit
  const [bufferUser, setBufferUser] = useState(props.user ? {...props.user} : {
    firstname: "",
    lastname: "",
    phoneNum: "",
    address: "",
    dob: ""
  });
  
  const [apiMessage, setApiMessage] = useState('');
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    if (props.user) setBufferUser({ ...props.user });
  }, [props.user]);

  const handleSubmit = async () => {
    try {
      const [message, data] = await updateUserApi(bufferUser);
      setApiMessage(message || 'Success');
      setApiData(data || null);
      const [fetchMessage, updatedUser] = await fetchUserByUsernameApi(bufferUser.username); // fetch tu database len lai
      props.updateUser(updatedUser); //  cap nhat lai user tren UserCard
    } catch (err) {
      console.error('Update failed', err);
      setApiMessage(err.message || 'Lỗi khi cập nhật thông tin');
      setApiData(null);
    }
  }

  return <div className="userform">
      <h2>"Cập nhật thông tin"</h2>
      {apiMessage && <p className="api-message">{apiMessage}</p>}

      <label htmlFor="firstnameForm">First name</label>
      <input type="text" id="firstnameForm" name="firstname" value={bufferUser.firstname} onChange={(e) => setBufferUser(b => ({...b, firstname: e.target.value}))} />

      <label htmlFor="lastnameForm">Last name</label>
      <input type="text" id="lastnameForm" name="lastname" value={bufferUser.lastname} onChange={(e) => setBufferUser(b => ({...b, lastname: e.target.value}))} />

      <label htmlFor="phoneNumForm">Phone Number</label>
      <input type="tel" id="phoneNumForm" name="phoneNum" value={bufferUser.phoneNum} onChange={(e) => setBufferUser(b => ({...b, phoneNum: e.target.value}))} />

      <label htmlFor="addressForm">Address</label>
      <input type="text" id="addressForm" name="address" value={bufferUser.address} onChange={(e) => setBufferUser(b => ({...b, address: e.target.value}))} />

      <label htmlFor="dobForm">Date of birth</label>
      <input type="date" id="dobForm" name="dob" value={bufferUser.dob} onChange={(e) => setBufferUser(b => ({...b, dob: e.target.value}))} />
  
      <button type="submit" onClick={handleSubmit} style={{backgroundColor: 'blue', color: 'white'}}>Sửa thông tin</button>
    
  </div>
}; 

export default UserUpdate;
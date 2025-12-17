import { signUpApi } from "../../api/Auth";
import { useState } from "react";


const SignUp = (props) => {
    // su dung useState o day de co the log len react. 
    const [apiMessage, setApiMessage] = useState('');
    const [apiData, setApiData] = useState(null);
    const [bufferUser, setBufferUser] = useState({ 
        username: "",
        firstname: "",
        lastname: "",
        phoneNum: "",
        address: "",
        dob: "",
        password: ""
    });

    const handleSubmit = async () => {
        try {
            const [message, data] = await signUpApi(bufferUser);
            setApiMessage(message || 'Đăng ký thành công');
            setApiData(null);
        } catch (err) {
            console.error('Sign up failed', err);
            setApiMessage(err.message || 'Lỗi khi đăng ký');
            setApiData(null);
        }
    }

    return <div className="userform">
    <h2>"Đăng ký"</h2>
    {apiMessage && <p className="api-message">{apiMessage}</p>}
    {apiData && <pre className="api-data" style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(apiData, null, 2)}</pre>}

    <label htmlFor="usernameForm">Username</label>
    <input type="text" id="usernameForm" name="username" value={bufferUser.username} onChange={(e) => setBufferUser(b => ({...b, username: e.target.value}))}/>

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

    <label htmlFor="passwordForm">Password</label>
    <input type="password" id="passwordForm" name="password" value={bufferUser.password} onChange={(e) => setBufferUser(b => ({...b, password: e.target.value}))} />
    <button type="submit" onClick={handleSubmit} className="signup-btn">Đăng ký</button>
    <button onClick={() => props.setSigningIn(true)} className="signin-btn">Chuyển sang Đăng nhập </button>

    </div>
}; 

export default SignUp;
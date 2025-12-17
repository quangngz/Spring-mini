import { signInApi } from "../../api/Auth";
import { useState } from "react";

const SignIn = (props) => {
    const [credentials, setCredentials] = useState({username: '', password: ''});
    const [apiMessage, setApiMessage] = useState('');
    
    const handleSubmit = async (event) => { 
        // console.log("Sign In clicked");
        if (credentials.username === '' || credentials.password === '') {
            setApiMessage('Vui lòng điền đầy đủ thông tin!');
            return;
        }
        try {
            const [message, token] = await signInApi(credentials);
            console.log(localStorage.getItem("authToken"));
            console.log(`SignIn: ${message}`); 
            localStorage.setItem('authToken', token);
            props.setSignIn(true); 
        } catch (err) { 
            // console.error('Đăng nhập thất bại: ', err);
            setApiMessage(err.message || 'Lỗi khi đăng nhập');
        }
    }
    
    return <div className="signin-form">
        <h2>Đăng nhập</h2>
        <p style={{color: 'red'}}>{apiMessage}</p>

        <label htmlFor="usernameSignIn">Username</label>
        <input type="text" id="usernameSignIn" name="username" 
        value={credentials.username} onChange={(e) => setCredentials({...credentials, username: e.target.value})}/>

        <label htmlFor="passwordSignIn">Password</label>
        <input type="password" id="passwordSignIn" name="password" 
        value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})}/>

        <button type="submit" onClick={handleSubmit} className="signin-btn">Đăng nhập</button>
        <button onClick={() => props.setSigningIn(false)} className="signup-btn">Chuyển sang Đăng ký</button>
    </div>   
}

export default SignIn;
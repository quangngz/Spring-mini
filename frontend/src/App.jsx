import SignIn from './components/Form/SignIn.jsx'
import SignUp from './components/Form/SignUp.jsx'
import UserList from './UserList.jsx';
import { useState } from 'react';

const App = () => {  
  const [isLoggedIn, setIsLoggedIn] = useState(false);// co nen display thong tin hay chua
  const [isSigningIn, setIsSigningIn] = useState(true); // dang o trang signin hay signup
  return isLoggedIn
    ? (<UserList setIsLoggedIn={setIsLoggedIn} />)
    : (isSigningIn ? <SignIn setSignIn={setIsLoggedIn} setSigningIn={setIsSigningIn} /> 
      : <SignUp setSignIn={setIsLoggedIn} setSigningIn={setIsSigningIn} />); 
};

export default App;

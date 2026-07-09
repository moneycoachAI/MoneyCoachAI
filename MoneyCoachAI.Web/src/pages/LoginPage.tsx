import {useState} from 'react';
import {loginUser} from '../services/authService';
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const handlelogin = async (
        e: React.FormEvent<HTMLFormElement>

    )=> {
        e.preventDefault();
        try {
            const response = await loginUser({
                email,
                password,
            });

            console.log(response);

            localStorage.setItem('token', response.token);

            navigate('/dashboard');

            alert('Login Successful');
        }catch (error) {
            console.error(error);
            alert('Login Failed');
        }
    };

    return (
        <div className="auth-page">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handlelogin}>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="primary-button">Login</button>
        </form>
      </div>
    </div>
    );
}

export default LoginPage;
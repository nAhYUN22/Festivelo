import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useToast } from '../App';
import axios from 'axios';
import jwt_decode from 'jwt-decode';
import '../styles/Login.css';

const API_URL = process.env.REACT_APP_SERVER_URL;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const tokenParam = params.get('token');
  
    if (tokenParam) {
      // 토큰 저장
      localStorage.setItem('token', tokenParam);
  
      // 토큰에서 사용자 정보 추출
      const decoded = jwt_decode(tokenParam);
      const userData = {
        _id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      };
  
      login(userData);
  
      toast.success('구글 로그인에 성공했습니다.');
      navigate('/');
    }
  }, [navigate, login, toast]);
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await axios.post(`${API_URL}/login`, {
      email: username,
      password: password
    });

    if (response.status === 200) {
      const token = response.data.token;
      localStorage.setItem('token', token);

      const decoded = jwt_decode(token);
      console.log('로그인 토큰 정보:', {
        토큰: token,
        만료시간: new Date(decoded.exp * 1000).toLocaleString(),
        현재시간: new Date().toLocaleString(),
        남은시간: Math.floor((decoded.exp * 1000 - Date.now()) / 1000 / 60) + '분',
        사용자: decoded.name,
        이메일: decoded.email,
        전체_디코딩_정보: decoded
      });
      const userData = {
        _id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      };

      login(userData);
      toast.success('로그인에 성공했습니다.');
      navigate('/');
    }
  } catch (error) {
    if (error.response) {
      toast.error(error.response.data.message);
    } else {
      toast.error('로그인 중 오류가 발생했습니다.');
    }
    console.error('Login error:', error);
  } finally {
    setLoading(false);
  }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/googlelogin`;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/signup`, {
        email: username,
        password: password,
        name: name
      });

      if (response.status === 201) {
        toast.success('회원가입에 성공했습니다.');
        const loginResponse = await axios.post(`${API_URL}/login`, {
          email: username,
          password: password
        });

        if (loginResponse.status === 200) {
          login(loginResponse.data.user);
          navigate('/');
        }
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message);

      } else {
        toast.error('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="festivelo-logo">FESTIVELO</h2>
        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          {isSignUp && (
            <div>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required={isSignUp}
              />
            </div>
          )}
          <div>
            <label>Email</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? (isSignUp ? '가입 중...' : '로그인 중...') :
              (isSignUp ? '회원가입' : '로그인')}
          </button>
        </form>
        <button className="google-button" onClick={handleGoogleLogin} disabled={loading}>
          <svg className="google-icon" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"></path><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"></path><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"></path><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"></path></g></svg>
          Sign in with Google
        </button>
        <button
          className="toggle-signup"
          onClick={() => {
            setIsSignUp(!isSignUp);
          }}
        >
          {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
        </button>
      </div>
    </div>
  );
}

export default Login;

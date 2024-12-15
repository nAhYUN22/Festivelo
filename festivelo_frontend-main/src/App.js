import React, { useState, createContext, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './pages/Login';
import MyPage from './pages/MyPage';
import jwt_decode from 'jwt-decode';
import './App.css';

const AuthContext = createContext();
const ToastContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function useToast() {
  return useContext(ToastContext);
}

// function App() {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState(null);

//   const login = (userData) => {
//     setUser(userData);
//     setIsAuthenticated(true);
//   };

//   //jwt 전 로그인-------------------------
//   // const logout = () => {
//   //   setUser(null);
//   //   setIsAuthenticated(false);
//   // };
//   //jwt 전 로그인-------------------------
//   };

//jwt 후 로그인-------------------------
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      return {
        _id: decoded.userId,
        email: decoded.email,
        name: decoded.name
      };
    }
    return null;
  });

  const [lastActivity, setLastActivity] = useState(Date.now());
  const INACTIVITY_TIMEOUT = 60000; // 1분

  // 사용자 활동 감지 함수
  const updateLastActivity = () => {
    setLastActivity(Date.now());
  };

  // 토큰 갱신 함수
  const refreshToken = async () => {
    try {
      console.log('토큰 갱신 시도...');
      const currentToken = localStorage.getItem('token');
      
      if (!currentToken) {
        console.log('토큰이 없습니다.');
        return;
      }

      const response = await fetch('http://localhost:8000/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        const decoded = jwt_decode(data.token);
        console.log('토큰 갱신 성공:', {
          만료시간: new Date(decoded.exp * 1000).toLocaleString(),
          현재시간: new Date().toLocaleString(),
          남은시간: Math.floor((decoded.exp * 1000 - Date.now()) / 1000 / 60) + '분'
        });
      } else {
        console.error('토큰 갱신 실패:', response.status);
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
    }
  };

const logout = () => {
  localStorage.removeItem('token');
  setUser(null);
  setIsAuthenticated(false);
};


useEffect(() => {
  if (isAuthenticated) {
    const checkInactivity = () => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > INACTIVITY_TIMEOUT) {
        logout();
        toast.info('장시간 활동이 없어 자동 로그아웃되었습니다.');
      }
    };

    const updateActivity = () => {
      setLastActivity(Date.now());
    };

    // 사용자 활동 감지를 위한 이벤트 리스너
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);

    // 비활성 상태 체크 인터벌 설정 (5초마다)
    const inactivityCheck = setInterval(checkInactivity, 5000);

    return () => {
      // 이벤트 리스너 및 인터벌 정리
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(inactivityCheck);
    };
  }
}, [isAuthenticated, lastActivity, logout]);

  // 비활성 시간 체크
  useEffect(() => {
    const checkInactivity = () => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > process.env.REACT_APP_TOKEN_EXPIRATION * 60 * 1000) { // 토큰 만료시간: REACT_APP_TOKEN_EXPIRATION 확인
        logout();
        toast.info('장시간 활동이 없어 로그아웃되었습니다.');
      }
    };

    const interval = setInterval(checkInactivity, 30000); // 30초마다 체크
    return () => clearInterval(interval);
  }, [lastActivity]);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      <ToastContext.Provider value={toast}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/my" element={<PrivateRoute><MyPage /></PrivateRoute>} />
          </Routes>
        </Router>
        <ToastContainer position='bottom-center' autoClose={3000} />
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');
  return isAuthenticated && token ? children : <Navigate to="/login" />;
}

export default App;

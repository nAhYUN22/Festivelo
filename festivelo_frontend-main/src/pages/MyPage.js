import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { toast } from 'react-toastify';
import MyFavoritesList from '../components/MyFavoritesList';
import MyReviewsList from '../components/MyReviewsList';
import '../styles/MyFavoritesList.css';
import { FaPen } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_SERVER_URL;

const MyPage = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/userManagement/changePassword`,
        {
          email: user.email,
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        },
        { withCredentials: true }
      );

      toast.success(response.data.message);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(
        error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.'
      );
    }
  };

  const handleNameEdit = async () => {
    if (!newName.trim()) {
      toast.error('닉네임을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const response = await axios.post(
        `${API_URL}/userManagement/change`,
        {
          email: user.email,
          newName: newName.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      if (response.status === 201 || response.status === 200) {
        const updatedUser = response.data.user;

        login({
          ...user,
          name: updatedUser.name
        });

        setIsEditingName(false);
        toast.success('닉네임이 변경되었습니다.');
      }
    } catch (error) {
      console.error('닉네임 변경 오류:', error);
      if (error.response?.status === 401) {
        toast.error('로그인이 필요합니다.');
        navigate('/login');
      } else {
        toast.error(
          error.response?.data?.message || '닉네임 변경에 실패했습니다.'
        );
      }
    }
  };

  return (
    <div className="mypage">
      <div className="mypage-container">
        <div className="mypage-sidebar">
          <div className="profile-summary">
            <div className="profile-image">
              ✈️
            </div>
            {isEditingName ? (
              <div className="name-edit">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="새 닉네임 입력"
                />
                <button onClick={handleNameEdit}>저장</button>
                <button onClick={() => setIsEditingName(false)}>취소</button>
              </div>
            ) : (
              <div className="name-display">
                <h3>{user.name}</h3>
                <FaPen
                  className="edit-icon"
                  onClick={() => {
                    setNewName(user.name);
                    setIsEditingName(true);
                  }}
                />
              </div>
            )}
          </div>
          <nav className="mypage-nav">
            <button
              className={`nav-button`}
              onClick={() => navigate('/')}
            >
              홈
            </button>
            <button
              className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              프로필 관리
            </button>
            <button
              className={`nav-button ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setActiveTab('favorites')}
            >
              즐겨찾기
            </button>
            <button
              className={`nav-button ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              내 리뷰
            </button>
            <button
              className="nav-button logout"
              onClick={logout}
            >
              로그아웃
            </button>
          </nav>
        </div>

        <div className="mypage-content">
          {activeTab === 'profile' ? (
            <div className="profile-section">
              <h2>프로필 관리</h2>

              <div className="password-section">
                <h3>비밀번호 변경</h3>
                <div className="password-form">
                  <label>
                    현재 비밀번호
                    <input
                      type="password"
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label>
                    새 비밀번호
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handleInputChange}
                    />
                  </label>
                  <label>
                    새 비밀번호 확인
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </label>
                  <button
                    className="change-password-button"
                    onClick={handleChangePassword}
                  >
                    비밀번호 변경
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'favorites' ? (
            <div className="favorites-section">
              <h2>즐겨찾기</h2>
              <MyFavoritesList userId={user._id} />
            </div>
          ) : (
            <div className="reviews-section">
              <h2>내 리뷰</h2>
              <MyReviewsList userId={user._id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
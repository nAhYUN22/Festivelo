import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaStar } from 'react-icons/fa';
import '../styles/MyPage.css';

const API_URL = process.env.REACT_APP_SERVER_URL;

const MyFavoritesList = ({ userId, username }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/favorites?userId=${userId}`,
                    { withCredentials: true }
                );
                console.log('받은 즐겨찾기 데이터:', response.data);
                const favoritesData = Array.isArray(response.data.data) ? response.data.data : [];
                setFavorites(favoritesData);
                setLoading(false);
            } catch (error) {
                console.error('즐겨찾기 조회 에러:', error);
                if (error.response) {
                    console.error('에러 응답:', error.response.data);
                    console.error('에러 상태:', error.response.status);
                }
                setError('즐겨찾기를 불러오는데 실패했습니다.');
                toast.error('즐겨찾기를 불러오는데 실패했습니다.');
                setLoading(false);
            }
        };

        if (userId) {
            fetchFavorites();
        }
    }, [userId]);

    const handleDeleteFavorite = async (placeId) => {
        try {
            await axios.delete(
                `${API_URL}/favorites/${placeId}`,
                { 
                    data: { userId },
                    withCredentials: true 
                }
            );
            setFavorites(favorites.filter(favorite => favorite.placeId !== placeId));
            toast.success('즐겨찾기가 삭제되었습니다.');
        } catch (error) {
            console.error('즐겨찾기 삭제 에러:', error);
            toast.error('즐겨찾기 삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return <div className="loading">로딩 중...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="my-favorites-container">
            <h2>{username}</h2>
            <div className="favorites-list">
                {favorites.length === 0 ? (
                    <p className="no-favorites">즐겨찾기한 장소가 없습니다.</p>
                ) : (
                    favorites.map((favorite) => (
                        <div key={favorite.placeId} className="favorite-item">
                            <div className="favorite-header">
                                <h3>{favorite.placeName}</h3>
                                <button 
                                    onClick={() => handleDeleteFavorite(favorite.placeId)}
                                    className="delete-favorite-btn"
                                >
                                    삭제
                                </button>
                            </div>
                            <div className="favorite-content">
                                <div className="favorite-info">
                                    <FaStar color="#ffd700" size={16} />
                                    <span className="favorite-type">
                                        {favorite.typeId === 12 ? '관광지' : '축제'}
                                    </span>
                                </div>
                                <p className="favorite-address">{favorite.placeAddress}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyFavoritesList;
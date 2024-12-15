import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaStar } from 'react-icons/fa';
import '../styles/MyPage.css';

const API_URL = process.env.REACT_APP_SERVER_URL;

const MyReviewsList = ({ userId, username }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/review/user/${userId}`, // 경로 수정
          { withCredentials: true }
        );
        console.log('받은 리뷰 데이터:', response.data);
        const reviewsData = Array.isArray(response.data) ? response.data : [];
        setReviews(reviewsData);
        setLoading(false);
      } catch (error) {
        console.error('리뷰 조회 에러:', error);
        if (error.response) {
          console.error('에러 응답:', error.response.data);
          console.error('에러 상태:', error.response.status);
        }
        setError('리뷰를 불러오는데 실패했습니다.');
        toast.error('리뷰를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  const handleDeleteReview = async (reviewId) => {
    try {
      await axios.delete(
        `${API_URL}/api/review/${reviewId}`, // 경로 수정
        { withCredentials: true }
      );
      setReviews(reviews.filter(review => review._id !== reviewId));
      toast.success('리뷰가 삭제되었습니다.');
    } catch (error) {
      console.error('리뷰 삭제 에러:', error);
      toast.error('리뷰 삭제에 실패했습니다.');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        color={index < rating ? "#ffd700" : "#e4e5e9"}
        size={16}
      />
    ));
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="my-reviews-container">
      <h2>{username}님의 리뷰 목록</h2>
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">작성한 리뷰가 없습니다.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <h3>{review.place_name}</h3>
                <button 
                  onClick={() => handleDeleteReview(review._id)}
                  className="delete-review-btn"
                >
                  삭제
                </button>
              </div>
              <div className="review-content">
                <div className="review-info">
                  <div className="review-rating">
                    {renderStars(review.rating)}
                  </div>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p>{review.comment}</p>
                <div className="location">위치: {review.place || '정보 없음'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReviewsList; 
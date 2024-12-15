import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import '../styles/PlaceReview.css';

const API_URL = process.env.REACT_APP_SERVER_URL;

const PlaceReview = ({ placeId, placeName }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  useEffect(() => {
    if (placeId) {
      fetchReviews();
    }
  }, [placeId]);

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const response = await axios.get(`${API_URL}/api/review/place/${placeId}`);
      console.log(response.data);
      setReviews(response.data);
    } catch (error) {
      console.error('리뷰를 불러오는데 실패했습니다:', error);
      toast.error('리뷰를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.trim() || rating === 0) {
      toast.error('평점과 리뷰 내용을 모두 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      if (!user) {
        toast.error('로그인이 필요한 서비스입니다.');
        return;
      }

      const reviewData = {
        user_id: user._id,
        place_id: String(placeId),
        place_name: placeName,
        rating: Number(rating),
        comment: newReview.trim()
      };

      console.log('전송할 리뷰 데이터:', reviewData);

      try {
        const response = await axios.post(`${API_URL}/api/review`, reviewData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('서버 응답:', response);
        
        if (response.status === 201) {
          toast.success('리뷰가 성공적으로 작성되었습니다!');
          await fetchReviews();
          setNewReview('');
          setRating(0);
          setHover(0);
        }
      } catch (error) {
        console.error('서버 에러 응답:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          fullError: error,
          errorDetails: error.response?.data?.error || error.response?.data?.message
        });
        throw error;
      }
    } catch (error) {
      console.error('리뷰 작성 에러:', error);
      const errorMessage = error.response?.data?.error || 
                         error.response?.data?.message || 
                         '리뷰 작성에 실패했습니다. 다시 시도해주세요.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/review/${reviewId}`);
      toast.success('리뷰가 삭제되었습니다.');
      setReviews(reviews.filter(review => review._id !== reviewId));
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      toast.error('리뷰 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="place-reviews">
      <h3 className='title'>리뷰</h3>
      
      <form onSubmit={handleSubmit} className="review-form">
        <div className="rating-input">
          <label>평점:</label>
          <div className="star-rating">
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <label key={index}>
                  <input
                    type="radio"
                    name="rating"
                    value={ratingValue}
                    onClick={() => setRating(ratingValue)}
                  />
                  <FaStar
                    className="star"
                    color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                    size={25}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(0)}
                  />
                </label>
              );
            })}
          </div>
        </div>
        
        <textarea
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
          placeholder="리뷰를 작성해주세요"
          rows="3"
        />
        
        <button 
          type="submit" 
          disabled={loading || !newReview.trim() || rating === 0 || !user}
        >
          {loading ? '작성 중...' : '리뷰 작성'}
        </button>
      </form>

      <div className="reviews-list">
        {isLoadingReviews ? (
          <p className="loading-reviews">리뷰를 불러오는 중...</p>
        ) : reviews.length === 0 ? (
          <p className="no-reviews">아직 리뷰가 없습니다.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <div className="review-rating">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      className="star"
                      color={index < review.rating ? "#ffc107" : "#e4e5e9"}
                      size={20}
                    />
                  ))}
                </div>
                <div className="review-info">
                  <span className="review-author">{review.user || '익명'}</span>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                  {user && user._id === review.user_id?._id && (
                    <button 
                      onClick={() => handleDeleteReview(review._id)}
                      className="delete-review-btn"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>
              <p className="review-content">{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaceReview;
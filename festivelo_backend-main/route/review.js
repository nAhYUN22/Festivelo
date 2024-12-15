// routes/review.js
const express = require('express');
const {
    createReview,
    getReviewsByPlace,
    getReviewsByUser,
    updateReview,
    deleteReview
} = require('../controllers/ReviewController');

const router = express.Router();

// 리뷰 API 테스트 방법:

// 1. 리뷰 생성 테스트
// POST http://localhost:3000/api/review
// Body: {
//   "user_id": "사용자ID",
//   "place_id": "장소ID", 
//   "rating": 5,
//   "comment": "좋은 장소였습니다!"
// }
router.post('/', createReview);

// 2. 특정 장소의 리뷰 조회 테스트
// GET http://localhost:3000/api/review/place/장소ID
router.get('/place/:place_id', getReviewsByPlace);

// 3. 특정 사용자의 리뷰 조회 테스트  
// GET http://localhost:3000/api/review/user/사용자ID
router.get('/user/:user_id', getReviewsByUser);

// 4. 리뷰 수정 테스트
// PUT http://localhost:3000/api/review/리뷰ID
// Body: {
//   "rating": 4,
//   "comment": "수정된 리뷰입니다."
// }
router.put('/:id', updateReview);

// 5. 리뷰 삭제 테스트
// DELETE http://localhost:3000/api/review/리뷰ID
router.delete('/:id', deleteReview);

module.exports = router;

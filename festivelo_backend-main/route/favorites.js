const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
//const authMiddleware = require('../middleware/auth');
//만약에 쓰려면, router.post('/', authMiddleware, favoriteController.addFavorite);이런식으로 써야함.

// 즐겨찾기 추가
router.post('/', favoriteController.addFavorite);
// POST http://localhost:8000/favorites
// Request Body:
// {
//   "userId": "사용자ID",
//   "placeId": "장소ID",
//   "placeName": "장소이름",
//   "placeAddress": "장소주소",
//   "areaCode": "지역코드"
// }

// 사용자의 즐겨찾기 목록 조회
router.get('/', favoriteController.getFavorites);
// GET http://localhost:8000/favorites?userId=사용자ID

// 특정 즐겨찾기 삭제
router.delete('/:placeId', favoriteController.deleteFavorite);
// DELETE http://localhost:8000/favorites/장소ID
// Request Body:
// {
//   "userId": "사용자ID"
// }

module.exports = router;
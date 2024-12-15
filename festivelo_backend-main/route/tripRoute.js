const express = require('express');
const router = express.Router();
const Trip = require('../models/trips'); // Trip 스키마 참조
const User = require('../models/user'); // User 스키마 참조

const authenticateToken = require('../middleware/authMiddleware.js');

const tripController = require('../controllers/TripController');

// **GET**: 전체 여행 목록 조회
router.get('/trips', authenticateToken, tripController.getAllTrips);

// **GET**: 특정 여행 계획 조회
router.get('/trips/:id', tripController.getTripById);

// **POST**: 새로운 여행 계획 생성
router.post('/trips', tripController.createTrip);

// **PUT**: 특정 여행 계획 수정(협업자도 수정할 수 있게)
router.put('/trips/:id', tripController.updateTrip);

// **DELETE**: 특정 여행 계획 삭제
router.delete('/trips/:id', tripController.deleteTrip);

// **POST**: 공동 작업자 추가
router.post('/trips/:id/collaborators', tripController.addCollaborator);

// **PUT**: 하루 계획 추가
router.put('/trips/:id/plans/day', tripController.addDayPlan);

module.exports = router;
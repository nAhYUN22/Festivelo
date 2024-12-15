const Favorite = require('../models/favorite');
const mongoose = require('mongoose'); 


const favoriteController = {
    // 즐겨찾기 추가
    async addFavorite(req, res) {
        try {
            const { userId, placeId, placeName, placeAddress, areaCode, typeId, coordinates } = req.body;
            
            const newFavorite = new Favorite({
                userId,
                placeId,
                placeName,
                placeAddress,
                typeId,
                areaCode,
                coordinates
            });
            
            await newFavorite.save();
            
            res.status(201).json({
                success: true,
                data: newFavorite
            });
        } catch (error) {
            console.error('즐겨찾기 추가 실패:', error);
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: '이미 즐겨찾기에 추가된 장소입니다.'
                });
            }
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    },

    // 사용자의 즐겨찾기 목록 조회
    async getFavorites(req, res) {
        try {
            const { userId } = req.query;
            
            // userId를 ObjectId로 변환
            const userObjectId = new mongoose.Types.ObjectId(userId);
            
            const favorites = await Favorite.find({ userId: userObjectId })
                .sort({ createdAt: -1 });
            
            res.status(200).json({
                success: true,
                data: favorites
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    },

    // 즐겨찾기 삭제
    async deleteFavorite(req, res) {
        try {
            const { userId } = req.body;
            const { placeId } = req.params;
            
            // userId와 placeId만으로 문서를 찾아 삭제
            const deletedFavorite = await Favorite.findOneAndDelete({
                userId,
                placeId
            });
            
            if (!deletedFavorite) {
                return res.status(404).json({
                    success: false,
                    message: '해당 즐겨찾기를 찾을 수 없습니다.'
                });
            }
            
            res.status(200).json({
                success: true,
                message: '즐겨찾기가 삭제되었습니다.'
            });
        } catch (error) {
            console.error('즐겨찾기 삭제 실패:', error);  // 에러 로깅 추가
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다.'
            });
        }
    }
};

module.exports = favoriteController;
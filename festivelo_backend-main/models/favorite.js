const mongoose = require('mongoose');
const User = require('./user');

const favoriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    placeId: {
        type: String,
        required: true
    },
    placeName: {
        type: String,
        required: true
    },
    placeAddress: {
        type: String,
        required: true
    },
    areaCode: {
        type: Number,
        required: true
    },
    typeId: {
        type: Number,
        required: true
    },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    }
}, {
    timestamps: true
});

// 한 사용자가 같은 여행을 중복해서 즐겨찾기 할 수 없도록 복합 인덱스 설정
favoriteSchema.index({ userId: 1, placeId: 1 }, { unique: true });

// 모델 이름은 대문자로 시작하는 단수형으로 지정하는 것이 관례입니다
module.exports = mongoose.model('Favorite', favoriteSchema);

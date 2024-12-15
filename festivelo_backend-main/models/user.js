const mongoose = require('mongoose');

//사용자 스키마 및 모델 설정
const userSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    name: String,
    password: String,
    //profilePicture: String,
    // 리프레시 토큰 필드 추가
});

module.exports = mongoose.model('User', userSchema);

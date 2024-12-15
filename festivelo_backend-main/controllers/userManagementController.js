const express = require('express');
const User = require('../models/user');
const Trip = require('../models/trips');
const Review = require('../models/review');
const bcrypt = require('bcrypt');
const path = require('path'); // 경로 처리 모듈 추가

const router = express.Router();


//사용자 이름 변경(닉네임)
exports.changeName = async (req, res) => {
    const { email, newName } = req.body;

    const user = await User.findOne({ email });

    try {
        if (!email || !newName) {
            return res.status(400).json({message: '유효하지 않은 요청입니다.'});
        }


        user.name = newName;
        await user.save();

        res.status(200).json({ message: ' 이름이 성공적으로 변경되었습니다.', user});
        console.log('이름 변경 완료', user);
    } catch(error) {
        console.error('이름 변경 오류', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.'});
    }
};


// 비밀번호 변경 
exports.changePassword = async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || !user.password) {
            return res.status(400).json({ message: '사용자를 찾을 수 없거나 잘못된 요청입니다.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '기존 비밀번호가 일치하지 않습니다.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        await user.save();
        res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
        console.log('비밀번호 변경 완료',user);
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};

// 사용자 삭제
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // 사용자 삭제
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        // 사용자가 생성한 여행 데이터 삭제 또는 상태 변경
        await Trip.deleteMany({ create_by: userId });
        //사용자가 작성한 리뷰 제거
        await Review.deleteMany({ create_by: userId});

        // 사용자가 공동 작업자로 포함된 경우 업데이트
        await Trip.updateMany(
            { collaborators: userId }, //필터링 - 지우려는 유저 아이디가 공동 작업자로 포함된경우
            { $pull: { collaborators: userId } } // 공동 작업자 목록에서 제거
        );
        console.log('이 사용자를 삭제합니다: ',user);
        res.status(200).json({ message: '사용자가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
};



const Review = require('../models/review');

// 1. 리뷰 생성
exports.createReview = async (req, res) => {
    try {
        const { user_id, place_id, place_name, trip_id, rating, comment } = req.body;

        // 동일한 사용자가 같은 장소에 이미 리뷰를 작성했는지 확인
        const existingReview = await Review.findOne({ user_id, place_id });
        if (existingReview) {
            return res.status(400).json({ message: '이미 해당 장소에 대한 리뷰를 작성하셨습니다.' });
        }

        const newReview = new Review({
            user_id,
            place_id,
            place_name,
            trip_id,
            rating,
            comment
        });

        await newReview.save();
        res.status(201).json({ message: '리뷰가 성공적으로 생성되었습니다.', review: newReview });
    } catch (error) {
        console.error('리뷰 작성 실패', error);
        res.status(500).json({ error: error.message });
    }
};

// 2. 특정 장소의 모든 리뷰 조회
exports.getReviewsByPlace = async (req, res) => {
    try {
        const { place_id } = req.params;

        const reviews = await Review.find({ place_id })
            .populate('user_id', 'name') // 사용자 이름만 포함

        // 리뷰 데이터를 가공하여 클라이언트가 필요한 정보만 반환
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            user: review.user_id?.name || 'Unknown User', // 사용자 이름
            place: review.place_name || 'Unknown Place', // 장소 이름
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt
        }));

        res.status(200).json(formattedReviews);
        console.log('리뷰 조회 결과:', formattedReviews);
    } catch (error) {
        console.error('리뷰 조회 실패', error);
        res.status(500).json({ error: error.message });
    }
};


// 3. 특정 사용자의 모든 리뷰 조회
exports.getReviewsByUser = async (req, res) => {
    try {
        const { user_id } = req.params;

        // 리뷰 데이터 조회
        const reviews = await Review.find({ user_id })
            .populate('user_id', 'name'); // 사용자 이름

        // 데이터 가공
        const formattedReviews = reviews.map(review => ({
            _id: review._id,
            user: review.user_id?.name || 'Unknown User',
            place: review.place_name || 'Unknown Place', // place_name 추가
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt
        }));

        res.status(200).json(formattedReviews);
    } catch (error) {
        console.error('사용자 리뷰 조회 실패', error);
        res.status(500).json({ error: error.message });
    }
};



// 4. 리뷰 수정
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        const updatedReview = await Review.findByIdAndUpdate(
            id,
            { rating, comment },
            { new: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '리뷰가 성공적으로 수정되었습니다.', review: updatedReview });
        console.log('리뷰 수정 성공', updatedReview);
    } catch (error) {
        console.error('리뷰 수정 실패',error);
        res.status(500).json({ error: error.message });
    }
};

// 5. 리뷰 삭제
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedReview = await Review.findByIdAndDelete(id);

        if (!deletedReview) {
            return res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' });
        }

        res.status(200).json({ message: '리뷰가 성공적으로 삭제되었습니다.' });
        console.log('리뷰 삭제 완료',deletedReview);
    } catch (error) {
        console.error('리뷰 삭제 실패', error);
        res.status(500).json({ error: error.message });
    }
};

const Trip = require('../models/trips');
const User = require('../models/user');

// 전체 여행 목록 조회
const getAllTrips = async (req, res) => {
    try {
        const userId = req.user.userId;

        const trips = await Trip.find({
            $or: [
                { create_by: userId },
                { collaborators: userId }
            ]
        }).populate('create_by collaborators');

        res.status(200).json(trips);
    } catch (err) {
        console.error('여행 목록 조회 오류:', err);
        res.status(500).json({ error: err.message });
    }
};

// 특정 여행 계획 조회
const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id).populate('create_by collaborators');
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        res.status(200).json(trip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 새로운 여행 계획 생성
const createTrip = async (req, res) => {
    try {
        const { name, start_date, end_date, create_by, location, collaborators } = req.body;
        const trip = new Trip({ name, start_date, end_date, create_by, location, collaborators });
        const savedTrip = await trip.save();
        res.status(201).json(savedTrip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 특정 여행 계획 수정
const updateTrip = async (req, res) => {
    try {
        const { name, start_date, end_date, collaborators } = req.body;
        const updatedTrip = await Trip.findByIdAndUpdate(
            req.params.id,
            { name, start_date, end_date, collaborators },
            { new: true }
        );
        if (!updatedTrip) return res.status(404).json({ message: 'Trip not found' });
        res.status(200).json(updatedTrip);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 특정 여행 계획 삭제
const deleteTrip = async (req, res) => {
    try {
        const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
        if (!deletedTrip) return res.status(404).json({ message: 'Trip not found' });
        res.status(200).json({ message: 'Trip deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 공동 작업자 추가
const addCollaborator = async (req, res) => {
    try {
        const { collaboratorEmail } = req.body;
        
        const collaborator = await User.findOne({ email: collaboratorEmail });
        if (!collaborator) {
            return res.status(404).json({ message: '해당 이메일의 사용자를 찾을 수 없습니다.' });
        }

        const trip = await Trip.findById(req.params.id).populate('create_by');
        if (!trip) {
            return res.status(404).json({ message: '여행을 찾을 수 없습니다.' });
        }

        const isAlreadyCollaborator = trip.collaborators.some(
            collab => collab.toString() === collaborator._id.toString()
        );
        
        if (isAlreadyCollaborator) {
            return res.status(400).json({ message: '이미 공동작업자로 등록된 사용자입니다.' });
        }

        if (trip.create_by._id.toString() === collaborator._id.toString()) {
            return res.status(400).json({ message: '생성자는 공동작업자로 추가할 수 없습니다.' });
        }

        trip.collaborators.push(collaborator._id);
        await trip.save();
        
        const updatedTrip = await Trip.findById(trip._id)
            .populate('create_by')
            .populate('collaborators');
            
        res.status(200).json(updatedTrip);
    } catch (err) {
        console.error('공동작업자 추가 오류:', err);
        res.status(500).json({ error: err.message });
    }
};

// 하루 계획 추가
const addDayPlan = async (req, res) => {
    try {
        const { dayKey, places, route } = req.body; // 요청 데이터
        const trip = await Trip.findById(req.params.id); // Trip 찾기

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // `plans` 디버깅
        console.log('Existing Plans:', JSON.stringify(trip.plans, null, 2));

        // `Map`을 사용하여 dayKey 접근
        const currentDay = trip.plans.get(dayKey);
        if (!currentDay) {
            return res.status(404).json({ message: `Day ${dayKey} not found in trip plans` });
        }

        // 데이터 업데이트
        if (places) currentDay.places = places;
        if (route) currentDay.route = route;

        // `Map`에 업데이트된 day 데이터 설정
        trip.plans.set(dayKey, currentDay);

        // Mongoose에 변경 사항 알림
        trip.markModified('plans');

        console.log('Before Save:', JSON.stringify(trip.plans.get(dayKey), null, 2));

        // 변경 사항 저장
        const updatedTrip = await trip.save();

        console.log('After Save:', JSON.stringify(updatedTrip.plans.get(dayKey), null, 2));

        res.status(200).json(updatedTrip.plans.get(dayKey)); // 수정된 day 데이터 반환
    } catch (err) {
        console.error('Error updating day:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip,
    addCollaborator,
    addDayPlan,
};

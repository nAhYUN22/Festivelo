const mongoose = require('mongoose');
const User = require('./user'); // user.js 참조


// 하루 계획 스키마 정의( day1, day2...)
const daySchema = new mongoose.Schema({
    places:[], // 장소 배열
    route: [] // 장소 순서 관리
});

const tripSchema = new mongoose.Schema({
    name: { type: String, required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    location: { type: String, required: true },
    create_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    plans: {
        type: Map, // Object 대신 Map 사용
        of: {
            places: [
                {
                    id: { type: Number, required: true },
                    type: { type: Number, required: true },
                    name: { type: String, required: true },
                    address: { type: String, required: true },
                    coordinates: {
                        lat: { type: Number, required: true },
                        lng: { type: Number, required: true }
                    }
                }
            ],
            route: [{ type: Number }]
        },

    }
});



// 여행 일자에 따라 plans 자동 생성 (Pre-save Hook)
tripSchema.pre('save', function (next) {
    const trip = this;

    if (trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date);
        const end = new Date(trip.end_date);

        // // 기존 `plans` 데이터를 유지
        // const plans = trip.plans || new Map();
        // plans가 없는 경우 초기화
        const plans = trip.plans instanceof Map ? trip.plans : new Map(Object.entries(trip.plans || {}));
        let currentDay = 1;

        // 새 day만 추가
        for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
            const dayKey = `day${currentDay}`;
            if (!plans.has(dayKey)) {
                plans.set(dayKey, { places: [], route: [] });
            }
            currentDay++;
        }

        trip.plans = plans; // 업데이트된 데이터를 설정
    }

    console.log('Final Plans after Pre-save Hook:', JSON.stringify(Array.from(trip.plans.entries()), null, 2));
    next();
});


module.exports = mongoose.model('Trip', tripSchema);
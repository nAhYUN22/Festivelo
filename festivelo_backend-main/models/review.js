const mongoose = require('mongoose');
const Trip = require('./trips');
const User = require('./user');

const ReviewSchema = new mongoose.Schema({
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    place_id: { 
        type: String, 
        required: true 
    },
    place_name: {
        type: String,
        required: true
    },
    rating: { 
        type: Number, 
        required: true,
        min: 1,
        max: 5 
    },
    comment: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});


module.exports = mongoose.model('Review', ReviewSchema);

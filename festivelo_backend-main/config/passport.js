require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

// Google OAuth 설정
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${process.env.PORT}/googlelogin/redirect`
}, async (_, __, profile, done) => {
    const { id, displayName, emails} = profile;
    try {
        // 사용자가 존재하는지 확인
        let user = await User.findOne({ googleId: id });
        if (!user) {
            // 새로운 사용자라면 DB에 저장
            user = await User.create({
                googleId: id,
                displayName,
                email: emails[0].value,
            });
        }
        done(null, user);
    } catch (error) {
        done(error, false);
    }
}));

// 세션에 사용자 정보를 저장
// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser(async (id, done) => {
//     const user = await User.findById(id);
//     done(null, user);
// });

module.exports = passport;

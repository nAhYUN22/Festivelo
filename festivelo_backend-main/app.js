const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('./config/passport');
const jwt = require('jsonwebtoken');
const http = require('http');
const WebSocketServer = require('./WebSocket');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Models
const User = require('./models/user');
const Trip = require('./models/trips');
const Favorite = require('./models/favorite');

// Routes
const userManagementRoutes = require('./route/userManagement');
const tripRoutes = require('./route/tripRoute');
const reviewRoutes = require('./route/review');
const favoriteRoutes = require('./route/favorites');

// Middleware
const authenticateToken = require('./middleware/authMiddleware.js');

// Middleware Setup
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());

// Routes Setup
app.use('/userManagement', authenticateToken, userManagementRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/review', reviewRoutes);
app.use('/favorites', favoriteRoutes);

// Environment Variables Check
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

const secretKey = process.env.JWT_SECRET;

// db connect
mongoose
  .connect(process.env.mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "festivelo_DB" // 이 이름으로 db가 생성됩니다.
  })
  .then(() => {console.log(`MongoDB connected to festivelo_DB`);
  // DB 연결 확인
  const db = mongoose.connection;
  console.log('Current database:', db.name);
})
  .catch((err) => console.error(err));


// Google 로그인 라우트
app.get('/googlelogin',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);


//jwt-----------------------------------------
app.get('/googlelogin/redirect',
    passport.authenticate('google', { failureRedirect: '/', session: false }),
    (req, res) => {
        const token = jwt.sign(
            { userId: req.user._id, email: req.user.email, name: req.user.name },
            secretKey,
            { expiresIn: process.env.TOKEN_EXPIRATION }
        );

        //토큰 생성 정보 로깅
        console.log('구글 로그인 토큰 생성:', {
            토큰: token,
            사용자: {
                이름: req.user.name,
                이메일: req.user.email,
                ID: req.user._id
            },
            생성시간: new Date().toLocaleString()
        });
        
        res.redirect(`http://localhost:3000/login#token=${token}`);
        console.log(`구글 로그인 성공: ${req.user.email}`);
    }
);
//-------------------------------------------------

// 로그아웃
app.get('/logout', (req, res) => {

    res.clearCookie('token');
    res.redirect('/');
});

// 대시보드
app.get('/dashboard', authenticateToken, (req, res) => {
    //세션 로그인


    res.send(`
        <h1>Welcome, ${userName}}</h1>
        <a href="/conf_name/change">사용할 이름 변경</a>
        <br>
        ${hasPassword ? '<a href="/conf_password/change">비밀번호 변경</a>' : ''}
        <br>
        <a href="/logout">Logout</a>
    `);
});


//jwt
app.get('/conf_password', authenticateToken, (req, res) => {
    res.sendFile(__dirname + '/public/conf_password.html');
});


//홈 - index.html
app.use(express.static('public'));

//일반 로그인
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('로그인 요청:', email, password);  // 추가된 로그
    try {
        // 사용자가 존재하는지 확인
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: '사용자를 찾을 수 없습니다.' });
        }
        //password 정보 없는 유저 -> 구글 로그인 사용자
        if (!user.password) {
            return res.status(400).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        

        // 비밀번호 검증
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
        }

        //jwt---------------------------------------
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            secretKey,
            { expiresIn: process.env.TOKEN_EXPIRATION }
        );

        res.status(200).json({
            message: '로그인 성공',
            token: token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});



//웹사이트 내 회원가입
app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        // 존재하는 사용자 확인
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: '이미 존재하는 사용자입니다.' });
        }

        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 새 사용자 생성 및 저장
        user = new User({
            email,
            password: hashedPassword, // 암호화된 비밀번호 저장
            name,
        });
        await user.save();


        res.status(201).json({ message: '회원가입 성공' });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
});

//토큰 갱신
app.post('/refresh-token', authenticateToken, (req, res) => {
  try {
    console.log('토큰 갱신 요청 받음:', {
      사용자: req.user.email,
      요청시간: new Date().toLocaleString()
    });

    const newToken = jwt.sign(
      { 
        userId: req.user.userId, 
        email: req.user.email, 
        name: req.user.name 
      },
      secretKey,
      { expiresIn: process.env.TOKEN_EXPIRATION }
    );
    console.log('토큰 갱신 성공, 새로운 토큰:', newToken);
    res.json({ token: newToken });
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    res.status(500).json({ message: '토큰 갱신 실패' });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer(server);

server.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`);
});

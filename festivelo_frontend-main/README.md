# Festivelo_frontend

## About
아주대학교 소프트웨어학과 웹시스템설계 팀프로젝트 Team 4
- **김평주**: frontend 개발
- **조예진**: frontend 개발
- 이나현: backend 개발
- 김진영: backend 개발

## Getting started
1. Clone the repository
```bash
git clone https://git.ajou.ac.kr/festivelo/festivelo_frontend.git
cd festivelo_frontend
```

2. Install dependencies
```bash
npm i axios
npm i react-icons
npm i react-router-dom
npm i react-datepicker
npm i react-calendar
npm i react-toastify
npm i date-fns
npm i jsonwebtoken
npm i jwt-decode@2.2.0
```

3. Environment variables
Create a `.env` file in the root directory and add the following:
```bash
REACT_APP_KAKAO_MAP_API_KEY = '37a87e97ba9fab89d604cde4d9fc43ab'
REACT_APP_KAKAO_MAP_APP_KEY = '57e8875b6fde1cfff1f7836503611aca'
REACT_APP_OPEN_API_KEY = 'gl9l9H1Y2qD9yT0yH0nS%2B12QZowwUaM3410DSZDFECnCxi2ShuNUaBBOjw%2Fj6vDjzn2xVrVrXSRBsKocSLVwwA%3D%3D'
REACT_APP_OPENWEATHER_API_KEY = '917bd2e37b30990d8a12872cce307220'
REACT_APP_SERVER_URL = 'http://localhost:8000'
REACT_APP_WS_URL = 'ws://localhost:8000'
REACT_APP_TOKEN_EXPIRATION=15m
```

4. Run the project
```bash
npm start
```
Festivelo_backend 
================

- 구현 기능
    - 구글 로그인/회원가입 기능 구현
    - 일반 사용자 로그인/회원가입 기능 구현
    - main page을 로그인 화면으로 설정/회원가입, 구글로그인 버튼 생성
    - 사용자 이름, 비밀번호 수정
    - 회원 탈퇴 구현 완료.
        - 공동 참여자로 속한 그룹에서 나가게 되어있음
        - 사용자가 작성한 리뷰 데이터 삭제
    - 공동 참여자 여행 계획 수정 기능 추가
    - JWT 토큰을 이용한 인증 고려
    - 협업을 위한 공유 데이터베이스 생성
    - 여행 계획 추가, 삭제, 수정 기능 구현
    - 여행 계획 추가 시 공동 참여자 추가 기능 구현
    - 즐겨찾기 기능 구현(추가, 조회, 삭제)
    - 리뷰 기능 구현(추가, 조회, 수정, 삭제)

- 실행 방법
    - cd festivelo_backend
    - .env 파일 생성 후, dotenv 파일 내용 작성(구글)
    - node app.js

-.env
```
GOOGLE_CLIENT_ID=302039083956-uo1lv1a9fe3hlv3qgp4sdr2k1540vd1u.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
mongoURL=mongodb+srv://xenis105:fIQwdGIijhVqNGWy@festivelo.topix.mongodb.net/?retryWrites=true&w=majority&appName=festivelo
PORT=8000
JWT_SECRET=H8K5cN/8EZ8ntFjvgWOdJCCgz9mmhbkRxtAvNTVZe5M=
TOKEN_EXPIRATION=15m
TOKEN_EXPIRATION=1h
```
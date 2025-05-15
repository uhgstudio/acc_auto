# 자금수지 관리 웹 애플리케이션

이 프로젝트는 개인 및 가계의 자금수지를 관리하고, 월별 수입/지출을 계산하는 웹 애플리케이션입니다.

## 주요 기능

- 사용자 인증 (로그인/회원가입)
- 월별 지출/수입 관리 및 시각화 
- 반복 지출/수입 항목 관리
- 일회성 지출/수입 항목 관리
- 지출/수입 분류 관리 (대분류/중분류)
- 자금수지 요약 및 보고서
- 공휴일 관리
- 다양한 테마 지원

## 기술 스택

### 프론트엔드
- HTML, CSS, JavaScript
- Bootstrap 5 (UI 프레임워크)
- Axios (HTTP 클라이언트)

### 백엔드
- Node.js
- Express.js (웹 프레임워크)
- MongoDB (데이터베이스)
- Mongoose (ODM)
- JWT (인증)
- bcrypt.js (암호화)

## 시작하기

### 필수 조건
- Node.js (>= 14.x)
- MongoDB (로컬 설치 또는 MongoDB Atlas)

### 설치 및 실행

1. 레포지토리 클론
```bash
git clone https://github.com/yourusername/finance-app.git
cd finance-app
```

2. 필요한 패키지 설치
```bash
npm install
```

3. 환경 변수 설정
`.env` 파일을 루트 디렉토리에 생성하고 다음 변수를 설정합니다:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_app
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

5. 브라우저에서 애플리케이션 접속
```
http://localhost:5000
```

## 백엔드 API 엔드포인트

### 인증
- `POST /api/auth/register` - 사용자 등록
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 로그인한 사용자 정보 조회
- `GET /api/auth/logout` - 로그아웃

### 일회성 지출/수입
- `GET /api/expenses/one-time` - 모든 일회성 지출/수입 항목 조회
- `GET /api/expenses/one-time/:id` - 특정 일회성 지출/수입 항목 조회
- `POST /api/expenses/one-time` - 일회성 지출/수입 항목 생성
- `PUT /api/expenses/one-time/:id` - 일회성 지출/수입 항목 수정
- `DELETE /api/expenses/one-time/:id` - 일회성 지출/수입 항목 삭제

### 반복 지출/수입
- `GET /api/expenses/recurring` - 모든 반복 지출/수입 항목 조회
- `GET /api/expenses/recurring/:id` - 특정 반복 지출/수입 항목 조회
- `POST /api/expenses/recurring` - 반복 지출/수입 항목 생성
- `PUT /api/expenses/recurring/:id` - 반복 지출/수입 항목 수정
- `DELETE /api/expenses/recurring/:id` - 반복 지출/수입 항목 삭제

## 클라이언트에서 API 사용 방법

기존 로컬스토리지 기반 코드를 API 호출 방식으로 변경하는 예시:

**기존 코드 (로컬스토리지 사용):**
```javascript
// 일회성 지출 항목 추가
addOneTimeExpense(expense) {
    expense.id = Utils.generateId();
    this.data.oneTimeExpenses.push(expense);
    this.saveData();
    this.notifyUpdate();
}
```

**변경된 코드 (API 사용):**
```javascript
// 일회성 지출 항목 추가
async addOneTimeExpense(expense) {
    try {
        await api.oneTimeExpenses.create(expense);
        this.notifyUpdate();
        return true;
    } catch (error) {
        console.error('일회성 지출 추가 중 오류 발생:', error);
        return false;
    }
}
```

## 프로젝트 구조

```
├── server/              # 백엔드 코드
│   ├── config/          # 설정 파일
│   ├── controllers/     # 컨트롤러
│   ├── middleware/      # 미들웨어
│   ├── models/          # Mongoose 모델
│   ├── routes/          # 라우트 정의
│   └── server.js        # 서버 진입점
├── js/                  # 프론트엔드 JavaScript
│   ├── api/             # API 클라이언트
│   ├── utils.js         # 유틸리티 함수
│   ├── data.js          # 데이터 관리
│   ├── app.js           # 메인 앱 로직
│   └── ...              # 기타 JS 파일
├── styles.css           # 스타일시트
├── index.html           # 메인 HTML
├── login.html           # 로그인 페이지
├── package.json         # 프로젝트 의존성
└── README.md            # 프로젝트 문서
```

## 기여하기

1. 이 저장소를 포크합니다.
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이센스

이 프로젝트는 ISC 라이센스 하에 배포됩니다. 
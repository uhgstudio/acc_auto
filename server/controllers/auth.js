const User = require('../models/User');

// @desc    사용자 등록
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    console.log('회원가입 요청 수신:', req.body);
    const { name, email, password } = req.body;

    // 필수 필드 체크
    if (!name || !email || !password) {
      console.log('필수 필드 누락:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        error: '이름, 이메일, 비밀번호는 필수 입력 항목입니다.'
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('이메일 중복:', email);
      return res.status(400).json({
        success: false,
        error: '이미 등록된 이메일입니다.'
      });
    }

    // 사용자 생성
    const user = await User.create({
      name,
      email,
      password
    });

    console.log('사용자 생성 성공:', user._id);
    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('회원가입 오류:', err.message);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    사용자 로그인
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 이메일과 비밀번호 확인
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }

    // 사용자 조회
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 사용자 정보입니다'
      });
    }

    // 비밀번호 일치 확인
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 사용자 정보입니다'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    현재 로그인한 사용자 정보 가져오기
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    로그아웃 - 쿠키 삭제
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// JWT 토큰 생성 및 쿠키에 저장하는 함수
const sendTokenResponse = (user, statusCode, res) => {
  try {
    // 토큰 생성
    const token = user.getSignedJwtToken();
    console.log('JWT 토큰 생성 완료');

    const options = {
      expires: new Date(
        Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };

    // HTTPS 환경에서만 secure 옵션 활성화
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // 쿠키 설정 먼저 시도
    try {
      res.cookie('token', token, options);
    } catch (error) {
      console.error('쿠키 설정 중 오류:', error.message);
    }
    
    // 성공 응답 전송
    return res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('토큰 응답 처리 중 오류:', error.message);
    return res.status(500).json({
      success: false,
      error: '인증 처리 중 오류가 발생했습니다.'
    });
  }
}; 
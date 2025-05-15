const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');

// 보호된 라우트를 위한 미들웨어
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Authorization 헤더에서 Bearer 토큰 확인
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 쿠키에서 토큰 확인
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 토큰이 없는 경우
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '이 리소스에 액세스할 권한이 없습니다. 인증 필요.'
      });
    }

    try {
      // 토큰 검증
      const decoded = jwt.verify(token, config.jwtSecret);

      // 사용자 ID로 사용자 정보 조회
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: '등록된 사용자를 찾을 수 없습니다.'
        });
      }
      
      // 요청 객체에 사용자 정보 추가
      req.user = user;
      next();
    } catch (err) {
      console.error('토큰 검증 오류:', err.message);
      return res.status(401).json({
        success: false,
        error: '유효하지 않은 토큰입니다. 다시 로그인하세요.'
      });
    }
  } catch (error) {
    console.error('인증 미들웨어 오류:', error.message);
    return res.status(500).json({
      success: false,
      error: '서버 내부 오류가 발생했습니다.'
    });
  }
}; 
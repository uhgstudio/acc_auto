const { MainCategory, SubCategory } = require('../models/Category');

// @desc    모든 대분류 조회
// @route   GET /api/categories/main
// @access  Private
exports.getMainCategories = async (req, res) => {
  try {
    // 기본 카테고리 또는 사용자의 카테고리만 반환
    const mainCategories = await MainCategory.find({
      $or: [
        { user: null }, // 기본 카테고리
        { user: req.user.id } // 사용자의 카테고리
      ]
    }).sort('order type name');

    res.status(200).json({
      success: true,
      count: mainCategories.length,
      data: mainCategories
    });
  } catch (error) {
    console.error('대분류 조회 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// @desc    모든 중분류 조회
// @route   GET /api/categories/sub
// @access  Private
exports.getSubCategories = async (req, res) => {
  try {
    // 특정 대분류에 속하는 중분류만 조회
    const filter = {};
    
    // mainCode 필터링
    if (req.query.mainCode) {
      filter.mainCode = req.query.mainCode;
    }
    
    // 기본 카테고리 또는 사용자의 카테고리만 반환
    filter.$or = [
      { user: null }, // 기본 카테고리
      { user: req.user.id } // 사용자의 카테고리
    ];

    const subCategories = await SubCategory.find(filter).sort('mainCode name');

    res.status(200).json({
      success: true,
      count: subCategories.length,
      data: subCategories
    });
  } catch (error) {
    console.error('중분류 조회 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// @desc    새 대분류 추가
// @route   POST /api/categories/main
// @access  Private
exports.addMainCategory = async (req, res) => {
  try {
    // 사용자 ID 추가
    req.body.user = req.user.id;
    
    // 코드 중복 확인
    const existing = await MainCategory.findOne({ code: req.body.code });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: '이미 사용 중인 분류 코드입니다.'
      });
    }

    const mainCategory = await MainCategory.create(req.body);

    res.status(201).json({
      success: true,
      data: mainCategory
    });
  } catch (error) {
    console.error('대분류 추가 오류:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    새 중분류 추가
// @route   POST /api/categories/sub
// @access  Private
exports.addSubCategory = async (req, res) => {
  try {
    // 사용자 ID 추가
    req.body.user = req.user.id;
    
    // 대분류 존재 확인
    const mainCategory = await MainCategory.findOne({ code: req.body.mainCode });
    if (!mainCategory) {
      return res.status(400).json({
        success: false,
        error: '존재하지 않는 대분류 코드입니다.'
      });
    }
    
    // 코드 중복 확인
    const existing = await SubCategory.findOne({ code: req.body.code });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: '이미 사용 중인 분류 코드입니다.'
      });
    }

    const subCategory = await SubCategory.create(req.body);

    res.status(201).json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    console.error('중분류 추가 오류:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    대분류 삭제
// @route   DELETE /api/categories/main/:id
// @access  Private
exports.deleteMainCategory = async (req, res) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);
    
    // 존재 여부 확인
    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        error: '대분류를 찾을 수 없습니다.'
      });
    }
    
    // 시스템 기본 카테고리 삭제 방지
    if (!mainCategory.user) {
      return res.status(403).json({
        success: false,
        error: '시스템 기본 카테고리는 삭제할 수 없습니다.'
      });
    }

    // 사용자 소유 확인
    if (mainCategory.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '다른 사용자의 카테고리는 삭제할 수 없습니다.'
      });
    }
    
    // 연결된 중분류 확인
    const subCategories = await SubCategory.find({ mainCode: mainCategory.code });
    if (subCategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: '이 대분류에 연결된 중분류가 있어 삭제할 수 없습니다.'
      });
    }

    await mainCategory.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('대분류 삭제 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// @desc    중분류 삭제
// @route   DELETE /api/categories/sub/:id
// @access  Private
exports.deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    
    // 존재 여부 확인
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        error: '중분류를 찾을 수 없습니다.'
      });
    }
    
    // 시스템 기본 카테고리 삭제 방지
    if (!subCategory.user) {
      return res.status(403).json({
        success: false,
        error: '시스템 기본 카테고리는 삭제할 수 없습니다.'
      });
    }

    // 사용자 소유 확인
    if (subCategory.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: '다른 사용자의 카테고리는 삭제할 수 없습니다.'
      });
    }

    await subCategory.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('중분류 삭제 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// @desc    대분류 업데이트
// @route   PUT /api/categories/main/:id
// @access  Private
exports.updateMainCategory = async (req, res) => {
  try {
    let mainCategory = await MainCategory.findById(req.params.id);
    
    // 존재 여부 확인
    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        error: '대분류를 찾을 수 없습니다.'
      });
    }
    
    // 시스템 기본 카테고리 수정 제한
    if (!mainCategory.user) {
      // 기본 카테고리인 경우 사용자가 관리자인지 확인
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: '시스템 기본 카테고리는 관리자만 수정할 수 있습니다.'
        });
      }
    } else if (mainCategory.user.toString() !== req.user.id) {
      // 다른 사용자의 카테고리 수정 방지
      return res.status(403).json({
        success: false,
        error: '다른 사용자의 카테고리는 수정할 수 없습니다.'
      });
    }
    
    // 항목 업데이트
    mainCategory = await MainCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: mainCategory
    });
  } catch (error) {
    console.error('대분류 업데이트 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// @desc    중분류 업데이트
// @route   PUT /api/categories/sub/:id
// @access  Private
exports.updateSubCategory = async (req, res) => {
  try {
    let subCategory = await SubCategory.findById(req.params.id);
    
    // 존재 여부 확인
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        error: '중분류를 찾을 수 없습니다.'
      });
    }
    
    // 시스템 기본 카테고리 수정 제한
    if (!subCategory.user) {
      // 기본 카테고리인 경우 사용자가 관리자인지 확인
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: '시스템 기본 카테고리는 관리자만 수정할 수 있습니다.'
        });
      }
    } else if (subCategory.user.toString() !== req.user.id) {
      // 다른 사용자의 카테고리 수정 방지
      return res.status(403).json({
        success: false,
        error: '다른 사용자의 카테고리는 수정할 수 없습니다.'
      });
    }
    
    // 항목 업데이트
    subCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    console.error('중분류 업데이트 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// @desc    대분류 업데이트 (코드로 조회)
// @route   PUT /api/categories/main/code/:code
// @access  Private
exports.updateMainCategoryByCode = async (req, res) => {
  try {
    const code = req.params.code;
    console.log('코드로 대분류 업데이트:', code);
    
    let mainCategory = await MainCategory.findOne({ code });
    
    // 존재 여부 확인
    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        error: '대분류를 찾을 수 없습니다.'
      });
    }
    
    console.log('찾은 카테고리:', mainCategory);
    
    // 시스템 기본 카테고리 수정 제한 (관리자 검사 임시 비활성화)
    if (mainCategory.user && mainCategory.user.toString() !== req.user.id) {
      // 다른 사용자의 카테고리 수정 방지
      return res.status(403).json({
        success: false,
        error: '다른 사용자의 카테고리는 수정할 수 없습니다.'
      });
    }
    
    // 업데이트할 필드만 선택적으로 적용
    if (req.body.name) mainCategory.name = req.body.name;
    if (req.body.type) mainCategory.type = req.body.type;
    if (req.body.order) mainCategory.order = req.body.order;
    
    // 저장
    await mainCategory.save();
    
    console.log('업데이트된 카테고리:', mainCategory);

    res.status(200).json({
      success: true,
      data: mainCategory
    });
  } catch (error) {
    console.error('대분류 업데이트 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// @desc    중분류 업데이트 (코드로 조회)
// @route   PUT /api/categories/sub/code/:code
// @access  Private
exports.updateSubCategoryByCode = async (req, res) => {
  try {
    const code = req.params.code;
    console.log('코드로 중분류 업데이트:', code);
    
    let subCategory = await SubCategory.findOne({ code });
    
    // 존재 여부 확인
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        error: '중분류를 찾을 수 없습니다.'
      });
    }
    
    console.log('찾은 카테고리:', subCategory);
    
    // 시스템 기본 카테고리 수정 제한 (관리자 검사 임시 비활성화)
    if (subCategory.user && subCategory.user.toString() !== req.user.id) {
      // 다른 사용자의 카테고리 수정 방지
      return res.status(403).json({
        success: false,
        error: '다른 사용자의 카테고리는 수정할 수 없습니다.'
      });
    }
    
    // 업데이트할 필드만 선택적으로 적용
    if (req.body.name) subCategory.name = req.body.name;
    if (req.body.mainCode) subCategory.mainCode = req.body.mainCode;
    
    // 저장
    await subCategory.save();
    
    console.log('업데이트된 카테고리:', subCategory);

    res.status(200).json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    console.error('중분류 업데이트 오류:', error.message);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
};

// 기본 카테고리 데이터
const defaultCategories = {
  main: [
    // 수입 관련 대분류
    { code: 'CARD_SALES', name: '카드 매출', type: 'income', order: 1 },
    { code: 'CASH_DEPOSIT', name: '현금입금', type: 'income', order: 2 },
    { code: 'SERVICE_INCOME', name: '용역수입', type: 'income', order: 3 },
    { code: 'OTHER_INCOME', name: '기타입금', type: 'income', order: 4 },
    
    // 지출 관련 대분류
    { code: 'LABOR', name: '인건비', type: 'expense', order: 5 },
    { code: 'UTILITY', name: '용역비용', type: 'expense', order: 6 },
    { code: 'OTHER_EXPENSE', name: '기타지출', type: 'expense', order: 7 },
    { code: 'TAX', name: '세금', type: 'expense', order: 8 },
    { code: 'RESTAURANT', name: '원자재 외', type: 'expense', order: 9 },
    { code: 'RETAIL', name: '판매관리비', type: 'expense', order: 10 },
  ],
  sub: [
    // 카드 매출 중분류
    { mainCode: 'CARD_SALES', code: 'CARD_KB', name: '매출-KB' },
    { mainCode: 'CARD_SALES', code: 'CARD_NH', name: '매출-NH' },
    { mainCode: 'CARD_SALES', code: 'CARD_LOTTE', name: '매출-롯데' },
    { mainCode: 'CARD_SALES', code: 'CARD_HANA', name: '매출-하나' },
    { mainCode: 'CARD_SALES', code: 'CARD_SAMSUNG', name: '매출-삼성' },
    { mainCode: 'CARD_SALES', code: 'CARD_SHINHAN', name: '매출-신한' },
    { mainCode: 'CARD_SALES', code: 'CARD_HYUNDAI', name: '매출-현대' },
    { mainCode: 'CARD_SALES', code: 'CARD_BC', name: '매출-BC카드' },
    
    // 인건비 중분류
    { mainCode: 'LABOR', code: 'SALARY', name: '급여' },
    { mainCode: 'LABOR', code: 'EMPLOYEE_INSURANCE', name: '연금/작가/보건교 등' },
    { mainCode: 'LABOR', code: 'BONUS', name: '상여' },
    { mainCode: 'LABOR', code: 'SEVERANCE', name: '퇴직세/퇴직금' },
    
    // 용역비용 중분류
    { mainCode: 'UTILITY', code: 'ELECTRICITY', name: '전기' },
    { mainCode: 'UTILITY', code: 'WATER_GAS', name: '연락처/가/전교 등' },
    { mainCode: 'UTILITY', code: 'CLEANING', name: '청직' },
    { mainCode: 'UTILITY', code: '4DEPOSIT', name: '4대보험' },
    
    // 원자재 외 중분류
    { mainCode: 'RESTAURANT', code: 'GROCERY', name: '원가-그리' },
    { mainCode: 'RESTAURANT', code: 'DELIVERY', name: '원가-쿠팡고' },
    { mainCode: 'RESTAURANT', code: 'CLEANING_R', name: '원가-롯데홀셀' },
    { mainCode: 'RESTAURANT', code: 'MART', name: '원가-마트' },
    { mainCode: 'RESTAURANT', code: 'EQUIPMENT', name: '원가-모아비즈' },
    { mainCode: 'RESTAURANT', code: 'EMARTS', name: '원가-이마트' },
    { mainCode: 'RESTAURANT', code: 'PACKAGING', name: '원가-패키징' },
    { mainCode: 'RESTAURANT', code: 'SALES_PROMOTION', name: '원가-판촉물건' },
    { mainCode: 'RESTAURANT', code: 'COFFEE_BEANS', name: '원가-커피원빈지' },
    { mainCode: 'RESTAURANT', code: 'FRUITS', name: '원가-피피스' },
    { mainCode: 'RESTAURANT', code: 'PLATEAU', name: '원가-플라또' },
    { mainCode: 'RESTAURANT', code: 'HOT_RECIPE', name: '원가-홀추' },
    { mainCode: 'RESTAURANT', code: 'ALMOND', name: '원가-아몬드' },
    { mainCode: 'RESTAURANT', code: 'JUICE', name: '원가-쥬스' },
    { mainCode: 'RESTAURANT', code: 'MATCHA', name: '원가-말차' },
    { mainCode: 'RESTAURANT', code: 'USA', name: '원가-플라토' },
    
    // 기타지출 중분류
    { mainCode: 'OTHER_EXPENSE', code: 'INTEREST', name: '이자수입' },
    { mainCode: 'OTHER_EXPENSE', code: 'STAR_CARD', name: '스타카드 외' },
    { mainCode: 'OTHER_EXPENSE', code: 'INVESTMENT', name: '시설투자' },
    { mainCode: 'OTHER_EXPENSE', code: 'ELECTRONICS', name: '전자제품' },
    
    // 판매관리비 중분류
    { mainCode: 'RETAIL', code: 'COMMISSION', name: '관리비' },
    { mainCode: 'RETAIL', code: 'LGU', name: 'LGU' },
    { mainCode: 'RETAIL', code: 'AIRCON', name: '가스' },
    { mainCode: 'RETAIL', code: 'SECURITY', name: '보험' },
    { mainCode: 'RETAIL', code: 'POS', name: '세무대행' },
    { mainCode: 'RETAIL', code: 'CESCO', name: '세스코' },
    { mainCode: 'RETAIL', code: 'INSECT', name: '인시용품' },
    { mainCode: 'RETAIL', code: 'AZGIL', name: '알질' },
    { mainCode: 'RETAIL', code: 'JOOKAPGM', name: '주각금' },
    { mainCode: 'RETAIL', code: 'ALBA_CARD', name: '알바관리(카더)' },
    
    // 세금 중분류
    { mainCode: 'TAX', code: 'FACILITY_FUND', name: '시설자금' },
    { mainCode: 'TAX', code: 'BUSINESS_ASSETS', name: '사업부자' }
  ]
};

// 기본 카테고리 초기화 함수
exports.initDefaultCategories = async () => {
  try {
    // 기본 대분류 카테고리 존재 여부 확인
    const mainCount = await MainCategory.countDocuments({ user: null });
    
    // 기본 대분류 카테고리가 없으면 추가
    if (mainCount === 0) {
      console.log('기본 대분류 카테고리 초기화 중...');
      await MainCategory.insertMany(defaultCategories.main);
      console.log(`${defaultCategories.main.length}개의 기본 대분류 카테고리 추가 완료`);
    }
    
    // 기본 중분류 카테고리 존재 여부 확인
    const subCount = await SubCategory.countDocuments({ user: null });
    
    // 기본 중분류 카테고리가 없으면 추가
    if (subCount === 0) {
      console.log('기본 중분류 카테고리 초기화 중...');
      await SubCategory.insertMany(defaultCategories.sub);
      console.log(`${defaultCategories.sub.length}개의 기본 중분류 카테고리 추가 완료`);
    }
    
    return {
      success: true,
      mainCount: mainCount > 0 ? mainCount : defaultCategories.main.length,
      subCount: subCount > 0 ? subCount : defaultCategories.sub.length
    };
  } catch (error) {
    console.error('기본 카테고리 초기화 오류:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}; 
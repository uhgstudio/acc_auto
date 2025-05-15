/**
 * 데이터 관리 모듈
 * 데이터 구조 정의 및 저장/불러오기, 백업/복원 기능을 담당
 */
const DataManager = {
    // 데이터 구조
    data: {
        recurringExpenses: [],
        oneTimeExpenses: [],
        generatedExpenses: [], // 생성된 반복 지출 항목 저장
        year: new Date().getFullYear(),
        holidays: {}, // 년도별 공휴일 저장 (예: {'2024': [{month: 1, day: 1, name: '신정'}, ...], '2025': [...]})
        categories: {
            main: [], // 대분류 (예: [{code: 'LIVING', name: '생활비', type: 'expense'}, {code: 'FINANCE', name: '금융', type: 'expense'}, ...])
            sub: []   // 중분류 (예: [{mainCode: 'LIVING', code: 'FOOD', name: '식비'}, ...])
        },
        nextId: 1  // ID 카운터 추가
    },

    // 데이터 초기화
    initialize() {
        // 데이터 구조 초기화
        this.data = {
            recurringExpenses: [],
            oneTimeExpenses: [],
            generatedExpenses: [],
            year: new Date().getFullYear(),
            holidays: {},
            categories: {
                main: [],
                sub: []
            },
            nextId: 1
        };
        
        // API 사용가능 여부 확인 및 데이터 로드
        return new Promise(async (resolve, reject) => {
            try {
                // API가 로드되었는지 확인
                if (window.api) {
                    console.log('API를 통한 데이터 로드 시도');
                    
                    // 사용자 정보 확인
                    const authResponse = await window.api.auth.getMe().catch(() => null);
                    
                    if (authResponse && authResponse.success) {
                        // 사용자 인증 성공 시 데이터 로드
                        console.log('사용자 인증 확인됨, 데이터 로드 중...');
                        
                        // 반복 지출 데이터 로드
                        const recurringResponse = await window.api.recurringExpenses.getAll();
                        if (recurringResponse.success) {
                            this.data.recurringExpenses = recurringResponse.data;
                        }
                        
                        // 일회성 지출 데이터 로드
                        const oneTimeResponse = await window.api.oneTimeExpenses.getAll(this.data.year);
                        if (oneTimeResponse.success) {
                            this.data.oneTimeExpenses = oneTimeResponse.data;
                            
                            // MongoDB ID를 로컬 ID로 사용
                            this.data.oneTimeExpenses.forEach(expense => {
                                if (expense._id && !expense.id) {
                                    expense.id = expense._id;
                                }
                            });
                        }
                        
                        // 카테고리 데이터 로드
                        try {
                            console.log('카테고리 데이터 로드 중...');
                            // 대분류 카테고리 로드
                            const mainCategoriesResponse = await window.api.categories.getMainCategories();
                            if (mainCategoriesResponse.success) {
                                this.data.categories.main = mainCategoriesResponse.data;
                                console.log('대분류 카테고리 로드 완료:', this.data.categories.main.length);
                            }
                            
                            // 중분류 카테고리 로드
                            const subCategoriesResponse = await window.api.categories.getSubCategories();
                            if (subCategoriesResponse.success) {
                                this.data.categories.sub = subCategoriesResponse.data;
                                console.log('중분류 카테고리 로드 완료:', this.data.categories.sub.length);
                            }
                        } catch (error) {
                            console.error('카테고리 데이터 로드 중 오류:', error);
                        }
                        
                        // 공휴일 데이터 로드
                        try {
                            console.log('공휴일 데이터 로드 중...');
                            const holidaysResponse = await window.api.holidays.getAll(this.data.year);
                            console.log('공휴일 응답:', holidaysResponse);
                            
                            if (holidaysResponse.success && holidaysResponse.data) {
                                const yearStr = this.data.year.toString();
                                
                                // 해당 연도의 공휴일 배열이 없으면 초기화
                                if (!this.data.holidays[yearStr]) {
                                    this.data.holidays[yearStr] = [];
                                } else {
                                    // 기존 데이터 초기화 (서버에서 새로운 데이터로 덮어쓰기)
                                    this.data.holidays[yearStr] = [];
                                }
                                
                                // API에서 가져온 공휴일 데이터 처리
                                holidaysResponse.data.forEach(holiday => {
                                    console.log('처리 중인 공휴일:', holiday);
                                    
                                    // month와 day가 문자열이면 숫자로 변환
                                    const month = typeof holiday.month === 'string' ? parseInt(holiday.month) : holiday.month;
                                    const day = typeof holiday.day === 'string' ? parseInt(holiday.day) : holiday.day;
                                    
                                    // MongoDB에서 가져온 데이터를 로컬 형식으로 변환
                                    this.data.holidays[yearStr].push({
                                        month: month,
                                        day: day,
                                        name: holiday.name,
                                        _id: holiday._id // MongoDB ID 저장 (필요시 사용)
                                    });
                                });
                                
                                console.log(`${yearStr}년 공휴일 ${this.data.holidays[yearStr].length}개 로드 완료`);
                                
                                // 날짜순으로 정렬
                                this.data.holidays[yearStr].sort((a, b) => {
                                    if (a.month === b.month) {
                                        return a.day - b.day;
                                    }
                                    return a.month - b.month;
                                });
                            } else {
                                console.error('공휴일 데이터 로드 실패:', holidaysResponse.error || '응답 없음');
                            }
                        } catch (error) {
                            console.error('공휴일 데이터 로드 중 오류 발생:', error);
                        }
                        
                        // nextId 업데이트 (가장 큰 ID + 1)
                        let maxId = 0;
                        this.data.oneTimeExpenses.forEach(expense => {
                            const numId = parseInt(expense.id, 10);
                            if (!isNaN(numId) && numId > maxId) {
                                maxId = numId;
                            }
                        });
                        this.data.nextId = maxId + 1;
                        
                        console.log('API에서 데이터 로드 완료');
                        resolve(this.data);
                        return;
                    } else {
                        console.log('사용자 인증 필요, 로컬 데이터 사용');
                    }
                }
                
                // API 사용 불가 또는 인증 실패 시 로컬 스토리지 사용
                const hasData = this.loadData();
                
                // 기존 데이터가 없는 경우 기본 데이터 설정
                if (!hasData || (this.data.recurringExpenses.length === 0 && 
                    this.data.oneTimeExpenses.length === 0 &&
                    !this.data.categories.main.length)) {
                    this.setupDefaultData();
                }
                
                // 데이터 마이그레이션 처리
                this.migrateData();
                
                // 기존에 수정된 반복 항목 저장
                const modifiedRecurringItems = {};
                
                // 수정된 반복 항목 식별
                this.data.oneTimeExpenses.forEach(expense => {
                    if (expense.recurringId) {
                        const key = `${expense.recurringId}-${expense.date}`;
                        modifiedRecurringItems[key] = expense;
                    }
                });
                
                // generatedExpenses 비우기만 하고 반복 지출 데이터 재생성은 하지 않음
                this.data.generatedExpenses = [];
                
                // 먼저 반복 지출로 생성된 항목만 필터링하여 제거
                this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
                    expense => !expense.recurringId
                );
                
                // 모든 반복 지출 항목에 대해 데이터 생성 (수정된 항목 보존)
                this.data.recurringExpenses.forEach((_, index) => {
                    this.generateRecurringExpenseData(index, modifiedRecurringItems);
                });
                
                // 이제 데이터 저장
                this.saveData();
                console.log('데이터 초기화 완료, 총 항목 수:', this.data.oneTimeExpenses.length);
                
                resolve(this.data);
            } catch (error) {
                console.error('데이터 초기화 중 오류 발생:', error);
                
                // 오류 발생 시 로컬 데이터 사용
                const hasData = this.loadData();
                if (!hasData) {
                    this.setupDefaultData();
                }
                
                resolve(this.data);
            }
        });
    },
    
    // oneTimeExpenses에서 recurringId가 있는 항목 제거 (중복 정리) -> 이제는 generatedExpenses만 비우도록 변경
    cleanupDuplicateRecurringItems() {
        // generatedExpenses는 비우고, oneTimeExpenses는 그대로 유지
        this.data.generatedExpenses = [];
        
        // 변경사항 저장
        this.saveData();
    },
    
    // 기존 데이터 구조 업데이트
    migrateData() {
        // generatedExpenses 배열이 없으면 추가
        if (!this.data.generatedExpenses) {
            this.data.generatedExpenses = [];
        }
        
        // nextId가 없으면 추가
        if (!this.data.nextId) {
            this.data.nextId = 1;
        }
        
        // 모든 oneTimeExpenses 항목 ID 확인 및 설정
        let maxId = 0;
        
        this.data.oneTimeExpenses.forEach(expense => {
            if (!expense.id) {
                // 임시 ID 할당 (나중에 다시 설정)
                expense.id = -1;
            } else if (expense.id > maxId) {
                maxId = expense.id;
            }
        });
        
        // nextId는 최소한 현재 최대 ID + 1이어야 함
        this.data.nextId = Math.max(this.data.nextId, maxId + 1);
        
        // ID가 없는 항목에 새 ID 할당
        this.data.oneTimeExpenses.forEach(expense => {
            if (expense.id === -1) {
                expense.id = this.getNextId();
            }
        });
        
        // 대분류에 order 필드가 없으면 추가
        let nextOrder = 1;
        this.data.categories.main.forEach(category => {
            if (!category.hasOwnProperty('order')) {
                category.order = nextOrder++;
            }
        });
        
        // frequency 필드가 없는 기존 반복 지출 항목에 'monthly' 값 추가
        this.data.recurringExpenses.forEach(expense => {
            if (!expense.hasOwnProperty('frequency')) {
                expense.frequency = 'monthly';
            }
            
            // skipWeekends와 skipHolidays 필드가 없는 경우 기본값 추가
            if (!expense.hasOwnProperty('skipWeekends')) {
                expense.skipWeekends = false;
            }
            
            if (!expense.hasOwnProperty('skipHolidays')) {
                expense.skipHolidays = false;
            }
            
            // isActualPayment 필드가 없는 경우 기본값 추가
            if (!expense.hasOwnProperty('isActualPayment')) {
                expense.isActualPayment = true;
            }
            
            // YYYY-MM 형식의 날짜를 YYYY-MM-DD 형식으로 변환
            if (expense.startDate && expense.startDate.length === 7) {
                // YYYY-MM 형식이면 YYYY-MM-01 형식으로 변환
                expense.startDate = `${expense.startDate}-01`;
            }
            
            if (expense.endDate && expense.endDate.length === 7) {
                // YYYY-MM 형식이면 해당 월의 마지막 날로 변환
                const [year, month] = expense.endDate.split('-');
                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                expense.endDate = `${expense.endDate}-${lastDay}`;
            }
        });
        
        // 일회성 지출 항목에 isActualPayment 필드 추가
        this.data.oneTimeExpenses.forEach(expense => {
            if (!expense.hasOwnProperty('isActualPayment')) {
                expense.isActualPayment = true;
            }
            
            // 거래처(vendor) 필드 추가
            if (!expense.hasOwnProperty('vendor')) {
                expense.vendor = '';
            }
        });
        
        // 생성된 지출 항목에 isActualPayment 필드 추가
        this.data.generatedExpenses.forEach(expense => {
            if (!expense.hasOwnProperty('isActualPayment')) {
                let valueSet = false;
                // 연결된 반복 지출 항목이 있으면 그 값을 사용
                if (expense.recurringId) {
                    const recurringIdParts = expense.recurringId.split('-');
                    if (recurringIdParts.length === 2 && recurringIdParts[0] === 'recurring') {
                        const recurringIndex = parseInt(recurringIdParts[1]);
                        if (recurringIndex >= 0 && recurringIndex < this.data.recurringExpenses.length) {
                            expense.isActualPayment = this.data.recurringExpenses[recurringIndex].isActualPayment;
                            valueSet = true;
                        }
                    }
                }
                // 아직 값이 설정되지 않았으면 기본값은 true
                if (!valueSet) {
                    expense.isActualPayment = true;
                }
            }
        });
        
        // 마이그레이션 후 저장
        this.saveData();
    },

    // 기본 데이터 설정
    setupDefaultData() {
        this.data.year = new Date().getFullYear();
        
        // 기본 공휴일 설정
        const currentYear = this.data.year.toString();
        this.data.holidays[currentYear] = [
            { month: 1, day: 1, name: '신정' },
            { month: 3, day: 1, name: '삼일절' },
            { month: 5, day: 5, name: '어린이날' },
            { month: 6, day: 6, name: '현충일' },
            { month: 8, day: 15, name: '광복절' },
            { month: 10, day: 3, name: '개천절' },
            { month: 10, day: 9, name: '한글날' },
            { month: 12, day: 25, name: '크리스마스' }
        ];
        
        // 기본 분류 설정
        this.data.categories = {
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
                { mainCode: 'RESTAURANT', code: 'CLEANING', name: '원가-롯데홀셀' },
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
        
        this.saveData();
    },

    // 데이터 로컬스토리지에서 불러오기
    loadData() {
        try {
            // 로컬 스토리지에서 데이터 가져오기
            const savedData = localStorage.getItem('expenseData');
            
            if (savedData) {
                console.log('로컬 스토리지에서 데이터 로드 시도');
                const parsedData = JSON.parse(savedData);
                
                // 데이터 유효성 검사
                if (typeof parsedData === 'object' && 
                    Array.isArray(parsedData.oneTimeExpenses) && 
                    Array.isArray(parsedData.recurringExpenses)) {
                    
                    // 기존 데이터에 필수 필드가 없으면 추가 (하위 호환성 유지)
                    if (!parsedData.holidays) parsedData.holidays = {};
                    if (!parsedData.categories) {
                        parsedData.categories = {
                            main: [],
                            sub: []
                        };
                    }
                    if (!parsedData.generatedExpenses) parsedData.generatedExpenses = [];
                    if (!parsedData.nextId) parsedData.nextId = 1;
                    
                    this.data = parsedData;
                    console.log('데이터 로드 성공: 일회성 지출 ' + this.data.oneTimeExpenses.length + '개, 반복 지출 ' + this.data.recurringExpenses.length + '개');
                    return true;
                } else {
                    console.warn('저장된 데이터 형식이 올바르지 않습니다. 기본 데이터로 초기화합니다.');
                    this.setupDefaultData();
                    return false;
                }
            } else {
                console.log('저장된 데이터가 없습니다. 기본 데이터로 초기화합니다.');
                this.setupDefaultData();
                return false;
            }
        } catch (error) {
            console.error('데이터 로딩 중 오류 발생:', error);
            // 오류 발생 시 로컬 스토리지 초기화 및 기본 데이터 설정
            localStorage.removeItem('expenseData');
            this.setupDefaultData();
            return false;
        }
    },

    // 데이터 로컬스토리지에 저장하기
    saveData() {
        try {
            const dataStr = JSON.stringify(this.data);
            localStorage.setItem('expenseData', dataStr);
            console.log('로컬 스토리지에 데이터 저장 성공');
            
            // 저장 검증
            const savedData = localStorage.getItem('expenseData');
            if (!savedData) {
                console.error('데이터 저장 후 검증 실패: 저장된 데이터가 없습니다.');
            }
            return true;
        } catch (error) {
            console.error('로컬 스토리지에 데이터 저장 중 오류 발생:', error);
            
            // 용량 초과 등의 문제인 경우 알림
            if (error.name === 'QuotaExceededError') {
                alert('브라우저 저장 공간이 부족합니다. 불필요한 데이터를 정리하고 다시 시도해주세요.');
            }
            return false;
        }
    },

    // 데이터 백업하기 (JSON 파일로 다운로드)
    backupData() {
        const dataStr = JSON.stringify(this.data);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileName = `expense_backup_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
    },
    
    // 데이터 복원하기 (백업 파일에서 불러오기)
    restoreData(jsonFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const restoredData = JSON.parse(event.target.result);
                    
                    // 데이터 형식 검증 (기본적인 속성이 있는지 확인)
                    if (restoredData && 
                        Array.isArray(restoredData.recurringExpenses) && 
                        Array.isArray(restoredData.oneTimeExpenses) &&
                        typeof restoredData.year === 'number') {
                        
                        this.data = restoredData;
                        this.saveData();
                        resolve(this.data);
                    } else {
                        reject('유효하지 않은 백업 파일입니다.');
                    }
                } catch (e) {
                    reject('파일을 읽는 중 오류가 발생했습니다: ' + e.message);
                }
            };
            reader.readAsText(jsonFile);
        });
    },
    
    // 데이터 초기화
    resetData() {
        this.data = {
            recurringExpenses: [],
            oneTimeExpenses: [],
            generatedExpenses: [],
            year: new Date().getFullYear(),
            holidays: {},
            categories: {
                main: [],
                sub: []
            },
            nextId: 1  // ID 카운터 추가
        };
        this.setupDefaultData();
        this.saveData();
        return this.data;
    },
    
    // 반복 지출 추가
    addRecurringExpense(frequency, day, amount, description, startDate, endDate, mainCategory, subCategory, skipWeekends, skipHolidays, isActualPayment = true, vendor = '') {
        // 금액을 숫자로 변환
        amount = parseFloat(amount);
        
        // 매월 반복이면 일자 필수 체크
        if (frequency === 'monthly' && !day) {
            throw new Error('매월 반복 지출은 일자를 입력해야 합니다.');
        }
        
        // 새 반복 지출 항목
        const newExpense = {
            frequency,
            day: day ? parseInt(day) : null,
            amount,
            description,
            startDate,
            endDate,
            mainCategory,
            subCategory,
            skipWeekends,
            skipHolidays,
            isActualPayment: isActualPayment,
            vendor: vendor || '' // 거래처 필드 추가
        };
        
        // API 호출로 데이터 저장 (비동기)
        return new Promise(async (resolve, reject) => {
            try {
                if (!window.api) {
                    // API 모듈이 로드되지 않은 경우 로컬 저장
                    this.data.recurringExpenses.push(newExpense);
                    this.saveData();
                    
                    // 반복 지출 데이터 생성 (로컬)
                    const generatedExpenses = this.generateRecurringExpenseData(this.data.recurringExpenses.length - 1);
                    console.log(`${generatedExpenses.length}개의 일회성 지출이 생성되었습니다.`);
                    
                    resolve({
                        recurringExpense: newExpense,
                        generatedCount: generatedExpenses.length
                    });
                    return;
                }
                
                // API 호출로 서버에 데이터 저장
                console.log('반복 지출 생성 요청:', newExpense);
                const response = await window.api.recurringExpenses.create(newExpense);
                console.log('서버 응답:', response);
                
                // 성공 시 로컬 데이터도 업데이트
                if (response.success && response.data) {
                    // 서버에서 받은 데이터로 업데이트 (ID 등 포함)
                    this.data.recurringExpenses.push(response.data);
                    this.saveData();
                    
                    // 실제 데이터 생성 (pregeneration)
                    const generatedExpenses = this.generateRecurringExpenseData(this.data.recurringExpenses.length - 1);
                    console.log(`${generatedExpenses.length}개의 일회성 지출이 생성되었습니다.`);
                    
                    // 생성된 각 일회성 지출을 서버에 저장
                    const savedOneTimeExpenses = [];
                    for (const expense of generatedExpenses) {
                        try {
                            if (window.api) {
                                // 생성된 일회성 지출 항목도 서버에 저장
                                const oneTimeResponse = await window.api.oneTimeExpenses.create({
                                    date: expense.date,
                                    amount: expense.amount,
                                    description: expense.description,
                                    mainCategory: expense.mainCategory,
                                    subCategory: expense.subCategory,
                                    isActualPayment: expense.isActualPayment,
                                    recurringId: expense.recurringId,
                                    vendor: expense.vendor || '' // 거래처 정보 추가
                                });
                                
                                if (oneTimeResponse.success) {
                                    // 서버 ID를 로컬 데이터에 업데이트
                                    const index = this.data.oneTimeExpenses.findIndex(e => e.id === expense.id);
                                    if (index !== -1 && oneTimeResponse.data._id) {
                                        this.data.oneTimeExpenses[index]._id = oneTimeResponse.data._id;
                                    }
                                    savedOneTimeExpenses.push(oneTimeResponse.data);
                                }
                            }
                        } catch (oneTimeError) {
                            console.error('일회성 지출 저장 중 오류:', oneTimeError);
                        }
                    }
                    console.log(`${savedOneTimeExpenses.length}개의 일회성 지출이 서버에 저장되었습니다.`);
                    
                    // 변경 사항 저장
                    this.saveData();
                    
                    resolve({
                        recurringExpense: response.data,
                        generatedCount: generatedExpenses.length,
                        savedCount: savedOneTimeExpenses.length
                    });
                } else {
                    reject(new Error('서버에 데이터를 저장하는데 실패했습니다.'));
                }
            } catch (error) {
                console.error('반복 지출 추가 중 오류 발생:', error);
                
                // 오류 시 로컬에 저장 시도 (오프라인 지원)
                this.data.recurringExpenses.push(newExpense);
                this.saveData();
                
                // 반복 지출 데이터 생성 (로컬)
                const generatedExpenses = this.generateRecurringExpenseData(this.data.recurringExpenses.length - 1);
                console.log(`오류 발생 후 로컬에 ${generatedExpenses.length}개의 일회성 지출이 생성되었습니다.`);
                
                // 오류 정보 포함하여 반환
                resolve({
                    recurringExpense: newExpense,
                    generatedCount: generatedExpenses.length,
                    error: error.message
                });
            }
        });
    },

    // 반복 지출 삭제
    removeRecurringExpense(index) {
        // MongoDB ID 확인 (API에서 가져온 데이터의 경우)
        const expense = this.data.recurringExpenses[index];
        const mongoId = expense && expense._id ? expense._id : null;
        
        // 해당 반복 지출로 생성된 항목들 삭제
        const recurringId = `recurring-${index}`;
        this.data.generatedExpenses = this.data.generatedExpenses.filter(
            expense => !expense.recurringId || expense.recurringId !== recurringId
        );
        
        // 이 반복 지출에 의해 생성된 일회성 지출 데이터도 함께 삭제
        const oneTimeExpensesToDelete = this.data.oneTimeExpenses.filter(
            expense => expense.recurringId && expense.recurringId === recurringId
        );
        
        // API 호출로 서버에서도 데이터 삭제 (비동기)
        return new Promise(async (resolve, reject) => {
            try {
                // 서버에서 반복 지출 삭제
                if (window.api && mongoId) {
                    console.log(`서버에서 반복 지출 삭제 요청: ID=${mongoId}`);
                    await window.api.recurringExpenses.delete(mongoId);
                    
                    // 연결된 일회성 지출도 서버에서 삭제
                    for (const expense of oneTimeExpensesToDelete) {
                        if (expense._id) {
                            try {
                                await window.api.oneTimeExpenses.delete(expense._id);
                                console.log(`연결된 일회성 지출 삭제: ID=${expense._id}`);
                            } catch (deleteError) {
                                console.error('연결된 일회성 지출 삭제 중 오류:', deleteError);
                            }
                        }
                    }
                }
                
                // 로컬 데이터 삭제
                this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
                    expense => !expense.recurringId || expense.recurringId !== recurringId
                );
                
                // 반복 지출 항목 삭제
                this.data.recurringExpenses.splice(index, 1);
                
                // 인덱스가 바뀐 항목들의 ID 재조정
                this.updateRecurringReferences();
                
                this.saveData();
                resolve(this.data.recurringExpenses);
            } catch (error) {
                console.error('반복 지출 삭제 중 오류 발생:', error);
                // 오류 발생해도 로컬 데이터는 삭제 진행
                this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
                    expense => !expense.recurringId || expense.recurringId !== recurringId
                );
                this.data.recurringExpenses.splice(index, 1);
                this.updateRecurringReferences();
                this.saveData();
                resolve(this.data.recurringExpenses);
            }
        });
    },
    
    // 반복 지출 ID 재조정
    updateRecurringReferences() {
        // 반복 지출 삭제 후 남은 항목들의 ID 재조정
        this.data.generatedExpenses.forEach(expense => {
            if (expense.recurringId) {
                const parts = expense.recurringId.split('-');
                const oldIndex = parseInt(parts[1]);
                
                // 실제 반복 지출 항목 찾기
                for (let i = 0; i < this.data.recurringExpenses.length; i++) {
                    if (i === oldIndex || i > oldIndex) {
                        // 새 ID 생성 (기존 항목의 인덱스가 1씩 줄어듦)
                        expense.recurringId = `recurring-${i}`;
                        break;
                    }
                }
            }
        });
    },

    // 일회성 지출 추가
    addOneTimeExpense(date, amount, description, mainCategory, subCategory, isActualPayment = true, vendor = '') {
        // 금액을 숫자로 변환
        amount = parseFloat(amount);
        
        // ID 생성
        const id = this.getNextId();
        
        // 새 지출 항목
        const newExpense = {
            id,
            date,
            amount,
            description,
            mainCategory,
            subCategory,
            isActualPayment,
            vendor
        };
        
        // API 호출로 데이터 저장 (비동기)
        return new Promise(async (resolve, reject) => {
            try {
                if (!window.api) {
                    // API 모듈이 로드되지 않은 경우 로컬 저장
                    this.data.oneTimeExpenses.push(newExpense);
                    this.saveData();
                    resolve(newExpense);
                    return;
                }
                
                // API 호출로 서버에 데이터 저장
                const response = await window.api.oneTimeExpenses.create(newExpense);
                
                // 성공 시 로컬 데이터도 업데이트
                if (response.success && response.data) {
                    // 서버에서 받은 데이터로 업데이트 (MongoDB ID 등 포함)
                    const savedExpense = response.data;
                    savedExpense.id = savedExpense._id || id; // MongoDB ID를 로컬 ID로 사용
                    this.data.oneTimeExpenses.push(savedExpense);
                    this.saveData();
                    resolve(savedExpense);
                } else {
                    reject(new Error('서버에 데이터를 저장하는데 실패했습니다.'));
                }
            } catch (error) {
                console.error('일회성 지출 추가 중 오류 발생:', error);
                
                // 오류 시 로컬에 저장 시도 (오프라인 지원)
                this.data.oneTimeExpenses.push(newExpense);
                this.saveData();
                
                // 사용자에게 동기화 오류 알림 메시지
                resolve(newExpense);
            }
        });
    },
    
    // 일회성 지출 삭제
    removeOneTimeExpense(id) {
        return new Promise(async (resolve, reject) => {
            try {
                // MongoDB ID가 있는지 확인 (API에서 가져온 데이터의 경우)
                const index = this.findOneTimeExpenseIndexById(id);
                const expense = index !== -1 ? this.data.oneTimeExpenses[index] : null;
                const mongoId = expense && expense._id ? expense._id : id;
                
                if (window.api) {
                    // API 호출로 서버에서 데이터 삭제
                    try {
                        const response = await window.api.oneTimeExpenses.delete(mongoId);
                        // 서버에서 삭제 성공 시 로컬 데이터도 삭제
                        if (response.success) {
                            if (index !== -1) {
                                this.data.oneTimeExpenses.splice(index, 1);
                                this.saveData();
                            }
                            resolve(true);
                            return;
                        }
                    } catch (apiError) {
                        console.error('API를 통한 지출 삭제 중 오류:', apiError);
                        // API 오류 시 로컬 데이터만 삭제 진행
                    }
                }
                
                // API 사용 불가능한 경우 로컬 데이터만 삭제
                if (index !== -1) {
                    this.data.oneTimeExpenses.splice(index, 1);
                    this.saveData();
                    resolve(true);
                } else {
                    reject(new Error('삭제할 항목을 찾을 수 없습니다.'));
                }
            } catch (error) {
                console.error('지출 항목 삭제 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // ID로 일회성 지출 인덱스 찾기
    findOneTimeExpenseIndexById(id) {
        console.log('findOneTimeExpenseIndexById 호출됨, ID:', id, typeof id);
        
        // 원본 ID 저장 (MongoDB ID일 수 있음)
        const originalId = id;
        
        // ID 처리
        let searchId = id;
        
        // ID가 문자열로 전달될 경우 처리
        if (typeof id === 'string') {
            if (id.startsWith('onetime-')) {
                const idParts = id.split('-');
                if (idParts.length === 2) {
                    const numId = parseInt(idParts[1]);
                    if (!isNaN(numId)) {
                        searchId = numId;
                        console.log('onetime- 접두사 ID를 숫자로 변환:', searchId);
                    }
                }
            } else {
                // 순수 숫자 문자열인 경우 숫자로 변환
                const numId = parseInt(id);
                if (!isNaN(numId)) {
                    searchId = numId;
                    console.log('문자열 ID를 숫자로 변환:', searchId);
                }
            }
        }
        
        // MongoDB ID 형식인지 확인 (24자리 16진수 문자열)
        const isMongoId = typeof originalId === 'string' && 
                          /^[0-9a-f]{24}$/i.test(originalId);
        
        if (isMongoId) {
            console.log('MongoDB ID 형식 감지:', originalId);
        }
        
        // 모든 항목을 순회하면서 ID 비교
        for (let i = 0; i < this.data.oneTimeExpenses.length; i++) {
            const expense = this.data.oneTimeExpenses[i];
            
            // MongoDB ID 직접 비교 (우선순위)
            if (isMongoId && expense._id === originalId) {
                console.log('MongoDB _id 일치:', expense._id, originalId);
                return i;
            }
            
            // 일반 ID 비교
            const expenseId = expense.id;
            
            // ID 직접 일치 (정확히 동일한 값)
            if (expenseId === searchId) {
                console.log('정확한 ID 일치:', expenseId, searchId);
                return i;
            }
            
            // 문자열 vs 숫자 비교 (느슨한 일치)
            if (expenseId == searchId) {
                console.log('느슨한 ID 일치:', expenseId, searchId);
                return i;
            }
            
            // MongoDB ID인 경우 문자열 비교
            if (expense._id && expense._id === searchId) {
                console.log('MongoDB ID 일치:', expense._id, searchId);
                return i;
            }
        }
        
        console.log('ID에 해당하는 항목을 찾지 못함:', originalId, searchId);
        return -1;
    },
    
    // 일회성 지출의 실입금 여부만 변경
    toggleActualPayment(id) {
        // 디버깅: 전달받은 ID 확인
        console.log('toggleActualPayment에 전달된 ID:', id, typeof id);
        
        return new Promise(async (resolve, reject) => {
            try {
                // 원본 ID 유지 (MongoDB ID 처리를 위해)
                const originalId = id;
                
                // MongoDB ID 형식인지 확인 (24자리 16진수 문자열)
                const isMongoId = typeof originalId === 'string' && 
                                  /^[0-9a-f]{24}$/i.test(originalId);
                
                // ID가 문자열로 전달될 수 있으므로 숫자로 변환 (MongoDB ID는 제외)
                let parsedId = id;
                if (!isMongoId && typeof id === 'string') {
                    if (id.startsWith('onetime-')) {
                        const idParts = id.split('-');
                        if (idParts.length === 2) {
                            parsedId = parseInt(idParts[1]);
                        }
                    } else {
                        // 문자열이지만 onetime- 접두사가 없는 경우 숫자로 변환 시도
                        const numId = parseInt(id);
                        if (!isNaN(numId)) {
                            parsedId = numId;
                        }
                    }
                }
                
                // 인덱스 찾기 (MongoDB ID가 있는 경우 원본 ID 사용)
                const index = isMongoId ? 
                    this.findOneTimeExpenseIndexById(originalId) : 
                    this.findOneTimeExpenseIndexById(parsedId);
                    
                console.log('찾은 인덱스:', index, isMongoId ? '(MongoDB ID 사용)' : '(변환된 ID 사용)');
                
                // 유효한 인덱스인지 확인
                if (index !== -1) {
                    // 실입금 여부 토글 전 값 확인
                    console.log('토글 전 isActualPayment 값:', this.data.oneTimeExpenses[index].isActualPayment);
                    
                    // 실입금 여부 토글
                    const newValue = !this.data.oneTimeExpenses[index].isActualPayment;
                    this.data.oneTimeExpenses[index].isActualPayment = newValue;
                    
                    // 토글 후 값 확인
                    console.log('토글 후 isActualPayment 값:', this.data.oneTimeExpenses[index].isActualPayment);
                    
                    // API 호출로 서버 데이터 업데이트
                    const expense = this.data.oneTimeExpenses[index];
                    if (window.api && expense._id) {
                        try {
                            console.log('서버에 실입금 상태 업데이트 요청:', expense._id);
                            const response = await window.api.oneTimeExpenses.update(expense._id, {
                                isActualPayment: newValue
                            });
                            
                            if (response.success) {
                                console.log('서버 업데이트 성공:', response.data);
                            } else {
                                console.error('서버 업데이트 실패:', response.error);
                            }
                        } catch (apiError) {
                            console.error('API 호출 중 오류:', apiError);
                        }
                    }
                    
                    // 로컬 스토리지 저장
                    this.saveData();
                    
                    resolve(this.data.oneTimeExpenses[index]);
                } else {
                    console.error('유효하지 않은 ID:', id, typeof id, parsedId, typeof parsedId, isMongoId ? '(MongoDB ID)' : '');
                    reject(new Error('유효하지 않은 ID입니다.'));
                }
            } catch (error) {
                console.error('실입금 상태 변경 중 오류 발생:', error);
                reject(error);
            }
        });
    },

    // 일회성 지출 수정
    updateOneTimeExpense(id, date, amount, description, mainCategory, subCategory, isActualPayment = true, vendor = '') {
        console.log('updateOneTimeExpense 호출됨. ID:', id, typeof id);
        
        return new Promise(async (resolve, reject) => {
            try {
                // findOneTimeExpenseIndexById 함수를 사용하여 인덱스 찾기
                const index = this.findOneTimeExpenseIndexById(id);
                console.log('찾은 인덱스:', index);
                
                // 유효한 인덱스인지 확인
                if (index !== -1) {
                    // 수정할 항목
                    const expense = this.data.oneTimeExpenses[index];
                    console.log('수정 전 항목:', expense);
                    
                    // 수정하지 않을 기존 데이터 보존 (recurringId, id 등)
                    const recurringId = expense.recurringId;
                    const originalId = expense.id;
                    const mongoId = expense._id || originalId;
                    
                    // 수정할 데이터 객체 생성
                    const updatedExpense = {
                        id: originalId,  // 기존 ID 유지
                        date,
                        amount: parseFloat(amount),
                        description,
                        mainCategory,
                        subCategory,
                        isActualPayment,
                        vendor,  // 거래처 필드 추가
                        recurringId, // 반복 항목과의 연결 유지
                        modified: true // 이 항목이 수정되었음을 표시
                    };
                    
                    // API 호출로 서버 데이터 업데이트
                    if (window.api && expense._id) {
                        try {
                            console.log('서버에 일회성 지출 업데이트 요청:', mongoId);
                            const response = await window.api.oneTimeExpenses.update(mongoId, {
                                date,
                                amount: parseFloat(amount),
                                description,
                                mainCategory,
                                subCategory,
                                isActualPayment,
                                vendor,
                                recurringId
                            });
                            
                            if (response.success) {
                                console.log('서버 업데이트 성공:', response.data);
                                
                                // 서버에서 받은 업데이트된 객체로 로컬 데이터 갱신
                                if (response.data) {
                                    response.data.id = response.data._id || originalId;
                                    this.data.oneTimeExpenses[index] = response.data;
                                } else {
                                    // 서버 응답에 데이터가 없으면 로컬 객체로 업데이트
                                    this.data.oneTimeExpenses[index] = updatedExpense;
                                }
                            } else {
                                console.error('서버 업데이트 실패:', response.error);
                                // 서버 업데이트 실패 시에도 로컬 데이터는 업데이트
                                this.data.oneTimeExpenses[index] = updatedExpense;
                            }
                        } catch (apiError) {
                            console.error('API 호출 중 오류:', apiError);
                            // API 오류시 로컬 데이터만 업데이트
                            this.data.oneTimeExpenses[index] = updatedExpense;
                        }
                    } else {
                        // API 사용 불가능한 경우 로컬 데이터만 업데이트
                        this.data.oneTimeExpenses[index] = updatedExpense;
                    }
                    
                    console.log('수정 후 항목:', this.data.oneTimeExpenses[index]);
                    
                    // 로컬 스토리지에 저장
                    this.saveData();
                    
                    resolve(this.data.oneTimeExpenses[index]);
                } else {
                    console.error('유효하지 않은 ID:', id);
                    reject(new Error('유효하지 않은 ID입니다.'));
                }
            } catch (error) {
                console.error('일회성 지출 수정 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 반복 지출 수정
    updateRecurringExpense(id, frequency, day, amount, description, startDate, endDate, mainCategory, subCategory, skipWeekends, skipHolidays, isActualPayment = true, vendor = '') {
        return new Promise(async (resolve, reject) => {
            try {
                // id로 항목 찾기 (반복 지출의 경우 id는 인덱스로 사용)
                if (id >= 0 && id < this.data.recurringExpenses.length) {
                    const expense = this.data.recurringExpenses[id];
                    const mongoId = expense._id;
                    
                    // 기존 생성된 데이터 삭제
                    const recurringId = `recurring-${id}`;
                    this.data.generatedExpenses = this.data.generatedExpenses.filter(
                        expense => !expense.recurringId || expense.recurringId !== recurringId
                    );
                    
                    // 이 반복 지출에 의해 생성된 일회성 지출 데이터도 함께 삭제
                    const oneTimeExpensesToDelete = this.data.oneTimeExpenses.filter(
                        expense => expense.recurringId && expense.recurringId === recurringId
                    );
                    
                    // 업데이트할 데이터 객체 생성
                    const updatedExpense = {
                        frequency: frequency,
                        day: frequency === 'monthly' ? parseInt(day) : null,
                        amount: parseFloat(amount),
                        description,
                        startDate,
                        endDate,
                        mainCategory,
                        subCategory,
                        skipWeekends: !!skipWeekends,
                        skipHolidays: !!skipHolidays,
                        isActualPayment: isActualPayment,  // 실입금 여부 추가
                        vendor: vendor || '' // 거래처 필드 추가
                    };
                    
                    // API 호출로 서버 데이터 업데이트
                    if (window.api && mongoId) {
                        try {
                            console.log(`서버에 반복 지출 업데이트 요청: ID=${mongoId}`);
                            const response = await window.api.recurringExpenses.update(mongoId, updatedExpense);
                            
                            if (response.success) {
                                console.log('서버 업데이트 성공:', response.data);
                                
                                // 서버에서 받은 업데이트된 객체로 로컬 데이터 갱신
                                if (response.data) {
                                    this.data.recurringExpenses[id] = response.data;
                                } else {
                                    // 서버 응답에 데이터가 없으면 로컬 객체로 업데이트
                                    this.data.recurringExpenses[id] = updatedExpense;
                                }
                                
                                // 연결된 일회성 지출 삭제
                                for (const expense of oneTimeExpensesToDelete) {
                                    if (expense._id) {
                                        try {
                                            await window.api.oneTimeExpenses.delete(expense._id);
                                            console.log(`연결된 일회성 지출 삭제: ID=${expense._id}`);
                                        } catch (deleteError) {
                                            console.error('연결된 일회성 지출 삭제 중 오류:', deleteError);
                                        }
                                    }
                                }
                            } else {
                                console.error('서버 업데이트 실패:', response.error);
                                // 서버 업데이트 실패 시에도 로컬 데이터는 업데이트
                                this.data.recurringExpenses[id] = updatedExpense;
                            }
                        } catch (apiError) {
                            console.error('API 호출 중 오류:', apiError);
                            // API 오류시 로컬 데이터만 업데이트
                            this.data.recurringExpenses[id] = updatedExpense;
                        }
                    } else {
                        // API 사용 불가능한 경우 로컬 데이터만 업데이트
                        this.data.recurringExpenses[id] = updatedExpense;
                    }
                    
                    // 먼저 로컬 데이터에서 일회성 지출 삭제
                    this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
                        expense => !expense.recurringId || expense.recurringId !== recurringId
                    );
                    
                    // 데이터 재생성 및 서버에 저장
                    const generatedExpenses = this.generateRecurringExpenseData(id);
                    
                    // 생성된 각 일회성 지출을 서버에 저장
                    if (window.api) {
                        for (const expense of generatedExpenses) {
                            try {
                                // 생성된 일회성 지출 항목도 서버에 저장
                                await window.api.oneTimeExpenses.create({
                                    date: expense.date,
                                    amount: expense.amount,
                                    description: expense.description,
                                    mainCategory: expense.mainCategory,
                                    subCategory: expense.subCategory,
                                    isActualPayment: expense.isActualPayment,
                                    recurringId: expense.recurringId
                                });
                            } catch (createError) {
                                console.error('생성된 일회성 지출 저장 중 오류:', createError);
                            }
                        }
                    }
                    
                    this.saveData();
                    resolve(this.data.recurringExpenses[id]);
                } else {
                    reject(new Error('유효하지 않은 ID입니다.'));
                }
            } catch (error) {
                console.error('반복 지출 수정 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 반복 지출 데이터 생성
    generateRecurringExpenseData(recurringIndex, modifiedRecurringItems = {}) {
        const recurringExpense = this.data.recurringExpenses[recurringIndex];
        if (!recurringExpense) return [];
        
        // 생성된 일회성 지출 목록
        const generatedExpenses = [];
        
        const startDate = new Date(recurringExpense.startDate);
        let endDate;
        
        if (recurringExpense.endDate) {
            endDate = new Date(recurringExpense.endDate);
        } else {
            // 종료일이 없으면 현재일 + 1년으로 설정 (적당한 범위로 제한)
            endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
        
        // 대분류 정보 찾기
        const mainCategory = this.data.categories.main.find(c => c.code === recurringExpense.mainCategory);
        const isIncome = mainCategory?.type === 'income';
        
        // 중분류 정보 찾기
        const subCategory = this.data.categories.sub.find(c => c.code === recurringExpense.subCategory);
        
        // 반복 ID
        const recurringId = `recurring-${recurringIndex}`;
        
        if (recurringExpense.frequency === 'daily') {
            // 매일 반복 - 시작일부터 종료일까지 매일 항목 생성
            const currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                // 주말이나 공휴일 제외 여부 확인
                const dayOfWeek = currentDate.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6); // 0: 일요일, 6: 토요일
                const isHoliday = this.isHoliday(currentDate);
                
                // 주말이나 공휴일인 경우 처리 방식 변경
                let dateToUse = new Date(currentDate);
                
                if ((recurringExpense.skipWeekends && isWeekend) || 
                    (recurringExpense.skipHolidays && isHoliday)) {
                    // 주말/공휴일인 경우 다음 평일로 이동
                    while (true) {
                        dateToUse.setDate(dateToUse.getDate() + 1);
                        const newDayOfWeek = dateToUse.getDay();
                        const newIsWeekend = (newDayOfWeek === 0 || newDayOfWeek === 6);
                        const newIsHoliday = this.isHoliday(dateToUse);
                        
                        // 평일이고 공휴일이 아닌 경우 선택
                        if ((!recurringExpense.skipWeekends || !newIsWeekend) && 
                            (!recurringExpense.skipHolidays || !newIsHoliday)) {
                            break;
                        }
                    }
                }
                
                const formattedDate = this.formatDate(dateToUse);
                
                // 이미 수정된 항목인지 확인
                const modifiedItemKey = `${recurringId}-${formattedDate}`;
                const isModified = modifiedRecurringItems && modifiedRecurringItems[modifiedItemKey];
                
                // 일회성 지출에 추가 (중복 확인)
                const isDuplicateInOneTime = this.data.oneTimeExpenses.some(
                    e => e.date === formattedDate && 
                         e.recurringId === recurringId
                );
                
                if (!isDuplicateInOneTime) {
                    let newExpense;
                    if (isModified) {
                        // 수정된 항목이 있으면 원본 데이터 사용
                        newExpense = modifiedRecurringItems[modifiedItemKey];
                        this.data.oneTimeExpenses.push(newExpense);
                        generatedExpenses.push(newExpense);
                        console.log(`수정된 반복 항목 유지: ${formattedDate}, ${modifiedRecurringItems[modifiedItemKey].description}`);
                    } else {
                        // 원본 반복 항목 데이터로 새로 생성
                        newExpense = {
                            id: this.getNextId(),  // 고유 ID 추가
                            date: formattedDate,
                            amount: recurringExpense.amount,
                            description: `${recurringExpense.description}`,
                            mainCategory: recurringExpense.mainCategory,
                            subCategory: recurringExpense.subCategory,
                            isActualPayment: recurringExpense.isActualPayment,
                            recurringId: recurringId, // 추적을 위한 ID 추가
                            vendor: recurringExpense.vendor || '' // 거래처 정보 추가
                        };
                        this.data.oneTimeExpenses.push(newExpense);
                        generatedExpenses.push(newExpense);
                    }
                }
                
                // 다음 날짜로 이동
                currentDate.setDate(currentDate.getDate() + 1);
            }
        } else {
            // 매월 반복 - 해당 일자에 항목 생성
            const day = recurringExpense.day;
            
            // 시작월부터 종료월까지 반복
            const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            
            while (currentDate <= lastMonth) {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                
                // 해당 월의 마지막 일자 확인 (실제 존재하는 일자 계산)
                const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
                const actualDay = Math.min(day, lastDayOfMonth);
                
                // 실제 날짜 객체 생성
                const expenseDate = new Date(year, month, actualDay);
                
                // 시작일보다 이전이면 건너뛰기
                if (expenseDate < startDate) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    continue;
                }
                
                // 종료일보다 이후면 종료
                if (expenseDate > endDate) {
                    break;
                }
                
                // 주말이나 공휴일 제외 여부 확인
                const dayOfWeek = expenseDate.getDay();
                const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
                const isHoliday = this.isHoliday(expenseDate);
                
                // 주말이나 공휴일인 경우 처리 방식 변경
                let dateToUse = new Date(expenseDate);
                
                if ((recurringExpense.skipWeekends && isWeekend) || 
                    (recurringExpense.skipHolidays && isHoliday)) {
                    // 주말/공휴일인 경우 다음 평일로 이동
                    while (true) {
                        dateToUse.setDate(dateToUse.getDate() + 1);
                        const newDayOfWeek = dateToUse.getDay();
                        const newIsWeekend = (newDayOfWeek === 0 || newDayOfWeek === 6);
                        const newIsHoliday = this.isHoliday(dateToUse);
                        
                        // 평일이고 공휴일이 아닌 경우 선택
                        if ((!recurringExpense.skipWeekends || !newIsWeekend) && 
                            (!recurringExpense.skipHolidays || !newIsHoliday)) {
                            break;
                        }
                    }
                }
                
                const formattedDate = this.formatDate(dateToUse);
                
                // 이미 수정된 항목인지 확인
                const modifiedItemKey = `${recurringId}-${formattedDate}`;
                const isModified = modifiedRecurringItems && modifiedRecurringItems[modifiedItemKey];
                
                // 일회성 지출에 추가 (중복 확인)
                const isDuplicateInOneTime = this.data.oneTimeExpenses.some(
                    e => e.date === formattedDate && 
                         e.recurringId === recurringId
                );
                
                if (!isDuplicateInOneTime) {
                    let newExpense;
                    if (isModified) {
                        // 수정된 항목이 있으면 원본 데이터 사용
                        newExpense = modifiedRecurringItems[modifiedItemKey];
                        this.data.oneTimeExpenses.push(newExpense);
                        generatedExpenses.push(newExpense);
                        console.log(`수정된 반복 항목 유지: ${formattedDate}, ${modifiedRecurringItems[modifiedItemKey].description}`);
                    } else {
                        // 원본 반복 항목 데이터로 새로 생성
                        newExpense = {
                            id: this.getNextId(),  // 고유 ID 추가
                            date: formattedDate,
                            amount: recurringExpense.amount,
                            description: `${recurringExpense.description}`,
                            mainCategory: recurringExpense.mainCategory,
                            subCategory: recurringExpense.subCategory,
                            isActualPayment: recurringExpense.isActualPayment,
                            recurringId: recurringId, // 추적을 위한 ID 추가
                            vendor: recurringExpense.vendor || '' // 거래처 정보 추가
                        };
                        this.data.oneTimeExpenses.push(newExpense);
                        generatedExpenses.push(newExpense);
                    }
                }
                
                // 다음 월로 이동
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }
        
        // 날짜 기준 정렬
        this.data.generatedExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
        
        return generatedExpenses;
    },
    
    // 모든 반복 지출 데이터 재생성
    regenerateAllRecurringExpenseData() {
        // 기존 생성 데이터 삭제
        this.data.generatedExpenses = [];
        
        // 기존에 수정된 반복 항목을 보존
        const modifiedRecurringItems = {};
        
        // 수정된 반복 항목을 ID와 날짜로 식별하여 저장
        this.data.oneTimeExpenses.forEach(expense => {
            if (expense.recurringId) {
                const key = `${expense.recurringId}-${expense.date}`;
                modifiedRecurringItems[key] = expense;
            }
        });
        
        // 먼저 반복 지출로 생성된 항목만 필터링하여 제거
        this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
            expense => !expense.recurringId
        );
        
        // 모든 반복 지출 항목에 대해 데이터 생성
        this.data.recurringExpenses.forEach((_, index) => {
            this.generateRecurringExpenseData(index, modifiedRecurringItems);
        });
        
        console.log('반복 지출 데이터 재생성 완료');
        this.saveData();
    },
    
    // 날짜를 YYYY-MM-DD 형식으로 변환
    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    // 공휴일 여부 확인
    isHoliday(date) {
        const year = date.getFullYear().toString();
        const month = date.getMonth() + 1; // 월은 0부터 시작하므로 +1
        const day = date.getDate();
        
        // 해당 연도의 공휴일 데이터가 있는지 확인
        if (this.data.holidays[year]) {
            return this.data.holidays[year].some(holiday => 
                holiday.month === month && holiday.day === day
            );
        }
        
        return false;
    },

    // 연도 변경
    changeYear(year) {
        this.data.year = year;
        
        // API를 통해 해당 연도의 공휴일 데이터 로드
        const yearStr = year.toString();
        if (window.api && window.api.holidays) {
            console.log(`${yearStr}년 공휴일 데이터 로드 시도`);
            window.api.holidays.getAll(year)
                .then(response => {
                    console.log(`${yearStr}년 공휴일 응답:`, response);
                    if (response.success && response.data) {
                        // 기존 데이터 초기화
                        this.data.holidays[yearStr] = [];
                        
                        // API에서 가져온 공휴일 데이터 처리
                        response.data.forEach(holiday => {
                            console.log('처리 중인 공휴일:', holiday);
                            
                            // month와 day가 문자열이면 숫자로 변환
                            const month = typeof holiday.month === 'string' ? parseInt(holiday.month) : holiday.month;
                            const day = typeof holiday.day === 'string' ? parseInt(holiday.day) : holiday.day;
                            
                            this.data.holidays[yearStr].push({
                                month: month,
                                day: day,
                                name: holiday.name,
                                _id: holiday._id // MongoDB ID 저장
                            });
                        });
                        
                        // 날짜순으로 정렬
                        this.data.holidays[yearStr].sort((a, b) => {
                            if (a.month === b.month) {
                                return a.day - b.day;
                            }
                            return a.month - b.month;
                        });
                        
                        console.log(`${yearStr}년 공휴일 ${this.data.holidays[yearStr].length}개 로드 완료`);
                        
                        // 달력 등 UI 업데이트를 위한 이벤트 발생
                        document.dispatchEvent(new CustomEvent('expenses-updated'));
                    } else {
                        console.error(`${yearStr}년 공휴일 데이터 로드 실패:`, response.error || '응답 없음');
                    }
                })
                .catch(error => {
                    console.error(`${yearStr}년 공휴일 데이터 로드 실패:`, error);
                });
        }
        
        // 일회성 지출 데이터도 API에서 로드
        if (window.api && window.api.oneTimeExpenses) {
            window.api.oneTimeExpenses.getAll(year)
                .then(response => {
                    if (response.success) {
                        this.data.oneTimeExpenses = response.data;
                        
                        // MongoDB ID를 로컬 ID로 사용
                        this.data.oneTimeExpenses.forEach(expense => {
                            if (expense._id && !expense.id) {
                                expense.id = expense._id;
                            }
                        });
                        
                        console.log(`${yearStr}년 일회성 지출 ${this.data.oneTimeExpenses.length}개 로드 완료`);
                        
                        // 달력 등 UI 업데이트를 위한 이벤트 발생
                        document.dispatchEvent(new CustomEvent('expenses-updated'));
                    }
                })
                .catch(error => {
                    console.error(`${yearStr}년 일회성 지출 데이터 로드 실패:`, error);
                });
        }
        
        this.saveData();
        return year;
    },
    
    // 대분류 추가
    addMainCategory(code, name, type = 'expense', order = null) {
        return new Promise(async (resolve, reject) => {
            try {
                // 중복 코드 검사
                if (this.data.categories.main.some(c => c.code === code)) {
                    reject(new Error(`이미 사용 중인 대분류 코드입니다: ${code}`));
                    return;
                }
                
                // 기본 순서는 마지막 순서 + 1
                if (order === null) {
                    const maxOrder = this.data.categories.main.reduce(
                        (max, category) => Math.max(max, category.order || 0), 0
                    );
                    order = maxOrder + 1;
                }
                
                const newCategory = { code, name, type, order };
                
                // API 호출로 서버에 데이터 저장
                if (window.api) {
                    try {
                        console.log('서버에 대분류 추가 요청:', newCategory);
                        const response = await window.api.categories.addMainCategory(newCategory);
                        
                        if (response.success) {
                            console.log('서버 대분류 추가 성공:', response.data);
                            
                            // 서버에서 받은 데이터로 로컬 데이터 갱신
                            if (response.data) {
                                this.data.categories.main.push(response.data);
                            } else {
                                // 서버 응답에 데이터가 없으면 로컬 객체 추가
                                this.data.categories.main.push(newCategory);
                            }
                        } else {
                            console.error('서버 대분류 추가 실패:', response.error);
                            // 서버 추가 실패 시에도 로컬 데이터에 추가
                            this.data.categories.main.push(newCategory);
                        }
                    } catch (apiError) {
                        console.error('API 호출 중 오류:', apiError);
                        // API 오류시 로컬 데이터만 추가
                        this.data.categories.main.push(newCategory);
                    }
                } else {
                    // API 사용 불가능한 경우 로컬 데이터만 추가
                    this.data.categories.main.push(newCategory);
                }
                
                this.saveData();
                resolve(this.data.categories.main);
            } catch (error) {
                console.error('대분류 추가 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 중분류 추가
    addSubCategory(mainCode, code, name) {
        return new Promise(async (resolve, reject) => {
            try {
                // 중복 코드 검사
                if (this.data.categories.sub.some(c => c.code === code)) {
                    reject(new Error(`이미 사용 중인 중분류 코드입니다: ${code}`));
                    return;
                }
                
                const newSubCategory = { mainCode, code, name };
                
                // API 호출로 서버에 데이터 저장
                if (window.api) {
                    try {
                        console.log('서버에 중분류 추가 요청:', newSubCategory);
                        const response = await window.api.categories.addSubCategory(newSubCategory);
                        
                        if (response.success) {
                            console.log('서버 중분류 추가 성공:', response.data);
                            
                            // 서버에서 받은 데이터로 로컬 데이터 갱신
                            if (response.data) {
                                this.data.categories.sub.push(response.data);
                            } else {
                                // 서버 응답에 데이터가 없으면 로컬 객체 추가
                                this.data.categories.sub.push(newSubCategory);
                            }
                        } else {
                            console.error('서버 중분류 추가 실패:', response.error);
                            // 서버 추가 실패 시에도 로컬 데이터에 추가
                            this.data.categories.sub.push(newSubCategory);
                        }
                    } catch (apiError) {
                        console.error('API 호출 중 오류:', apiError);
                        // API 오류시 로컬 데이터만 추가
                        this.data.categories.sub.push(newSubCategory);
                    }
                } else {
                    // API 사용 불가능한 경우 로컬 데이터만 추가
                    this.data.categories.sub.push(newSubCategory);
                }
                
                this.saveData();
                resolve(this.data.categories.sub);
            } catch (error) {
                console.error('중분류 추가 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 대분류 삭제
    removeMainCategory(index) {
        return new Promise(async (resolve, reject) => {
            try {
                const category = this.data.categories.main[index];
                
                // 해당 대분류를 사용하는 중분류 확인
                const hasSubCategories = this.data.categories.sub.some(sub => sub.mainCode === category.code);
                
                if (hasSubCategories) {
                    reject(new Error(`이 대분류를 사용하는 중분류가 있어 삭제할 수 없습니다: ${category.name}`));
                    return;
                }
                
                // 해당 대분류를 사용하는 지출 항목 확인
                const hasRecurringExpenses = this.data.recurringExpenses.some(exp => exp.mainCategory === category.code);
                const hasOneTimeExpenses = this.data.oneTimeExpenses.some(exp => exp.mainCategory === category.code);
                
                if (hasRecurringExpenses || hasOneTimeExpenses) {
                    reject(new Error(`이 대분류를 사용하는 지출 항목이 있어 삭제할 수 없습니다: ${category.name}`));
                    return;
                }
                
                // API 호출로 서버에서 데이터 삭제
                if (window.api && category._id) {
                    try {
                        console.log(`서버에서 대분류 삭제 요청: ID=${category._id}`);
                        const response = await window.api.categories.deleteMainCategory(category._id);
                        
                        if (response.success) {
                            console.log('서버 대분류 삭제 성공');
                        } else {
                            console.error('서버 대분류 삭제 실패:', response.error);
                        }
                    } catch (apiError) {
                        console.error('API 호출 중 오류:', apiError);
                    }
                }
                
                // 로컬 데이터 삭제
                this.data.categories.main.splice(index, 1);
                this.saveData();
                resolve(this.data.categories.main);
            } catch (error) {
                console.error('대분류 삭제 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 중분류 삭제
    removeSubCategory(index) {
        return new Promise(async (resolve, reject) => {
            try {
                const category = this.data.categories.sub[index];
                
                // 해당 중분류를 사용하는 지출 항목 확인
                const hasRecurringExpenses = this.data.recurringExpenses.some(exp => exp.subCategory === category.code);
                const hasOneTimeExpenses = this.data.oneTimeExpenses.some(exp => exp.subCategory === category.code);
                
                if (hasRecurringExpenses || hasOneTimeExpenses) {
                    reject(new Error(`이 중분류를 사용하는 지출 항목이 있어 삭제할 수 없습니다: ${category.name}`));
                    return;
                }
                
                // API 호출로 서버에서 데이터 삭제
                if (window.api && category._id) {
                    try {
                        console.log(`서버에서 중분류 삭제 요청: ID=${category._id}`);
                        const response = await window.api.categories.deleteSubCategory(category._id);
                        
                        if (response.success) {
                            console.log('서버 중분류 삭제 성공');
                        } else {
                            console.error('서버 중분류 삭제 실패:', response.error);
                        }
                    } catch (apiError) {
                        console.error('API 호출 중 오류:', apiError);
                    }
                }
                
                // 로컬 데이터 삭제
                this.data.categories.sub.splice(index, 1);
                this.saveData();
                resolve(this.data.categories.sub);
            } catch (error) {
                console.error('중분류 삭제 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 공휴일 추가
    addHoliday(year, month, day, name) {
        // 유효한 날짜인지 확인
        const date = new Date(parseInt(year), month - 1, day);
        if (date.getMonth() !== month - 1 || date.getDate() !== day) {
            throw new Error("유효하지 않은 날짜입니다.");
        }
        
        // 해당 년도의 공휴일 배열이 없으면 생성
        if (!this.data.holidays[year]) {
            this.data.holidays[year] = [];
        }
        
        // 이미 존재하는 공휴일인지 확인
        const exists = this.data.holidays[year].some(holiday => 
            holiday.month === month && holiday.day === day
        );
        
        if (exists) {
            throw new Error("해당 날짜에 이미 공휴일이 등록되어 있습니다.");
        }
        
        // 공휴일 추가
        this.data.holidays[year].push({ month, day, name });
        
        // 날짜순으로 정렬
        this.data.holidays[year].sort((a, b) => {
            if (a.month === b.month) {
                return a.day - b.day;
            }
            return a.month - b.month;
        });
        
        this.saveData();
        return this.data.holidays[year];
    },
    
    // 공휴일 삭제
    removeHoliday(year, index) {
        if (!this.data.holidays[year]) {
            throw new Error("해당 년도의 공휴일 데이터가 없습니다.");
        }
        
        this.data.holidays[year].splice(index, 1);
        this.saveData();
        return this.data.holidays[year];
    },

    // 새로운 고유 ID 생성
    getNextId() {
        const id = this.data.nextId++;
        this.saveData();
        return id;
    },

    // 대분류 이름 변경
    updateMainCategoryName(index, newName) {
        return new Promise(async (resolve, reject) => {
            try {
                if (index < 0 || index >= this.data.categories.main.length) {
                    reject(new Error('유효하지 않은 대분류 인덱스입니다.'));
                    return;
                }
                
                if (!newName || newName.trim() === '') {
                    reject(new Error('분류명은 비워둘 수 없습니다.'));
                    return;
                }
                
                // 이름 중복 확인
                const isDuplicate = this.data.categories.main.some((category, i) => 
                    i !== index && category.name.toLowerCase() === newName.trim().toLowerCase()
                );
                
                if (isDuplicate) {
                    reject(new Error(`'${newName}' 분류명은 이미 사용 중입니다.`));
                    return;
                }
                
                const category = this.data.categories.main[index];
                newName = newName.trim();
                
                // API 호출로 서버 데이터 업데이트
                if (window.api && category._id) {
                    try {
                        console.log(`서버에 대분류 이름 업데이트 요청: ID=${category._id}`);
                        const response = await window.api.categories.updateMainCategory(category._id, {
                            name: newName
                        });
                        
                        if (response.success) {
                            console.log('서버 대분류 이름 업데이트 성공:', response.data);
                            
                            // 서버에서 받은 데이터로 로컬 데이터 갱신
                            if (response.data) {
                                this.data.categories.main[index] = response.data;
                            } else {
                                // 서버 응답에 데이터가 없으면 로컬만 업데이트
                                this.data.categories.main[index].name = newName;
                            }
                        } else {
                            console.error('서버 대분류 이름 업데이트 실패:', response.error);
                            // 서버 업데이트 실패 시에도 로컬 데이터는 업데이트
                            this.data.categories.main[index].name = newName;
                        }
                    } catch (apiError) {
                        console.error('API 호출 중 오류:', apiError);
                        // API 오류시 로컬 데이터만 업데이트
                        this.data.categories.main[index].name = newName;
                    }
                } else {
                    // API 사용 불가능한 경우 로컬 데이터만 업데이트
                    this.data.categories.main[index].name = newName;
                }
                
                this.saveData();
                resolve(this.data.categories.main[index]);
            } catch (error) {
                console.error('대분류 이름 변경 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 중분류 이름 변경
    updateSubCategoryName(index, newName) {
        return new Promise(async (resolve, reject) => {
            try {
                if (index < 0 || index >= this.data.categories.sub.length) {
                    reject(new Error('유효하지 않은 중분류 인덱스입니다.'));
                    return;
                }
                
                if (!newName || newName.trim() === '') {
                    reject(new Error('분류명은 비워둘 수 없습니다.'));
                    return;
                }
                
                // 이름 중복 확인 (같은 대분류 내에서만)
                const mainCode = this.data.categories.sub[index].mainCode;
                const isDuplicate = this.data.categories.sub.some((category, i) => 
                    i !== index && 
                    category.mainCode === mainCode && 
                    category.name.toLowerCase() === newName.trim().toLowerCase()
                );
                
                if (isDuplicate) {
                    reject(new Error(`'${newName}' 분류명은 이미 사용 중입니다.`));
                    return;
                }
                
                const category = this.data.categories.sub[index];
                newName = newName.trim();
                
                // API 호출로 서버 데이터 업데이트
                if (window.api && category._id) {
                    try {
                        console.log(`서버에 중분류 이름 업데이트 요청: ID=${category._id}`);
                        const response = await window.api.categories.updateSubCategory(category._id, {
                            name: newName
                        });
                        
                        if (response.success) {
                            console.log('서버 중분류 이름 업데이트 성공:', response.data);
                            
                            // 서버에서 받은 데이터로 로컬 데이터 갱신
                            if (response.data) {
                                this.data.categories.sub[index] = response.data;
                            } else {
                                // 서버 응답에 데이터가 없으면 로컬만 업데이트
                                this.data.categories.sub[index].name = newName;
                            }
                        } else {
                            console.error('서버 중분류 이름 업데이트 실패:', response.error);
                            // 서버 업데이트 실패 시에도 로컬 데이터는 업데이트
                            this.data.categories.sub[index].name = newName;
                        }
                    } catch (apiError) {
                        console.error('API 호출 중 오류:', apiError);
                        // API 오류시 로컬 데이터만 업데이트
                        this.data.categories.sub[index].name = newName;
                    }
                } else {
                    // API 사용 불가능한 경우 로컬 데이터만 업데이트
                    this.data.categories.sub[index].name = newName;
                }
                
                this.saveData();
                resolve(this.data.categories.sub[index]);
            } catch (error) {
                console.error('중분류 이름 변경 중 오류 발생:', error);
                reject(error);
            }
        });
    },
    
    // 코드로 대분류 이름 변경
    updateMainCategoryByCode(code, newName) {
        return new Promise(async (resolve, reject) => {
            try {
                const index = this.data.categories.main.findIndex(c => c.code === code);
                if (index === -1) {
                    reject(new Error(`코드 '${code}'에 해당하는 대분류를 찾을 수 없습니다.`));
                    return;
                }
                
                const result = await this.updateMainCategoryName(index, newName);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // 코드로 중분류 이름 변경
    updateSubCategoryByCode(code, newName) {
        return new Promise(async (resolve, reject) => {
            try {
                const index = this.data.categories.sub.findIndex(c => c.code === code);
                if (index === -1) {
                    reject(new Error(`코드 '${code}'에 해당하는 중분류를 찾을 수 없습니다.`));
                    return;
                }
                
                const result = await this.updateSubCategoryName(index, newName);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
};

// DataManager 모듈 내보내기
window.DataManager = DataManager;
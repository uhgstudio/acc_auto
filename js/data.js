/**
 * 데이터 관리 모듈
 * 데이터 구조 정의 및 저장/불러오기, 백업/복원 기능을 담당
 */
const DataManager = {
    // 데이터 구조
    data: {
        recurringExpenses: [],
        oneTimeExpenses: [],
        year: new Date().getFullYear(),
        holidays: {}, // 년도별 공휴일 저장 (예: {'2024': [{month: 1, day: 1, name: '신정'}, ...], '2025': [...]})
        categories: {
            main: [], // 대분류 (예: [{code: 'LIVING', name: '생활비', type: 'expense'}, {code: 'FINANCE', name: '금융', type: 'expense'}, ...])
            sub: []   // 중분류 (예: [{mainCode: 'LIVING', code: 'FOOD', name: '식비'}, ...])
        }
    },

    // 데이터 초기화
    initialize() {
        this.loadData();
        if (Object.keys(this.data.categories.main).length === 0) {
            this.setupDefaultData();
        }
        return this.data;
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
                { code: 'INCOME', name: '수입', type: 'income' },
                { code: 'CARD_SALES', name: '카드 매출', type: 'income' },
                { code: 'CASH_DEPOSIT', name: '현금입금', type: 'income' },
                { code: 'OTHER_INCOME', name: '기타입금', type: 'income' },
                
                // 지출 관련 대분류
                { code: 'EXPENSE', name: '지출', type: 'expense' },
                { code: 'LABOR', name: '인건비', type: 'expense' },
                { code: 'ADMIN', name: '관리비', type: 'expense' },
                { code: 'TAX', name: '세금', type: 'expense' },
                { code: 'FINANCE', name: '금융지출', type: 'expense' },
                { code: 'FIXED_CHARGE', name: '공과금', type: 'expense' },
                { code: 'MEMBERSHIP', name: '멤버쉽카드', type: 'expense' },
                { code: 'RETAIL', name: '판매관리비', type: 'expense' },
                { code: 'INVESTMENT', name: '기타출금', type: 'expense' }
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
                
                // 관리비 중분류
                { mainCode: 'ADMIN', code: 'RENT', name: '임대료' },
                { mainCode: 'ADMIN', code: 'UTILITY', name: '공공/전기/통신료 등' },
                { mainCode: 'ADMIN', code: 'CLEANING', name: '청소' },
                { mainCode: 'ADMIN', code: 'SUPPLY', name: '전자제품/부자재' },
                { mainCode: 'ADMIN', code: 'VEHICLE', name: '차량유지' },
                
                // 세금 중분류
                { mainCode: 'TAX', code: 'VAT', name: '부가가치세' },
                { mainCode: 'TAX', code: 'INCOME_TAX', name: '갑종-근로' },
                { mainCode: 'TAX', code: 'CORPORATE_TAX', name: '갑종-글로벌교' },
                { mainCode: 'TAX', code: 'PROPERTY_TAX', name: '갑종-종대생성' },
                { mainCode: 'TAX', code: 'LOCAL_TAX', name: '갑종-오아마비스' },
                { mainCode: 'TAX', code: 'REGISTRATION_TAX', name: '갑종-에메트' },
                { mainCode: 'TAX', code: 'OTHER_TAX', name: '갑종-원두' },
                { mainCode: 'TAX', code: 'FRANCHISE_TAX', name: '갑종-아몬드젤리' },
                { mainCode: 'TAX', code: 'SALES_TAX', name: '갑종-전성' },
                { mainCode: 'TAX', code: 'PUBLIC_TAX', name: '갑종-전선물건' },
                { mainCode: 'TAX', code: 'BUSINESS_TAX', name: '갑종-커피원빈지' },
                { mainCode: 'TAX', code: 'SERVICE_TAX', name: '갑종-피피스' },
                { mainCode: 'TAX', code: 'LUXURY_TAX', name: '갑종-플라또' },
                { mainCode: 'TAX', code: 'ALCOHOL_TAX', name: '갑종-홀추' },
                
                // 공과금 중분류
                { mainCode: 'FIXED_CHARGE', code: 'POSTAL', name: '우체국등' },
                { mainCode: 'FIXED_CHARGE', code: 'STARBUCKS', name: '스타벅스카드 외' },
                
                // 멤버쉽카드 중분류
                { mainCode: 'MEMBERSHIP', code: 'MEMBER_CARD', name: '멤버쉽카드' },
                
                // 판매관리비 중분류
                { mainCode: 'RETAIL', code: 'WHOLESALE_FEE', name: '지급장려(집중품)' },
                { mainCode: 'RETAIL', code: 'RETAIL_FEE', name: '지급장려(영산품)' },
                { mainCode: 'RETAIL', code: 'TRANSIT', name: '운반비' },
                { mainCode: 'RETAIL', code: 'LGU', name: 'LGU' },
                { mainCode: 'RETAIL', code: 'AIRCON', name: '에어컨' },
                { mainCode: 'RETAIL', code: 'LIGHTING', name: '조명' },
                { mainCode: 'RETAIL', code: 'SECURITY', name: '보안' },
                { mainCode: 'RETAIL', code: 'POS', name: '세무대행' },
                { mainCode: 'RETAIL', code: 'SOFTWARE', name: '세스코' },
                { mainCode: 'RETAIL', code: 'SALES_PROM', name: '인시용품' },
                { mainCode: 'RETAIL', code: 'ADVERTISING', name: '아르질' },
                
                // 기타출금 중분류
                { mainCode: 'INVESTMENT', code: 'MARKET', name: '마켓증가' },
                { mainCode: 'INVESTMENT', code: 'TRANSFER', name: '지타증가' },
                { mainCode: 'INVESTMENT', code: 'HOME_LOAN', name: '자택담' },
                { mainCode: 'INVESTMENT', code: 'OFFICE_LOAN', name: '대출 상환' },
                
                // 수입 중분류
                { mainCode: 'INCOME', code: 'SALES', name: '수입' }
            ]
        };
        
        this.saveData();
    },

    // 데이터 로컬스토리지에서 불러오기
    loadData() {
        const savedData = localStorage.getItem('expenseData');
        if (savedData) {
            this.data = JSON.parse(savedData);
            
            // 기존 데이터에 holidays 필드가 없으면 추가
            if (!this.data.holidays) {
                this.data.holidays = {};
            }
            
            // 기존 데이터에 categories 필드가 없으면 추가
            if (!this.data.categories) {
                this.data.categories = {
                    main: [],
                    sub: []
                };
            }
        }
    },

    // 데이터 로컬스토리지에 저장하기
    saveData() {
        localStorage.setItem('expenseData', JSON.stringify(this.data));
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
            year: new Date().getFullYear(),
            holidays: {},
            categories: {
                main: [],
                sub: []
            }
        };
        this.setupDefaultData();
        this.saveData();
        return this.data;
    },
    
    // 반복 지출 추가
    addRecurringExpense(day, amount, description, startDate, endDate, mainCategory, subCategory) {
        this.data.recurringExpenses.push({
            day: parseInt(day),
            amount: parseFloat(amount),
            description,
            startDate, // 시작 년월 (YYYY-MM 형식)
            endDate,   // 종료 년월 (YYYY-MM 형식, 없으면 null)
            mainCategory,
            subCategory
        });
        this.saveData();
        return this.data.recurringExpenses;
    },

    // 반복 지출 삭제
    removeRecurringExpense(index) {
        this.data.recurringExpenses.splice(index, 1);
        this.saveData();
        return this.data.recurringExpenses;
    },

    // 일회성 지출 추가
    addOneTimeExpense(date, amount, description, mainCategory, subCategory) {
        this.data.oneTimeExpenses.push({
            date,
            amount: parseFloat(amount),
            description,
            mainCategory,
            subCategory
        });
        this.saveData();
        return this.data.oneTimeExpenses;
    },
    
    // 일회성 지출 삭제
    removeOneTimeExpense(index) {
        this.data.oneTimeExpenses.splice(index, 1);
        this.saveData();
        return this.data.oneTimeExpenses;
    },

    // 일회성 지출 수정
    updateOneTimeExpense(id, date, amount, description, mainCategory, subCategory) {
        // id로 항목 찾기 (일회성 지출의 경우 id는 인덱스로 사용)
        if (id < 0 || id >= this.data.oneTimeExpenses.length) {
            throw new Error('유효하지 않은 항목 ID입니다.');
        }
        
        // 수정된 항목으로 업데이트
        this.data.oneTimeExpenses[id] = {
            date,
            amount: parseFloat(amount),
            description,
            mainCategory,
            subCategory: subCategory || null
        };
        
        // 데이터 저장
        this.saveData();
        
        return this.data.oneTimeExpenses[id];
    },

    // 반복 지출 수정
    updateRecurringExpense(id, day, amount, description, startDate, endDate, mainCategory, subCategory) {
        // id로 항목 찾기 (반복 지출의 경우 id는 인덱스로 사용)
        if (id < 0 || id >= this.data.recurringExpenses.length) {
            throw new Error('유효하지 않은 항목 ID입니다.');
        }
        
        // 수정된 항목으로 업데이트
        this.data.recurringExpenses[id] = {
            day: parseInt(day),
            amount: parseFloat(amount),
            description,
            startDate,
            endDate: endDate || null,
            mainCategory,
            subCategory: subCategory || null
        };
        
        // 데이터 저장
        this.saveData();
        
        return this.data.recurringExpenses[id];
    },

    // 기준 년도 변경
    changeYear(year) {
        this.data.year = parseInt(year);
        this.saveData();
        return this.data.year;
    },
    
    // 대분류 추가
    addMainCategory(code, name, type = 'expense') {
        // 중복 코드 검사
        if (this.data.categories.main.some(c => c.code === code)) {
            throw new Error(`이미 사용 중인 대분류 코드입니다: ${code}`);
        }
        
        // 대분류 추가
        this.data.categories.main.push({ code, name, type });
        this.saveData();
        return this.data.categories.main;
    },
    
    // 중분류 추가
    addSubCategory(mainCode, code, name) {
        // 중복 코드 검사
        if (this.data.categories.sub.some(c => c.code === code)) {
            throw new Error(`이미 사용 중인 중분류 코드입니다: ${code}`);
        }
        
        // 중분류 추가
        this.data.categories.sub.push({ mainCode, code, name });
        this.saveData();
        return this.data.categories.sub;
    },
    
    // 대분류 삭제
    removeMainCategory(index) {
        const category = this.data.categories.main[index];
        
        // 해당 대분류를 사용하는 중분류 확인
        const hasSubCategories = this.data.categories.sub.some(sub => sub.mainCode === category.code);
        
        if (hasSubCategories) {
            throw new Error(`이 대분류를 사용하는 중분류가 있어 삭제할 수 없습니다: ${category.name}`);
        }
        
        // 해당 대분류를 사용하는 지출 항목 확인
        const hasRecurringExpenses = this.data.recurringExpenses.some(exp => exp.mainCategory === category.code);
        const hasOneTimeExpenses = this.data.oneTimeExpenses.some(exp => exp.mainCategory === category.code);
        
        if (hasRecurringExpenses || hasOneTimeExpenses) {
            throw new Error(`이 대분류를 사용하는 지출 항목이 있어 삭제할 수 없습니다: ${category.name}`);
        }
        
        this.data.categories.main.splice(index, 1);
        this.saveData();
        return this.data.categories.main;
    },
    
    // 중분류 삭제
    removeSubCategory(index) {
        const category = this.data.categories.sub[index];
        
        // 해당 중분류를 사용하는 지출 항목 확인
        const hasRecurringExpenses = this.data.recurringExpenses.some(exp => exp.subCategory === category.code);
        const hasOneTimeExpenses = this.data.oneTimeExpenses.some(exp => exp.subCategory === category.code);
        
        if (hasRecurringExpenses || hasOneTimeExpenses) {
            throw new Error(`이 중분류를 사용하는 지출 항목이 있어 삭제할 수 없습니다: ${category.name}`);
        }
        
        this.data.categories.sub.splice(index, 1);
        this.saveData();
        return this.data.categories.sub;
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
    }
}; 
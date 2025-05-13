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
        }
    },

    // 데이터 초기화
    initialize() {
        this.loadData();
        if (Object.keys(this.data.categories.main).length === 0) {
            this.setupDefaultData();
        }
        
        // 기존 데이터 마이그레이션 (frequency 필드 추가)
        this.migrateData();
        
        return this.data;
    },
    
    // 기존 데이터 구조 업데이트
    migrateData() {
        // generatedExpenses 배열이 없으면 추가
        if (!this.data.generatedExpenses) {
            this.data.generatedExpenses = [];
        }
        
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
            
            // 기존 데이터에 generatedExpenses 필드가 없으면 추가
            if (!this.data.generatedExpenses) {
                this.data.generatedExpenses = [];
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
            generatedExpenses: [],
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
    addRecurringExpense(frequency, day, amount, description, startDate, endDate, mainCategory, subCategory, skipWeekends, skipHolidays, isActualPayment = true) {
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
            isActualPayment: isActualPayment  // 실입금 여부 추가
        };
        
        this.data.recurringExpenses.push(newExpense);
        this.saveData();
        
        // 실제 데이터 생성 (pregeneration)
        this.generateRecurringExpenseData(this.data.recurringExpenses.length - 1);
        
        return this.data.recurringExpenses;
    },

    // 반복 지출 삭제
    removeRecurringExpense(index) {
        // 해당 반복 지출로 생성된 항목들 삭제
        const recurringId = `recurring-${index}`;
        this.data.generatedExpenses = this.data.generatedExpenses.filter(
            expense => !expense.recurringId || expense.recurringId !== recurringId
        );
        
        // 이 반복 지출에 의해 생성된 일회성 지출 데이터도 함께 삭제
        this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
            expense => !expense.recurringId || expense.recurringId !== recurringId
        );
        
        // 반복 지출 항목 삭제
        this.data.recurringExpenses.splice(index, 1);
        
        // 인덱스가 바뀐 항목들의 ID 재조정
        this.updateRecurringReferences();
        
        this.saveData();
        return this.data.recurringExpenses;
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
    addOneTimeExpense(date, amount, description, mainCategory, subCategory, isActualPayment = true) {
        const newExpense = {
            date,
            amount: parseFloat(amount),
            description,
            mainCategory,
            subCategory,
            isActualPayment: isActualPayment  // 실입금 여부 추가
        };
        
        this.data.oneTimeExpenses.push(newExpense);
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
    updateOneTimeExpense(id, date, amount, description, mainCategory, subCategory, isActualPayment = true) {
        // id에서 인덱스 추출 (id 형식: "onetime-index")
        const idParts = id.toString().split('-');
        if (idParts.length === 2 && idParts[0] === 'onetime') {
            const index = parseInt(idParts[1]);
            
            // 유효한 인덱스인지 확인
            if (index >= 0 && index < this.data.oneTimeExpenses.length) {
                // 수정할 항목
                const expense = this.data.oneTimeExpenses[index];
                
                // 수정하지 않을 기존 데이터 보존 (recurringId 등)
                const recurringId = expense.recurringId;
                
                // 항목 업데이트
                this.data.oneTimeExpenses[index] = {
                    date,
                    amount: parseFloat(amount),
                    description,
                    mainCategory,
                    subCategory,
                    isActualPayment,
                    recurringId // 반복 항목과의 연결 유지
                };
                
                this.saveData();
                return this.data.oneTimeExpenses;
            }
        }
        
        throw new Error('유효하지 않은 ID입니다.');
    },

    // 반복 지출 수정
    updateRecurringExpense(id, frequency, day, amount, description, startDate, endDate, mainCategory, subCategory, skipWeekends, skipHolidays, isActualPayment = true) {
        // id로 항목 찾기 (반복 지출의 경우 id는 인덱스로 사용)
        if (id >= 0 && id < this.data.recurringExpenses.length) {
            // 기존 생성된 데이터 삭제
            const recurringId = `recurring-${id}`;
            this.data.generatedExpenses = this.data.generatedExpenses.filter(
                expense => !expense.recurringId || expense.recurringId !== recurringId
            );
            
            // 이 반복 지출에 의해 생성된 일회성 지출 데이터도 함께 삭제
            this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
                expense => !expense.recurringId || expense.recurringId !== recurringId
            );
            
            // 항목 업데이트
            this.data.recurringExpenses[id] = {
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
                isActualPayment: isActualPayment  // 실입금 여부 추가
            };
            
            // 데이터 재생성
            this.generateRecurringExpenseData(id);
            
            this.saveData();
            return this.data.recurringExpenses;
        } else {
            throw new Error('유효하지 않은 ID입니다.');
        }
    },
    
    // 반복 지출 데이터 생성
    generateRecurringExpenseData(recurringIndex) {
        const recurringExpense = this.data.recurringExpenses[recurringIndex];
        if (!recurringExpense) return;
        
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
                
                // 생성된 항목
                const generatedExpense = {
                    date: formattedDate,
                    amount: recurringExpense.amount,
                    description: recurringExpense.description,
                    mainCategory: recurringExpense.mainCategory,
                    mainCategoryName: mainCategory?.name || '',
                    subCategory: recurringExpense.subCategory,
                    subCategoryName: subCategory?.name || '',
                    isIncome: isIncome,
                    isRecurring: true,
                    frequency: 'daily',
                    isActualPayment: recurringExpense.isActualPayment,
                    recurringId: recurringId
                };
                
                // 중복 항목이 없는 경우에만 추가
                const isDuplicate = this.data.generatedExpenses.some(
                    e => e.date === formattedDate && 
                         e.recurringId === recurringId
                );
                
                if (!isDuplicate) {
                    this.data.generatedExpenses.push(generatedExpense);
                    
                    // 일회성 지출에도 동일한 데이터 추가 (pregeneration)
                    this.data.oneTimeExpenses.push({
                        date: formattedDate,
                        amount: recurringExpense.amount,
                        description: `[반복] ${recurringExpense.description}`,
                        mainCategory: recurringExpense.mainCategory,
                        subCategory: recurringExpense.subCategory,
                        isActualPayment: recurringExpense.isActualPayment,
                        recurringId: recurringId // 추적을 위한 ID 추가
                    });
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
                
                // 생성된 항목
                const generatedExpense = {
                    date: formattedDate,
                    amount: recurringExpense.amount,
                    description: recurringExpense.description,
                    mainCategory: recurringExpense.mainCategory,
                    mainCategoryName: mainCategory?.name || '',
                    subCategory: recurringExpense.subCategory,
                    subCategoryName: subCategory?.name || '',
                    isIncome: isIncome,
                    isRecurring: true,
                    frequency: 'monthly',
                    isActualPayment: recurringExpense.isActualPayment,
                    recurringId: recurringId
                };
                
                // 중복 항목이 없는 경우에만 추가
                const isDuplicate = this.data.generatedExpenses.some(
                    e => e.date === formattedDate && 
                         e.recurringId === recurringId
                );
                
                if (!isDuplicate) {
                    this.data.generatedExpenses.push(generatedExpense);
                    
                    // 일회성 지출에도 동일한 데이터 추가 (pregeneration)
                    this.data.oneTimeExpenses.push({
                        date: formattedDate,
                        amount: recurringExpense.amount,
                        description: `[반복] ${recurringExpense.description}`,
                        mainCategory: recurringExpense.mainCategory,
                        subCategory: recurringExpense.subCategory,
                        isActualPayment: recurringExpense.isActualPayment,
                        recurringId: recurringId // 추적을 위한 ID 추가
                    });
                }
            }
        }
        
        // 날짜 기준 정렬
        this.data.generatedExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.saveData();
    },
    
    // 모든 반복 지출 데이터 재생성
    regenerateAllRecurringExpenseData() {
        // 기존 생성 데이터 삭제
        this.data.generatedExpenses = [];
        
        // 모든 반복 지출이 생성한 일회성 데이터 삭제
        this.data.oneTimeExpenses = this.data.oneTimeExpenses.filter(
            expense => !expense.recurringId
        );
        
        // 모든 반복 지출 항목에 대해 데이터 생성
        this.data.recurringExpenses.forEach((_, index) => {
            this.generateRecurringExpenseData(index);
        });
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
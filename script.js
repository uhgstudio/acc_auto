// 데이터 관리 객체
const ExpenseManager = {
    // 데이터 구조
    data: {
        recurringExpenses: [],
        oneTimeExpenses: [],
        year: new Date().getFullYear(),
        holidays: {}, // 년도별 공휴일 저장 (예: {'2024': [{month: 1, day: 1, name: '신정'}, ...], '2025': [...]})
        categories: {
            main: [], // 대분류 (예: [{code: 'LIVING', name: '생활비'}, {code: 'FINANCE', name: '금융'}, ...])
            sub: []   // 중분류 (예: [{mainCode: 'LIVING', code: 'FOOD', name: '식비'}, ...])
        }
    },

    // 초기화
    init() {
        this.loadData();
        
        // 년도 선택 옵션 설정
        const yearSelect = document.getElementById('year');
        if (yearSelect) {
            // 현재 년도 기준으로 5년 전부터 5년 후까지 옵션 생성
            const currentYear = new Date().getFullYear();
            for (let y = currentYear - 5; y <= currentYear + 5; y++) {
                const option = document.createElement('option');
                option.value = y;
                option.textContent = `${y}년`;
                yearSelect.appendChild(option);
            }
            yearSelect.value = this.data.year;
        }
        
        const calendarYearElement = document.getElementById('calendar-year');
        if (calendarYearElement) {
            calendarYearElement.textContent = this.data.year;
        }
        
        this.renderRecurringExpenses();
        this.renderCalendar();
        this.updateSummary();
        this.setupEventListeners();
        this.updateCategorySelects();
        this.updateHolidayYearOptions();
        this.renderHolidays(this.data.year.toString());
        
        // 분류관리 탭 데이터 초기화
        this.updateSubCategoryMainSelect(); // 중분류 대분류 선택옵션 업데이트
        this.renderMainCategories();        // 대분류 테이블 렌더링
        this.renderSubCategories();         // 중분류 테이블 렌더링
        
        // 분류 관리 탭 클릭 이벤트 강화
        const categoryTab = document.querySelector('[data-tab="category"]');
        if (categoryTab) {
            categoryTab.addEventListener('click', () => {
                setTimeout(() => {
                    // 분류 관리 탭의 데이터 다시 렌더링
                    this.renderMainCategories();
                    this.renderSubCategories();
                    this.updateSubCategoryMainSelect();
                    
                    // 대분류 탭이 기본적으로 표시되도록 설정
                    const mainCategoryTab = document.querySelector('[data-bs-target="#main-category"]');
                    const mainCategoryPane = document.getElementById('main-category');
                    if (mainCategoryTab && mainCategoryPane) {
                        // 모든 탭 비활성화
                        document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
                        mainCategoryTab.classList.add('active');
                        
                        // 모든 탭 컨텐츠 비활성화
                        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('show', 'active'));
                        mainCategoryPane.classList.add('show', 'active');
                    }
                }, 100);
            });
        }
        
        this.renderOneTimeExpenses();
        
        // Bootstrap 탭 초기 설정
        this.initializeBootstrapTabs();
        
        // 분류관리 탭 초기화 및 이벤트 설정
        this.setupCategoryTabListeners();
    },

    // Bootstrap 탭 초기화 함수 추가
    initializeBootstrapTabs() {
        // 분류 관리 탭 초기화
        const categoryTabs = document.querySelectorAll('[data-bs-toggle="tab"]');
        categoryTabs.forEach(tab => {
            // 기존 이벤트 제거 (중복 방지)
            const clonedTab = tab.cloneNode(true);
            if (tab.parentNode) {
                tab.parentNode.replaceChild(clonedTab, tab);
            }
            
            // 초기 활성화 상태 설정
            if (clonedTab.classList.contains('active')) {
                const targetId = clonedTab.getAttribute('data-bs-target');
                const targetContent = document.querySelector(targetId);
                if (targetContent) {
                    targetContent.classList.add('show', 'active');
                }
            }
            
            // 이벤트 리스너 추가
            clonedTab.addEventListener('click', (e) => {
                e.preventDefault();
                
                // 모든 탭과 탭 컨텐츠 비활성화
                document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(c => {
                    c.classList.remove('show', 'active');
                });
                
                // 클릭한 탭 활성화
                clonedTab.classList.add('active');
                
                // 해당 컨텐츠 활성화
                const targetId = clonedTab.getAttribute('data-bs-target');
                const targetContent = document.querySelector(targetId);
                if (targetContent) {
                    targetContent.classList.add('show', 'active');
                }
                
                // 탭에 따라 적절한 카테고리 렌더링
                if (targetId === '#main-category') {
                    this.renderMainCategories();
                } else if (targetId === '#sub-category') {
                    this.renderSubCategories();
                    this.updateSubCategoryMainSelect();
                }
            });
        });
        
        // 분류관리 탭의 대분류/중분류 탭 초기 상태 설정
        const mainCategoryTab = document.querySelector('[data-bs-target="#main-category"]');
        if (mainCategoryTab) {
            mainCategoryTab.classList.add('active');
            const mainCategoryPane = document.getElementById('main-category');
            if (mainCategoryPane) {
                mainCategoryPane.classList.add('show', 'active');
            }
        }
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
        } else {
            this.data.year = new Date().getFullYear();
            document.getElementById('year').value = this.data.year;
            document.getElementById('calendar-year').textContent = this.data.year;
            
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
                    { code: 'LIVING', name: '생활비' },
                    { code: 'FINANCE', name: '금융' },
                    { code: 'LEISURE', name: '여가' },
                    { code: 'ETC', name: '기타' }
                ],
                sub: [
                    { mainCode: 'LIVING', code: 'FOOD', name: '식비' },
                    { mainCode: 'LIVING', code: 'HOUSE', name: '주거/관리비' },
                    { mainCode: 'LIVING', code: 'UTIL', name: '공과금' },
                    { mainCode: 'FINANCE', code: 'INSUR', name: '보험' },
                    { mainCode: 'FINANCE', code: 'SAVING', name: '저축' },
                    { mainCode: 'FINANCE', code: 'INVEST', name: '투자' },
                    { mainCode: 'LEISURE', code: 'HOBBY', name: '취미' },
                    { mainCode: 'LEISURE', code: 'TRIP', name: '여행' },
                    { mainCode: 'ETC', code: 'OTHER', name: '기타' }
                ]
            };
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
                    this.renderRecurringExpenses();
                    this.renderCalendar();
                    this.updateSummary();
                    
                    document.getElementById('year').value = this.data.year;
                    document.getElementById('calendar-year').textContent = this.data.year;
                    
                    alert('데이터가 성공적으로 복원되었습니다.');
                } else {
                    alert('유효하지 않은 백업 파일입니다.');
                }
            } catch (e) {
                alert('파일을 읽는 중 오류가 발생했습니다: ' + e.message);
            }
        };
        reader.readAsText(jsonFile);
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
        this.renderRecurringExpenses();
        this.renderCalendar();
        this.updateSummary();
    },

    // 반복 지출 삭제
    removeRecurringExpense(index) {
        this.data.recurringExpenses.splice(index, 1);
        this.saveData();
        this.renderRecurringExpenses();
        this.renderCalendar();
        this.updateSummary();
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
        this.renderCalendar();
        this.updateSummary();
    },

    // 기준 년도 변경
    changeYear(year) {
        this.data.year = parseInt(year);
        document.getElementById('year').value = this.data.year;
        document.getElementById('calendar-year').textContent = this.data.year;
        this.saveData();
        this.renderCalendar();
        this.updateSummary();
    },

    // 반복 지출 목록 렌더링
    renderRecurringExpenses() {
        const list = document.getElementById('recurring-list');
        list.innerHTML = '';

        if (this.data.recurringExpenses.length === 0) {
            list.innerHTML = '<p class="text-center text-muted py-3">등록된 반복 지출이 없습니다.</p>';
            return;
        }

        this.data.recurringExpenses.forEach((expense, index) => {
            // 대분류/중분류 이름 찾기
            const mainCategory = this.data.categories.main.find(c => c.code === expense.mainCategory)?.name || '';
            const subCategory = this.data.categories.sub.find(c => c.code === expense.subCategory)?.name || '';
            const categoryText = mainCategory && subCategory ? `<span class="badge badge-primary">${mainCategory} > ${subCategory}</span>` : '';
            
            // 기간 정보
            let periodText = '';
            if (expense.startDate) {
                periodText += `${expense.startDate}부터 `;
                if (expense.endDate) {
                    periodText += `${expense.endDate}까지`;
                } else {
                    periodText += `계속`;
                }
            }
            
            const li = document.createElement('li');
            li.className = 'expense-item';
            li.innerHTML = `
                <div class="expense-info">
                    <div class="d-flex align-items-center mb-1">
                        <strong class="me-2">${expense.description}</strong>
                        ${categoryText}
                    </div>
                    <div class="text-muted small">
                        매월 ${expense.day}일, ${expense.amount.toLocaleString()}원
                        ${periodText ? `<div class="period-info">${periodText}</div>` : ''}
                    </div>
                </div>
                <button class="btn btn-sm btn-danger delete-recurring-btn" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            list.appendChild(li);
        });

        // 삭제 버튼 이벤트
        const deleteButtons = document.querySelectorAll('.delete-recurring-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.closest('.delete-recurring-btn').dataset.index;
                this.removeRecurringExpense(index);
            });
        });
    },

    // 일회성 지출 목록 렌더링
    renderOneTimeExpenses() {
        const container = document.getElementById('onetime-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 현재 년도의 일회성 지출만 표시
        const currentYear = this.data.year;
        const filteredExpenses = this.data.oneTimeExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === currentYear;
        });
        
        if (filteredExpenses.length === 0) {
            container.innerHTML = '<p class="text-center text-muted py-3">등록된 일회성 지출이 없습니다.</p>';
            return;
        }
        
        // 날짜별로 정렬
        filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const table = document.createElement('table');
        table.className = 'table table-hover';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>날짜</th>
                <th>설명</th>
                <th>분류</th>
                <th>금액</th>
                <th>관리</th>
            </tr>
        `;
        
        const tbody = document.createElement('tbody');
        
        filteredExpenses.forEach((expense, index) => {
            const expenseDate = new Date(expense.date);
            const formattedDate = `${expenseDate.getMonth() + 1}월 ${expenseDate.getDate()}일`;
            
            // 대분류/중분류 이름 찾기
            const mainCategory = this.data.categories.main.find(c => c.code === expense.mainCategory)?.name || '';
            const subCategory = this.data.categories.sub.find(c => c.code === expense.subCategory)?.name || '';
            const categoryText = mainCategory && subCategory ? `${mainCategory} > ${subCategory}` : '미분류';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td>${expense.description}</td>
                <td>${categoryText}</td>
                <td class="text-end">${expense.amount.toLocaleString()}원</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-onetime-btn" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);
        
        // 삭제 버튼 이벤트
        const deleteButtons = document.querySelectorAll('.delete-onetime-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.delete-onetime-btn').dataset.index);
                
                if (confirm('정말로 이 지출 항목을 삭제하시겠습니까?')) {
                    this.data.oneTimeExpenses.splice(index, 1);
                    this.saveData();
                    this.renderOneTimeExpenses();
                    this.renderCalendar();
                    this.updateSummary();
                }
            });
        });
    },

    // 주어진 날짜가 공휴일인지 확인 (한국 공휴일 일부)
    isHoliday(date) {
        const year = date.getFullYear().toString();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 해당 년도의 공휴일 목록이 있는지 확인
        if (this.data.holidays[year]) {
            // 해당 날짜가 공휴일인지 확인
            return this.data.holidays[year].some(holiday => 
                holiday.month === month && holiday.day === day
            );
        }
        
        return false;
    },

    // 주어진 날짜가 주말인지 확인
    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // 0: 일요일, 6: 토요일
    },

    // 지출일이 주말이나 공휴일인 경우 다음 영업일 찾기
    getNextBusinessDay(date) {
        let nextDay = new Date(date);
        
        do {
            nextDay.setDate(nextDay.getDate() + 1);
        } while (this.isWeekend(nextDay) || this.isHoliday(nextDay));
        
        return nextDay;
    },

    // 달력 렌더링 - 수정된 버전
    renderCalendar() {
        const calendarContainer = document.getElementById('expense-calendar');
        calendarContainer.innerHTML = '';
        
        const year = this.data.year;
        document.getElementById('calendar-year').textContent = year;

        // 12개월 생성
        for (let month = 0; month < 12; month++) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month-card';
            
            const monthTitle = document.createElement('div');
            monthTitle.className = 'month-header';
            monthTitle.textContent = `${month + 1}월`;
            monthDiv.appendChild(monthTitle);
            
            const monthBody = document.createElement('div');
            monthBody.className = 'month-body';
            
            // 해당 월의 지출 항목들 계산
            const expenses = [];
            
            // 반복 지출 항목 추가 (지정된 기간 내에 있는 것만)
            this.data.recurringExpenses.forEach(expense => {
                // 현재 년월 (YYYY-MM 형식)
                const currentYearMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;
                
                // 시작 날짜가 있고 현재 년월이 시작 년월보다 이전이면 건너뜀
                if (expense.startDate && currentYearMonth < expense.startDate) {
                    return;
                }
                
                // 종료 날짜가 있고 현재 년월이 종료 년월보다 이후면 건너뜀
                if (expense.endDate && currentYearMonth > expense.endDate) {
                    return;
                }
                
                let expenseDate = new Date(year, month, expense.day);
                
                // 해당 날짜가 유효한지 확인 (예: 2월 30일 등의 경우)
                if (expenseDate.getMonth() !== month) {
                    // 유효하지 않은 날짜면 해당 월의 마지막 날로 설정
                    expenseDate = new Date(year, month + 1, 0);
                }
                
                let adjustedDate = expenseDate;
                let isAdjusted = false;
                
                // 주말이나 공휴일인 경우 다음 영업일로 조정
                if (this.isWeekend(expenseDate) || this.isHoliday(expenseDate)) {
                    adjustedDate = this.getNextBusinessDay(expenseDate);
                    isAdjusted = true;
                }
                
                // 조정된 날짜가 다음 달로 넘어가면 해당 월에 포함시키지 않음
                if (adjustedDate.getMonth() === month) {
                    // 대분류/중분류 찾기
                    const mainCategory = this.data.categories.main.find(c => c.code === expense.mainCategory)?.name || '';
                    const subCategory = this.data.categories.sub.find(c => c.code === expense.subCategory)?.name || '';
                    
                    expenses.push({
                        date: adjustedDate,
                        amount: expense.amount,
                        description: expense.description,
                        isAdjusted,
                        originalDate: isAdjusted ? expenseDate : null,
                        type: '반복',
                        mainCategory: expense.mainCategory,
                        subCategory: expense.subCategory,
                        mainCategoryName: mainCategory,
                        subCategoryName: subCategory
                    });
                }
            });
            
            // 일회성 지출 항목 추가
            this.data.oneTimeExpenses.forEach(expense => {
                const expenseDate = new Date(expense.date);
                if (expenseDate.getFullYear() === year && expenseDate.getMonth() === month) {
                    // 대분류/중분류 찾기
                    const mainCategory = this.data.categories.main.find(c => c.code === expense.mainCategory)?.name || '';
                    const subCategory = this.data.categories.sub.find(c => c.code === expense.subCategory)?.name || '';
                    
                    expenses.push({
                        date: expenseDate,
                        amount: expense.amount,
                        description: expense.description,
                        isAdjusted: false,
                        type: '일회성',
                        mainCategory: expense.mainCategory,
                        subCategory: expense.subCategory,
                        mainCategoryName: mainCategory,
                        subCategoryName: subCategory
                    });
                }
            });
            
            // 날짜별로 정렬
            expenses.sort((a, b) => a.date - b.date);
            
            // 분류별 요약 정보 계산
            const summarizedData = this.summarizeExpensesByCategory(expenses);
            
            // 요약 정보 표시
            if (expenses.length > 0) {
                // 총계 계산
                const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
                
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'summary-info';
                summaryDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>지출 내역 ${expenses.length}건</span>
                        <span>총 ${totalAmount.toLocaleString()}원</span>
                    </div>
                `;
                
                // 지출 목록 표시
                const expenseList = document.createElement('ul');
                expenseList.className = 'list-group mb-3';
                
                // 목록은 최대 3개만 표시
                const displayExpenses = expenses.slice(0, 3);
                
                displayExpenses.forEach(expense => {
                    const day = expense.date.getDate();
                    const item = document.createElement('li');
                    item.className = 'list-group-item d-flex justify-content-between align-items-center py-2';
                    
                    let categoryBadge = '';
                    if (expense.mainCategoryName) {
                        categoryBadge = `<span class="badge badge-primary">${expense.mainCategoryName}</span> `;
                    }
                    
                    item.innerHTML = `
                        <div>
                            <small class="text-muted">${day}일</small>
                            ${categoryBadge}
                            ${expense.description}
                        </div>
                        <span>${expense.amount.toLocaleString()}원</span>
                    `;
                    
                    expenseList.appendChild(item);
                });
                
                // 더 많은 항목이 있으면 표시
                if (expenses.length > 3) {
                    const moreItem = document.createElement('li');
                    moreItem.className = 'list-group-item text-center text-muted py-2';
                    moreItem.textContent = `외 ${expenses.length - 3}건 더 있음`;
                    expenseList.appendChild(moreItem);
                }
                
                // "상세 보기" 버튼
                const detailButton = document.createElement('button');
                detailButton.className = 'btn btn-sm btn-accent w-100';
                detailButton.innerHTML = '<i class="bi bi-list-ul"></i> 상세 보기';
                
                // 버튼 클릭 이벤트 - 상세보기 팝업 표시
                detailButton.addEventListener('click', () => {
                    this.showExpenseDetail(month, expenses);
                });
                
                monthBody.appendChild(summaryDiv);
                monthBody.appendChild(expenseList);
                monthBody.appendChild(detailButton);
            } else {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'text-center text-muted my-4';
                emptyMessage.textContent = '지출 내역이 없습니다.';
                monthBody.appendChild(emptyMessage);
            }
            
            monthDiv.appendChild(monthBody);
            calendarContainer.appendChild(monthDiv);
        }
    },
    
    // 지출 항목을 분류별로 요약
    summarizeExpensesByCategory(expenses) {
        const mainCategories = {};
        const subCategories = {};
        
        // 분류별로 금액 집계
        expenses.forEach(expense => {
            // 대분류 집계
            const mainKey = expense.mainCategory || 'NONE';
            const mainName = expense.mainCategoryName || '미분류';
            
            if (!mainCategories[mainKey]) {
                mainCategories[mainKey] = {
                    code: mainKey,
                    name: mainName,
                    count: 0,
                    amount: 0
                };
            }
            
            mainCategories[mainKey].count++;
            mainCategories[mainKey].amount += expense.amount;
            
            // 중분류 집계
            if (expense.mainCategory && expense.subCategory) {
                const subKey = `${expense.mainCategory}-${expense.subCategory}`;
                const subName = expense.subCategoryName || '미분류';
                
                if (!subCategories[subKey]) {
                    subCategories[subKey] = {
                        mainCode: expense.mainCategory,
                        mainName: expense.mainCategoryName || '미분류',
                        code: expense.subCategory,
                        name: subName,
                        count: 0,
                        amount: 0
                    };
                }
                
                subCategories[subKey].count++;
                subCategories[subKey].amount += expense.amount;
            }
        });
        
        // 객체를 배열로 변환하고 금액 내림차순으로 정렬
        const mainCategoriesArray = Object.values(mainCategories).sort((a, b) => b.amount - a.amount);
        const subCategoriesArray = Object.values(subCategories).sort((a, b) => b.amount - a.amount);
        
        return {
            mainCategories: mainCategoriesArray,
            subCategories: subCategoriesArray
        };
    },
    
    // 월별 지출 상세 내역 팝업 표시 (Bootstrap 스타일로 업데이트)
    showExpenseDetail(month, expenses) {
        // 기존 팝업 제거
        const existingPopup = document.getElementById('expense-detail-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // 팝업 컨테이너 생성
        const popup = document.createElement('div');
        popup.id = 'expense-detail-popup';
        popup.className = 'expense-popup';
        
        // 팝업 내용 생성
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3>${this.data.year}년 ${month + 1}월 지출 상세 내역</h3>
                    <button class="close-popup-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <ul class="nav nav-tabs mb-3" id="expenseDetailTabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="detail-tab" data-bs-toggle="tab" 
                                data-bs-target="#detail-content" type="button" role="tab" 
                                aria-controls="detail-content" aria-selected="true">상세 내역</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="summary-tab" data-bs-toggle="tab" 
                                data-bs-target="#summary-content" type="button" role="tab" 
                                aria-controls="summary-content" aria-selected="false">분류별 요약</button>
                        </li>
                    </ul>
                    <div class="tab-content" id="expenseDetailTabContent">
                        <div class="tab-pane active" id="detail-content" role="tabpanel" 
                             aria-labelledby="detail-tab">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>날짜</th>
                                            <th>분류</th>
                                            <th>설명</th>
                                            <th>금액</th>
                                            <th>유형</th>
                                        </tr>
                                    </thead>
                                    <tbody id="expense-detail-list"></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="tab-pane" id="summary-content" role="tabpanel" 
                             aria-labelledby="summary-tab">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0">대분류별 요약</h5>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>대분류</th>
                                                    <th>건수</th>
                                                    <th>금액</th>
                                                    <th>비율</th>
                                                </tr>
                                            </thead>
                                            <tbody id="main-category-summary"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">중분류별 요약</h5>
                                </div>
                                <div class="card-body">
                                    <div class="table-responsive">
                                        <table class="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>대분류</th>
                                                    <th>중분류</th>
                                                    <th>건수</th>
                                                    <th>금액</th>
                                                </tr>
                                            </thead>
                                            <tbody id="sub-category-summary"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 팝업을 body에 추가
        document.body.appendChild(popup);
        
        // 팝업 DOM 요소 참조
        const detailTab = popup.querySelector('#detail-tab');
        const summaryTab = popup.querySelector('#summary-tab');
        const detailContent = popup.querySelector('#detail-content');
        const summaryContent = popup.querySelector('#summary-content');
        const expenseDetailList = popup.querySelector('#expense-detail-list');
        const mainCategorySummary = popup.querySelector('#main-category-summary');
        const subCategorySummary = popup.querySelector('#sub-category-summary');
        
        // 팝업 닫기 버튼 이벤트
        const closeBtn = popup.querySelector('.close-popup-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                popup.remove();
            });
        }
        
        // ESC 키로 팝업 닫기
        const escKeyHandler = (e) => {
            if (e.key === 'Escape' && document.getElementById('expense-detail-popup')) {
                popup.remove();
                document.removeEventListener('keydown', escKeyHandler);
            }
        };
        document.addEventListener('keydown', escKeyHandler);
        
        // 팝업 외부 클릭 시 닫기
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                popup.remove();
                document.removeEventListener('keydown', escKeyHandler);
            }
        });
        
        // 탭 전환 이벤트 리스너
        if (detailTab && summaryTab && detailContent && summaryContent) {
            // 상세 내역 탭 클릭 이벤트
            detailTab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 탭 활성화 상태 변경
                popup.querySelectorAll('.nav-link').forEach(tab => tab.classList.remove('active'));
                this.classList.add('active');
                
                // 탭 컨텐츠 활성화 상태 변경
                popup.querySelectorAll('.tab-pane').forEach(content => content.classList.remove('active', 'show'));
                detailContent.classList.add('active', 'show');
            });
            
            // 분류별 요약 탭 클릭 이벤트
            summaryTab.addEventListener('click', function(e) {
                e.preventDefault();
                
                // 탭 활성화 상태 변경
                popup.querySelectorAll('.nav-link').forEach(tab => tab.classList.remove('active'));
                this.classList.add('active');
                
                // 탭 컨텐츠 활성화 상태 변경
                popup.querySelectorAll('.tab-pane').forEach(content => content.classList.remove('active', 'show'));
                summaryContent.classList.add('active', 'show');
            });
        }
        
        // 분류별 요약 데이터 준비
        const summarizedData = this.summarizeExpensesByCategory(expenses);
        
        // 상세 내역 표시
        this.renderExpenseDetails(expenseDetailList, expenses, summarizedData);
        
        // 대분류 요약 테이블 채우기
        if (mainCategorySummary) {
            mainCategorySummary.innerHTML = '';
            
            // 총 지출 금액 계산
            const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            
            // 대분류별 요약 정보 표시
            summarizedData.mainCategories.forEach(category => {
                const percentage = totalAmount > 0 ? (category.amount / totalAmount * 100).toFixed(1) : 0;
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${category.name || '미분류'}</td>
                    <td>${category.count}건</td>
                    <td class="text-end">${category.amount.toLocaleString()}원</td>
                    <td>${percentage}%</td>
                `;
                
                mainCategorySummary.appendChild(tr);
            });
        }
        
        // 중분류 요약 테이블 채우기
        if (subCategorySummary) {
            subCategorySummary.innerHTML = '';
            
            // 중분류별 요약 정보 표시
            summarizedData.subCategories.forEach(category => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${category.mainName || '미분류'}</td>
                    <td>${category.name || '미분류'}</td>
                    <td>${category.count}건</td>
                    <td class="text-end">${category.amount.toLocaleString()}원</td>
                `;
                
                subCategorySummary.appendChild(tr);
            });
        }
    },
    
    // 지출 상세 내역 렌더링 (별도 함수로 분리)
    renderExpenseDetails(detailList, expenses, summarizedData) {
        if (!detailList) {
            console.error('상세 내역 테이블 요소가 없습니다');
            return;
        }
        
        // 기존 내용 제거
        detailList.innerHTML = '';
        
        // 상세 내역 표시
        expenses.forEach(expense => {
            const tr = document.createElement('tr');
            
            // 날짜 정보 생성
            const day = expense.date.getDate();
            let dateInfo = `${day}일`;
            if (expense.isAdjusted && expense.originalDate) {
                const originalDay = expense.originalDate.getDate();
                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                const originalDayName = dayNames[expense.originalDate.getDay()];
                dateInfo += ` <small class="text-muted">(${originalDay}일 ${originalDayName}요일)</small>`;
            }
            
            // 분류 정보 생성
            let categoryInfo = '<span class="text-muted">미분류</span>';
            if (expense.mainCategoryName) {
                categoryInfo = expense.mainCategoryName;
                if (expense.subCategoryName) {
                    categoryInfo += ` <small class="text-muted">&gt; ${expense.subCategoryName}</small>`;
                }
            }
            
            tr.innerHTML = `
                <td>${dateInfo}</td>
                <td>${categoryInfo}</td>
                <td>${expense.description}</td>
                <td class="text-end">${expense.amount.toLocaleString()}원</td>
                <td><span class="badge ${expense.type === '반복' ? 'bg-primary' : 'bg-success'}">${expense.type}</span></td>
            `;
            
            detailList.appendChild(tr);
        });
        
        // 총액 계산
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // 팝업 엘리먼트 찾기
        const popup = document.getElementById('expense-detail-popup');
        
        // 대분류별 요약 표시
        const mainCategorySummary = document.getElementById('main-category-summary') || 
                                    popup?.querySelector('#summary-content .card:first-child tbody');
                                   
        if (mainCategorySummary) {
            mainCategorySummary.innerHTML = '';
            summarizedData.mainCategories.forEach(category => {
                const ratio = ((category.amount / totalAmount) * 100).toFixed(1);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${category.name}</td>
                    <td class="text-center">${category.count}건</td>
                    <td class="text-end">${category.amount.toLocaleString()}원</td>
                    <td class="text-center">${ratio}%</td>
                `;
                mainCategorySummary.appendChild(tr);
            });
        }
        
        // 중분류별 요약 표시
        const subCategorySummary = document.getElementById('sub-category-summary') || 
                                   popup?.querySelector('#summary-content .card:last-child tbody');
                                  
        if (subCategorySummary) {
            subCategorySummary.innerHTML = '';
            summarizedData.subCategories.forEach(category => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${category.mainName}</td>
                    <td>${category.name}</td>
                    <td class="text-center">${category.count}건</td>
                    <td class="text-end">${category.amount.toLocaleString()}원</td>
                `;
                subCategorySummary.appendChild(tr);
            });
        }
    },

    // 데이터 초기화 기능
    resetData() {
        // 패스워드 확인
        const password = prompt("데이터 초기화를 위한 패스워드를 입력하세요:");
        
        if (password === "230218") {
            // 최종 확인
            const confirmReset = confirm("정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
            
            if (confirmReset) {
                // 현재 년도
                const currentYear = new Date().getFullYear().toString();
                
                // 데이터 초기화
                this.data = {
                    recurringExpenses: [],
                    oneTimeExpenses: [],
                    year: new Date().getFullYear(),
                    holidays: {},
                    categories: {
                        main: [
                            { code: 'LIVING', name: '생활비' },
                            { code: 'FINANCE', name: '금융' },
                            { code: 'LEISURE', name: '여가' },
                            { code: 'ETC', name: '기타' }
                        ],
                        sub: [
                            { mainCode: 'LIVING', code: 'FOOD', name: '식비' },
                            { mainCode: 'LIVING', code: 'HOUSE', name: '주거/관리비' },
                            { mainCode: 'LIVING', code: 'UTIL', name: '공과금' },
                            { mainCode: 'FINANCE', code: 'INSUR', name: '보험' },
                            { mainCode: 'FINANCE', code: 'SAVING', name: '저축' },
                            { mainCode: 'FINANCE', code: 'INVEST', name: '투자' },
                            { mainCode: 'LEISURE', code: 'HOBBY', name: '취미' },
                            { mainCode: 'LEISURE', code: 'TRIP', name: '여행' },
                            { mainCode: 'ETC', code: 'OTHER', name: '기타' }
                        ]
                    }
                };
                
                // 기본 공휴일 설정
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
                
                // UI 업데이트
                document.getElementById('year').value = this.data.year;
                document.getElementById('calendar-year').textContent = this.data.year;
                
                // 데이터 저장 및 UI 업데이트
                this.saveData();
                this.renderRecurringExpenses();
                this.renderCalendar();
                this.updateSummary();
                this.updateHolidayYearOptions();
                this.renderHolidays(currentYear);
                this.renderMainCategories();
                this.renderSubCategories();
                this.updateSubCategoryMainSelect();
                this.updateCategorySelects();
                
                alert("모든 데이터가 초기화되었습니다.");
            }
        } else {
            alert("패스워드가 일치하지 않습니다.");
        }
    },

    // 분류 관리 섹션 설정
    setupCategorySection() {
        // 분류 관리 UI 요소 생성
        const container = document.querySelector('.container');
        
        const categorySection = document.createElement('div');
        categorySection.className = 'section-container category-section';
        categorySection.innerHTML = `
            <div class="section-header">
                <h2>지출 분류 관리</h2>
                <button class="toggle-btn">▶</button>
            </div>
            <div class="section-content hidden">
                <div class="category-tabs">
                    <button class="tab-btn active" data-tab="main">대분류</button>
                    <button class="tab-btn" data-tab="sub">중분류</button>
                </div>
                
                <div class="tab-content" id="main-category-tab">
                    <div class="category-input-group">
                        <div class="category-form">
                            <div class="form-row">
                                <label for="main-category-code">분류 코드:</label>
                                <input type="text" id="main-category-code" placeholder="분류 코드 (예: LIVING)" maxlength="10">
                            </div>
                            <div class="form-row">
                                <label for="main-category-name">분류명:</label>
                                <input type="text" id="main-category-name" placeholder="분류명 (예: 생활비)">
                            </div>
                            <button id="add-main-category-btn" class="add-btn">추가</button>
                        </div>
                    </div>
                    <div class="category-list-container">
                        <h3>등록된 대분류</h3>
                        <div class="category-list" id="main-category-list"></div>
                    </div>
                </div>
                
                <div class="tab-content hidden" id="sub-category-tab">
                    <div class="category-input-group">
                        <div class="category-form">
                            <div class="form-row">
                                <label for="sub-category-main">대분류:</label>
                                <select id="sub-category-main"></select>
                            </div>
                            <div class="form-row">
                                <label for="sub-category-code">분류 코드:</label>
                                <input type="text" id="sub-category-code" placeholder="분류 코드 (예: FOOD)" maxlength="10">
                            </div>
                            <div class="form-row">
                                <label for="sub-category-name">분류명:</label>
                                <input type="text" id="sub-category-name" placeholder="분류명 (예: 식비)">
                            </div>
                            <button id="add-sub-category-btn" class="add-btn">추가</button>
                        </div>
                    </div>
                    <div class="category-list-container">
                        <h3>등록된 중분류</h3>
                        <div class="category-list" id="sub-category-list"></div>
                    </div>
                </div>
            </div>
        `;
        
        // 분류 관리 섹션 추가 (공휴일 섹션 바로 위에)
        const holidaySection = document.querySelector('.holiday-section');
        if (holidaySection) {
            container.insertBefore(categorySection, holidaySection);
        } else {
            container.appendChild(categorySection);
        }
        
        // 탭 전환 이벤트 리스너
        const tabButtons = categorySection.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 탭 버튼 활성화 상태 전환
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 탭 내용 전환
                const tabName = btn.dataset.tab;
                const tabContents = categorySection.querySelectorAll('.tab-content');
                tabContents.forEach(content => content.classList.add('hidden'));
                document.getElementById(`${tabName}-category-tab`).classList.remove('hidden');
                
                // 현재 탭에 맞는 분류 목록 렌더링
                if (tabName === 'main') {
                    this.renderMainCategories();
                } else {
                    this.renderSubCategories();
                    this.updateSubCategoryMainSelect();
                }
            });
        });
        
        // 대분류 추가 버튼 이벤트
        document.getElementById('add-main-category-btn').addEventListener('click', () => {
            const code = document.getElementById('main-category-code').value.trim().toUpperCase();
            const name = document.getElementById('main-category-name').value.trim();
            
            if (code && name) {
                this.addMainCategory(code, name);
            } else {
                alert('분류 코드와 분류명을 모두 입력해주세요.');
            }
        });
        
        // 중분류 추가 버튼 이벤트
        document.getElementById('add-sub-category-btn').addEventListener('click', () => {
            const mainCode = document.getElementById('sub-category-main').value;
            const code = document.getElementById('sub-category-code').value.trim().toUpperCase();
            const name = document.getElementById('sub-category-name').value.trim();
            
            if (mainCode && code && name) {
                this.addSubCategory(mainCode, code, name);
            } else {
                alert('대분류, 분류 코드, 분류명을 모두 입력해주세요.');
            }
        });
        
        // 초기 분류 목록 렌더링
        this.renderMainCategories();
        this.updateSubCategoryMainSelect();
    },
    
    // 대분류 목록 렌더링
    renderMainCategories() {
        const list = document.getElementById('main-category-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (this.data.categories.main.length === 0) {
            list.innerHTML = '<p class="text-center text-muted py-3">등록된 대분류가 없습니다.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'table table-hover';
        
        // 테이블 헤더
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="width: 30%">코드</th>
                <th style="width: 50%">이름</th>
                <th style="width: 20%">관리</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // 테이블 바디
        const tbody = document.createElement('tbody');
        
        this.data.categories.main.forEach((category, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${category.code}</td>
                <td>${category.name}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-main-category-btn" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        list.appendChild(table);
        
        // 삭제 버튼 이벤트 리스너
        const deleteButtons = list.querySelectorAll('.delete-main-category-btn');
        deleteButtons.forEach(btn => {
            // 기존 이벤트 리스너 제거
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // 새 이벤트 리스너 추가
            newBtn.addEventListener('click', (e) => {
                const index = parseInt(newBtn.getAttribute('data-index'));
                this.removeMainCategory(index);
            });
        });
        
        // 입력 필드 초기화
        document.getElementById('main-category-code').value = '';
        document.getElementById('main-category-name').value = '';
    },
    
    // 중분류 목록 렌더링
    renderSubCategories() {
        const list = document.getElementById('sub-category-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (this.data.categories.sub.length === 0) {
            list.innerHTML = '<p class="text-center text-muted py-3">등록된 중분류가 없습니다.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'table table-hover';
        
        // 테이블 헤더
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="width: 30%">대분류</th>
                <th style="width: 20%">코드</th>
                <th style="width: 30%">이름</th>
                <th style="width: 20%">관리</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // 테이블 바디
        const tbody = document.createElement('tbody');
        
        this.data.categories.sub.forEach((category, index) => {
            // 대분류 이름 찾기
            const mainCategory = this.data.categories.main.find(c => c.code === category.mainCode);
            const mainName = mainCategory ? mainCategory.name : '(없음)';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${mainName}</td>
                <td>${category.code}</td>
                <td>${category.name}</td>
                <td>
                    <button class="btn btn-sm btn-danger delete-sub-category-btn" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        list.appendChild(table);
        
        // 삭제 버튼 이벤트 리스너
        const deleteButtons = list.querySelectorAll('.delete-sub-category-btn');
        deleteButtons.forEach(btn => {
            // 기존 이벤트 리스너 제거
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // 새 이벤트 리스너 추가
            newBtn.addEventListener('click', (e) => {
                const index = parseInt(newBtn.getAttribute('data-index'));
                this.removeSubCategory(index);
            });
        });
        
        // 입력 필드 초기화
        document.getElementById('sub-category-code').value = '';
        document.getElementById('sub-category-name').value = '';
    },
    
    // 중분류 선택시 사용할 대분류 선택 드롭다운 업데이트
    updateSubCategoryMainSelect() {
        const select = document.getElementById('sub-category-main');
        select.innerHTML = '';
        
        if (this.data.categories.main.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '대분류를 먼저 추가해주세요';
            select.appendChild(option);
            return;
        }
        
        this.data.categories.main.forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            option.textContent = `${category.name} (${category.code})`;
            select.appendChild(option);
        });
    },
    
    // 지출 입력 폼에 사용할 대분류/중분류 선택 드롭다운 업데이트
    updateCategorySelects() {
        // 대분류 선택 드롭다운 업데이트
        const mainSelects = document.querySelectorAll('.main-category-select');
        mainSelects.forEach(select => {
            select.innerHTML = '<option value="">선택해주세요</option>';
            
            this.data.categories.main.forEach(category => {
                const option = document.createElement('option');
                option.value = category.code;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
        
        // 대분류 선택 이벤트 업데이트
        mainSelects.forEach(mainSelect => {
            mainSelect.addEventListener('change', () => {
                const mainCode = mainSelect.value;
                const subSelect = mainSelect.closest('.category-selects').querySelector('.sub-category-select');
                
                // 중분류 드롭다운 초기화
                subSelect.innerHTML = '<option value="">선택해주세요</option>';
                
                // 대분류가 선택되었을 경우에만 중분류 목록 표시
                if (mainCode) {
                    // 선택된 대분류에 속한 중분류만 필터링
                    const filteredSubs = this.data.categories.sub.filter(sub => sub.mainCode === mainCode);
                    
                    filteredSubs.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.code;
                        option.textContent = sub.name;
                        subSelect.appendChild(option);
                    });
                }
            });
        });
    },
    
    // 대분류 추가
    addMainCategory(code, name) {
        // 중복 코드 검사
        if (this.data.categories.main.some(c => c.code === code)) {
            alert(`이미 사용 중인 대분류 코드입니다: ${code}`);
            return;
        }
        
        // 대분류 추가
        this.data.categories.main.push({ code, name });
        
        // 저장 및 UI 업데이트
        this.saveData();
        this.renderMainCategories();
        this.updateSubCategoryMainSelect();
        this.updateCategorySelects();
    },
    
    // 중분류 추가
    addSubCategory(mainCode, code, name) {
        // 중복 코드 검사
        if (this.data.categories.sub.some(c => c.code === code)) {
            alert(`이미 사용 중인 중분류 코드입니다: ${code}`);
            return;
        }
        
        // 중분류 추가
        this.data.categories.sub.push({ mainCode, code, name });
        
        // 저장 및 UI 업데이트
        this.saveData();
        this.renderSubCategories();
        this.updateCategorySelects();
    },
    
    // 대분류 삭제
    removeMainCategory(index) {
        const category = this.data.categories.main[index];
        
        // 해당 대분류를 사용하는 중분류 확인
        const hasSubCategories = this.data.categories.sub.some(sub => sub.mainCode === category.code);
        
        if (hasSubCategories) {
            alert(`이 대분류를 사용하는 중분류가 있어 삭제할 수 없습니다: ${category.name}`);
            return;
        }
        
        // 해당 대분류를 사용하는 지출 항목 확인
        const hasRecurringExpenses = this.data.recurringExpenses.some(exp => exp.mainCategory === category.code);
        const hasOneTimeExpenses = this.data.oneTimeExpenses.some(exp => exp.mainCategory === category.code);
        
        if (hasRecurringExpenses || hasOneTimeExpenses) {
            alert(`이 대분류를 사용하는 지출 항목이 있어 삭제할 수 없습니다: ${category.name}`);
            return;
        }
        
        // 삭제 확인
        if (confirm(`정말로 '${category.name}' 대분류를 삭제하시겠습니까?`)) {
            this.data.categories.main.splice(index, 1);
            this.saveData();
            this.renderMainCategories();
            this.updateSubCategoryMainSelect();
            this.updateCategorySelects();
        }
    },
    
    // 중분류 삭제
    removeSubCategory(index) {
        const category = this.data.categories.sub[index];
        
        if (confirm(`정말로 '${category.name}' 중분류를 삭제하시겠습니까?`)) {
            this.data.categories.sub.splice(index, 1);
            this.saveData();
            this.renderSubCategories();
            this.updateCategorySelects();
        }
    },

    // 섹션 구성하기
    setupSections() {
        const container = document.querySelector('.container');
        container.innerHTML = ''; // 기존 내용 비우기
        
        // 제목 추가
        const title = document.createElement('h1');
        title.textContent = '연간 지출 계산기';
        container.appendChild(title);
        
        // CSS 스타일 추가
        this.addCustomStyles();
        
        // 1. 연간 지출 일정표 섹션 생성 (기본으로 펼쳐져 있음)
        const calendarSection = document.createElement('div');
        calendarSection.className = 'section-container calendar-section';
        calendarSection.innerHTML = `
            <div class="section-header">
                <h2>연간 지출 일정표</h2>
                <button class="toggle-btn expanded">▼</button>
            </div>
            <div class="section-content calendar-view">
                <div class="year-navigation">
                    <button id="prev-year">이전 년도</button>
                    <span id="calendar-year">${this.data.year}</span>
                    <button id="next-year">다음 년도</button>
                </div>
                <div id="expense-calendar"></div>
            </div>
        `;
        container.appendChild(calendarSection);
        
        // 2. 지출 요약 섹션 생성 (기본으로 펼쳐져 있음)
        const summarySection = document.createElement('div');
        summarySection.className = 'section-container summary-section';
        summarySection.innerHTML = `
            <div class="section-header">
                <h2>지출 요약</h2>
                <button class="toggle-btn expanded">▼</button>
            </div>
            <div class="section-content">
                <div class="total">연간 총 지출: <span id="total-expense">0</span>원</div>
                <div class="monthly-average">월 평균 지출: <span id="monthly-average">0</span>원</div>
            </div>
        `;
        container.appendChild(summarySection);
        
        // 3. 반복 지출 설정 섹션 생성 (기본으로 접혀 있음)
        const setupSection = document.createElement('div');
        setupSection.className = 'section-container setup-section';
        setupSection.innerHTML = `
            <div class="section-header">
                <h2>반복 지출 설정</h2>
                <button class="toggle-btn">▶</button>
            </div>
            <div class="section-content hidden">
                <div class="input-group">
                    <label for="year">년도:</label>
                    <input type="number" id="year" value="${this.data.year}" min="2000" max="2100">
                </div>
                <div class="input-group">
                    <label for="recurring-start-date">시작 년월:</label>
                    <input type="month" id="recurring-start-date">
                </div>
                <div class="input-group">
                    <label for="recurring-end-date">종료 년월 (선택):</label>
                    <input type="month" id="recurring-end-date">
                </div>
                <div class="input-group">
                    <label for="day">매월 지출일:</label>
                    <input type="number" id="day" value="25" min="1" max="31">
                </div>
                <div class="input-group">
                    <label for="amount">금액:</label>
                    <input type="number" id="amount" placeholder="금액 입력">
                </div>
                <div class="input-group">
                    <label for="description">설명:</label>
                    <input type="text" id="description" placeholder="설명 입력">
                </div>
                <div class="input-group">
                    <label>분류:</label>
                    <div class="category-selects">
                        <select class="main-category-select" id="recurring-main-category">
                            <option value="">대분류 선택</option>
                        </select>
                        <select class="sub-category-select" id="recurring-sub-category">
                            <option value="">중분류 선택</option>
                        </select>
                    </div>
                </div>
                <button id="add-recurring">추가하기</button>
            </div>
        `;
        container.appendChild(setupSection);
        
        // 4. 설정된 반복 지출 섹션 생성 (기본으로 접혀 있음)
        const recurringExpensesSection = document.createElement('div');
        recurringExpensesSection.className = 'section-container recurring-expenses-section';
        recurringExpensesSection.innerHTML = `
            <div class="section-header">
                <h2>설정된 반복 지출</h2>
                <button class="toggle-btn">▶</button>
            </div>
            <div class="section-content hidden">
                <ul id="recurring-list"></ul>
            </div>
        `;
        container.appendChild(recurringExpensesSection);
        
        // 5. 일회성 지출 추가 섹션 생성 (기본으로 접혀 있음)
        const oneTimeSection = document.createElement('div');
        oneTimeSection.className = 'section-container one-time-section';
        oneTimeSection.innerHTML = `
            <div class="section-header">
                <h2>일회성 지출 추가</h2>
                <button class="toggle-btn">▶</button>
            </div>
            <div class="section-content hidden">
                <div class="input-group">
                    <label for="one-time-date">날짜:</label>
                    <input type="date" id="one-time-date">
                </div>
                <div class="input-group">
                    <label for="one-time-amount">금액:</label>
                    <input type="number" id="one-time-amount" placeholder="금액 입력">
                </div>
                <div class="input-group">
                    <label for="one-time-description">설명:</label>
                    <input type="text" id="one-time-description" placeholder="설명 입력">
                </div>
                <div class="input-group">
                    <label>분류:</label>
                    <div class="category-selects">
                        <select class="main-category-select" id="one-time-main-category">
                            <option value="">대분류 선택</option>
                        </select>
                        <select class="sub-category-select" id="one-time-sub-category">
                            <option value="">중분류 선택</option>
                        </select>
                    </div>
                </div>
                <button id="add-one-time">추가하기</button>
            </div>
        `;
        container.appendChild(oneTimeSection);
        
        // 분류 관리 섹션 설정
        this.setupCategorySection();
        
        // 공휴일 관리 섹션과 백업 섹션 설정
        this.setupHolidaySection();
        this.setupBackupButtons();
        
        // 아코디언 기능 설정
        this.setupAccordion();
        
        // 분류 선택 드롭다운 업데이트
        this.updateCategorySelects();
    },
    
    // 이벤트 리스너 설정
    setupEventListeners() {
        // 반복 지출 추가 버튼
        document.getElementById('add-recurring').addEventListener('click', () => {
            const day = document.getElementById('day').value;
            const amount = document.getElementById('amount').value;
            const description = document.getElementById('description').value;
            const startDate = document.getElementById('recurring-start-date').value;
            const endDate = document.getElementById('recurring-end-date').value || null;
            const mainCategory = document.getElementById('recurring-main-category').value;
            const subCategory = document.getElementById('recurring-sub-category').value;
            
            if (day && amount && description && startDate) {
                this.addRecurringExpense(day, amount, description, startDate, endDate, mainCategory, subCategory);
                
                // 입력 필드 초기화
                document.getElementById('amount').value = '';
                document.getElementById('description').value = '';
                document.getElementById('recurring-main-category').value = '';
                document.getElementById('recurring-sub-category').innerHTML = '<option value="">중분류 선택</option>';
            } else {
                alert('필수 항목을 모두 입력해주세요 (지출일, 금액, 설명, 시작 년월)');
            }
        });
        
        // 분류관리 탭 - 대분류 추가 버튼
        const addMainCategoryBtn = document.getElementById('add-main-category-btn');
        if (addMainCategoryBtn) {
            addMainCategoryBtn.addEventListener('click', () => {
                const code = document.getElementById('main-category-code').value.trim().toUpperCase();
                const name = document.getElementById('main-category-name').value.trim();
                
                if (code && name) {
                    this.addMainCategory(code, name);
                } else {
                    alert('분류 코드와 분류명을 모두 입력해주세요.');
                }
            });
        }
        
        // 분류관리 탭 - 중분류 추가 버튼
        const addSubCategoryBtn = document.getElementById('add-sub-category-btn');
        if (addSubCategoryBtn) {
            addSubCategoryBtn.addEventListener('click', () => {
                const mainCode = document.getElementById('sub-category-main').value;
                const code = document.getElementById('sub-category-code').value.trim().toUpperCase();
                const name = document.getElementById('sub-category-name').value.trim();
                
                if (mainCode && code && name) {
                    this.addSubCategory(mainCode, code, name);
                } else {
                    alert('대분류, 분류 코드, 분류명을 모두 입력해주세요.');
                }
            });
        }
        
        // 일회성 지출 추가 버튼
        document.getElementById('add-one-time').addEventListener('click', () => {
            const date = document.getElementById('one-time-date').value;
            const amount = document.getElementById('one-time-amount').value;
            const description = document.getElementById('one-time-description').value;
            const mainCategory = document.getElementById('one-time-main-category').value;
            const subCategory = document.getElementById('one-time-sub-category').value;
            
            if (date && amount && description) {
                this.addOneTimeExpense(date, amount, description, mainCategory, subCategory);
                
                // 입력 필드 초기화
                document.getElementById('one-time-amount').value = '';
                document.getElementById('one-time-description').value = '';
                document.getElementById('one-time-main-category').value = '';
                document.getElementById('one-time-sub-category').innerHTML = '<option value="">중분류 선택</option>';
            } else {
                alert('날짜, 금액, 설명을 모두 입력해주세요.');
            }
        });
        
        // 년도 변경 처리
        document.getElementById('year').addEventListener('change', (e) => {
            this.changeYear(e.target.value);
        });
        
        // 이전/다음 년도 버튼
        document.getElementById('prev-year').addEventListener('click', () => {
            this.changeYear(this.data.year - 1);
        });
        
        document.getElementById('next-year').addEventListener('click', () => {
            this.changeYear(this.data.year + 1);
        });

        // 공휴일 추가 버튼 이벤트 리스너
        document.getElementById('add-holiday-btn').addEventListener('click', () => {
            const year = document.getElementById('holiday-year').value;
            const month = parseInt(document.getElementById('holiday-month').value);
            const day = parseInt(document.getElementById('holiday-day').value);
            const name = document.getElementById('holiday-name').value.trim();
            
            if (year && month && day && name) {
                this.addHoliday(year, month, day, name);
            } else {
                alert("모든 필드를 입력해주세요.");
            }
        });
        
        // 공공데이터 API에서 공휴일 가져오기 버튼 이벤트 리스너
        document.getElementById('fetch-holidays-btn').addEventListener('click', () => {
            const year = document.getElementById('holiday-year').value;
            this.fetchHolidaysFromAPI(year);
        });

        // 년도 선택 이벤트 리스너
        document.getElementById('holiday-year').addEventListener('change', (e) => {
            this.renderHolidays(e.target.value);
        });
        
        // 새 년도 추가 버튼 이벤트 리스너
        document.getElementById('add-holiday-year-btn').addEventListener('click', () => {
            const newYear = prompt("추가할 년도를 입력하세요 (예: 2025):");
            if (newYear && /^\d{4}$/.test(newYear)) {
                if (!this.data.holidays[newYear]) {
                    this.data.holidays[newYear] = [];
                    this.saveData();
                    this.updateHolidayYearOptions();
                    document.getElementById('holiday-year').value = newYear;
                    this.renderHolidays(newYear);
                } else {
                    alert("해당 년도는 이미 존재합니다.");
                }
            } else if (newYear) {
                alert("유효한 년도 형식이 아닙니다. (예: 2025)");
            }
        });

        // 백업 버튼 이벤트 리스너
        document.getElementById('backup-btn').addEventListener('click', () => {
            this.backupData();
        });
        
        // 엑셀 내보내기 버튼 이벤트 리스너
        document.getElementById('excel-btn').addEventListener('click', () => {
            this.exportToExcel();
        });
        
        // 초기화 버튼 이벤트 리스너
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetData();
        });
        
        // 복원 파일 선택 이벤트 리스너
        document.getElementById('restore-file').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const confirmRestore = confirm('기존 데이터를 백업 파일의 데이터로 대체합니다. 계속하시겠습니까?');
                if (confirmRestore) {
                    this.restoreData(e.target.files[0]);
                }
            }
        });

        // Bootstrap 탭 이벤트 리스너 추가
        const categoryTabs = document.querySelectorAll('[data-bs-toggle="tab"]');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                
                // 모든 탭과 탭 컨텐츠 비활성화
                document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(c => {
                    c.classList.remove('show', 'active');
                });
                
                // 클릭한 탭 활성화
                tab.classList.add('active');
                
                // 해당 컨텐츠 활성화
                const target = document.querySelector(tab.dataset.bsTarget);
                if (target) {
                    target.classList.add('show', 'active');
                }
                
                // 탭에 따라 적절한 카테고리 렌더링
                if (tab.dataset.bsTarget === '#main-category') {
                    this.renderMainCategories();
                } else if (tab.dataset.bsTarget === '#sub-category') {
                    this.renderSubCategories();
                    this.updateSubCategoryMainSelect();
                }
            });
        });
    },

    // 백업/복원 버튼 설정
    setupBackupButtons() {
        // 백업/복원 UI 요소 생성
        const container = document.querySelector('.container');
        
        const backupSection = document.createElement('div');
        backupSection.className = 'section-container backup-section';
        backupSection.innerHTML = `
            <div class="section-header">
                <h2>데이터 백업 및 내보내기</h2>
                <button class="toggle-btn">▶</button>
            </div>
            <div class="section-content hidden">
                <div class="backup-buttons">
                    <button id="backup-btn">데이터 백업</button>
                    <button id="excel-btn">엑셀로 내보내기</button>
                    <button id="reset-btn" class="danger-btn">데이터 초기화</button>
                    <div class="restore-container">
                        <label for="restore-file" class="restore-label">데이터 복원:</label>
                        <input type="file" id="restore-file" accept=".json">
                    </div>
                </div>
                <p class="backup-info">* 백업은 JSON 파일로 다운로드됩니다. 복원 시에는 백업 파일을 선택하세요. 엑셀 내보내기는 현재 화면에 표시된 지출 일정을 그대로 CSV 파일로 저장합니다. 초기화는 모든 데이터를 삭제합니다.</p>
            </div>
        `;
        
        // 백업 섹션 추가
        container.appendChild(backupSection);
        
        // 백업 버튼 이벤트 리스너
        document.getElementById('backup-btn').addEventListener('click', () => {
            this.backupData();
        });
        
        // 엑셀 내보내기 버튼 이벤트 리스너
        document.getElementById('excel-btn').addEventListener('click', () => {
            this.exportToExcel();
        });
        
        // 초기화 버튼 이벤트 리스너
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetData();
        });
        
        // 복원 파일 선택 이벤트 리스너
        document.getElementById('restore-file').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const confirmRestore = confirm('기존 데이터를 백업 파일의 데이터로 대체합니다. 계속하시겠습니까?');
                if (confirmRestore) {
                    this.restoreData(e.target.files[0]);
                }
            }
        });
    },

    // 공휴일 관리 섹션 설정
    setupHolidaySection() {
        // 공휴일 관리 UI 요소 생성
        const container = document.querySelector('.container');
        
        const holidaySection = document.createElement('div');
        holidaySection.className = 'section-container holiday-section';
        holidaySection.innerHTML = `
            <div class="section-header">
                <h2>공휴일 관리</h2>
                <button class="toggle-btn">▶</button>
            </div>
            <div class="section-content hidden">
                <div class="holiday-year-selector">
                    <label for="holiday-year">년도 선택:</label>
                    <select id="holiday-year">
                        ${this.generateYearOptions()}
                    </select>
                    <button id="add-holiday-year-btn">새 년도 추가</button>
                    <button id="fetch-holidays-btn">공공데이터 가져오기</button>
                </div>
                <div class="holiday-input-group">
                    <div class="input-row">
                        <input type="number" id="holiday-month" placeholder="월" min="1" max="12">
                        <input type="number" id="holiday-day" placeholder="일" min="1" max="31">
                        <input type="text" id="holiday-name" placeholder="공휴일 이름">
                        <button id="add-holiday-btn">추가</button>
                    </div>
                </div>
                <div class="holiday-list-container">
                    <h3>등록된 공휴일</h3>
                    <div id="holiday-list"></div>
                </div>
            </div>
        `;
        
        // 공휴일 섹션 추가
        container.appendChild(holidaySection);
        
        // 년도 선택 이벤트 리스너
        document.getElementById('holiday-year').addEventListener('change', (e) => {
            this.renderHolidays(e.target.value);
        });
        
        // 새 년도 추가 버튼 이벤트 리스너
        document.getElementById('add-holiday-year-btn').addEventListener('click', () => {
            const newYear = prompt("추가할 년도를 입력하세요 (예: 2025):");
            if (newYear && /^\d{4}$/.test(newYear)) {
                if (!this.data.holidays[newYear]) {
                    this.data.holidays[newYear] = [];
                    this.saveData();
                    this.updateHolidayYearOptions();
                    document.getElementById('holiday-year').value = newYear;
                    this.renderHolidays(newYear);
                } else {
                    alert("해당 년도는 이미 존재합니다.");
                }
            } else if (newYear) {
                alert("유효한 년도 형식이 아닙니다. (예: 2025)");
            }
        });
        
        // 공휴일 추가 버튼 이벤트 리스너
        document.getElementById('add-holiday-btn').addEventListener('click', () => {
            const year = document.getElementById('holiday-year').value;
            const month = parseInt(document.getElementById('holiday-month').value);
            const day = parseInt(document.getElementById('holiday-day').value);
            const name = document.getElementById('holiday-name').value.trim();
            
            if (year && month && day && name) {
                this.addHoliday(year, month, day, name);
            } else {
                alert("모든 필드를 입력해주세요.");
            }
        });
        
        // 공공데이터 API에서 공휴일 가져오기 버튼 이벤트 리스너
        document.getElementById('fetch-holidays-btn').addEventListener('click', () => {
            const year = document.getElementById('holiday-year').value;
            this.fetchHolidaysFromAPI(year);
        });
        
        // 현재 년도의 공휴일 목록 렌더링
        this.renderHolidays(this.data.year.toString());
    },
    
    // 년도 옵션 생성
    generateYearOptions() {
        let options = '';
        const years = Object.keys(this.data.holidays).sort();
        
        if (years.length === 0) {
            const currentYear = this.data.year.toString();
            options = `<option value="${currentYear}">${currentYear}년</option>`;
        } else {
            years.forEach(year => {
                options += `<option value="${year}">${year}년</option>`;
            });
        }
        
        return options;
    },
    
    // 년도 옵션 업데이트
    updateHolidayYearOptions() {
        const select = document.getElementById('holiday-year');
        select.innerHTML = this.generateYearOptions();
    },
    
    // 공휴일 추가
    addHoliday(year, month, day, name) {
        // 유효한 날짜인지 확인
        const date = new Date(parseInt(year), month - 1, day);
        if (date.getMonth() !== month - 1 || date.getDate() !== day) {
            alert("유효하지 않은 날짜입니다.");
            return;
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
            alert("해당 날짜에 이미 공휴일이 등록되어 있습니다.");
            return;
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
        
        // 저장 및 UI 업데이트
        this.saveData();
        this.renderHolidays(year);
        this.renderCalendar(); // 달력 업데이트
        
        // 입력 필드 초기화
        document.getElementById('holiday-month').value = '';
        document.getElementById('holiday-day').value = '';
        document.getElementById('holiday-name').value = '';
    },
    
    // 공휴일 삭제
    removeHoliday(year, index) {
        this.data.holidays[year].splice(index, 1);
        this.saveData();
        this.renderHolidays(year);
        this.renderCalendar(); // 달력 업데이트
    },
    
    // 공휴일 목록 렌더링
    renderHolidays(year) {
        const list = document.getElementById('holiday-list');
        list.innerHTML = '';
        
        if (!this.data.holidays[year] || this.data.holidays[year].length === 0) {
            list.innerHTML = '<p class="no-holiday">등록된 공휴일이 없습니다.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'holiday-table';
        
        // 테이블 헤더
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>날짜</th>
                <th>이름</th>
                <th>관리</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // 테이블 바디
        const tbody = document.createElement('tbody');
        
        this.data.holidays[year].forEach((holiday, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${holiday.month}월 ${holiday.day}일</td>
                <td>${holiday.name}</td>
                <td><button class="delete-holiday-btn" data-index="${index}">삭제</button></td>
            `;
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        list.appendChild(table);
        
        // 삭제 버튼 이벤트 리스너
        const deleteButtons = document.querySelectorAll('.delete-holiday-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                this.removeHoliday(year, index);
            });
        });
    },
    
    // 기본 공휴일 추가 (API 호출 실패 시 대안)
    addDefaultHolidays(year) {
        const yearInt = parseInt(year);
        const defaultHolidays = [
            { month: 1, day: 1, name: '신정' },
            { month: 3, day: 1, name: '삼일절' },
            { month: 5, day: 5, name: '어린이날' },
            { month: 6, day: 6, name: '현충일' },
            { month: 8, day: 15, name: '광복절' },
            { month: 10, day: 3, name: '개천절' },
            { month: 10, day: 9, name: '한글날' },
            { month: 12, day: 25, name: '크리스마스' }
        ];
        
        // 설날(음력 1월 1일)과 추석(음력 8월 15일)은 년도별로 달라지므로 포함하지 않음
        // 실제 구현에서는 음력 변환 로직이 필요함
        
        // 기존 공휴일 백업
        const existingHolidays = this.data.holidays[year] || [];
        
        // 새 공휴일 목록 생성 (중복 제거)
        const newHolidays = defaultHolidays.filter(newHol => 
            !existingHolidays.some(existHol => 
                existHol.month === newHol.month && existHol.day === newHol.day
            )
        );
        
        // 공휴일 추가 및 정렬
        if (newHolidays.length > 0) {
            if (!this.data.holidays[year]) {
                this.data.holidays[year] = [];
            }
            
            this.data.holidays[year] = [
                ...existingHolidays,
                ...newHolidays
            ].sort((a, b) => {
                if (a.month === b.month) {
                    return a.day - b.day;
                }
                return a.month - b.month;
            });
            
            this.saveData();
            this.renderHolidays(year);
            this.renderCalendar();
            
            alert(`${newHolidays.length}개의 기본 공휴일이 추가되었습니다.`);
        } else {
            alert('추가할 새 공휴일이 없습니다.');
        }
    },
    
    // 아코디언 기능 설정
    setupAccordion() {
        const toggleButtons = document.querySelectorAll('.toggle-btn');
        
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 토글 버튼 상태 변경
                const isExpanded = btn.classList.contains('expanded');
                
                if (isExpanded) {
                    btn.classList.remove('expanded');
                    btn.textContent = '▶';
                } else {
                    btn.classList.add('expanded');
                    btn.textContent = '▼';
                }
                
                // 내용 표시/숨김 토글
                const contentEl = btn.closest('.section-container').querySelector('.section-content');
                contentEl.classList.toggle('hidden');
            });
        });
    },

    // 공공데이터 API에서 공휴일 데이터 가져오기
    fetchHolidaysFromAPI(year) {
        const apiKey = "FtHeLbjpVuh3T%2Ff1ni81E0sVXqCBABBj5nC11MV591pdnc5gzHS7PGeRNQTJT5nezvJ5UE5cAiQ4Opfb94CZ0A%3D%3D";
        const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${apiKey}&solYear=${year}&numOfRows=100&_type=json`;
        
        // 로딩 표시
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-message';
        loadingEl.textContent = '공휴일 데이터를 가져오는 중...';
        document.getElementById('holiday-list').innerHTML = '';
        document.getElementById('holiday-list').appendChild(loadingEl);
        
        // 주의: 공공데이터포털 API는 CORS 제한이 있어 클라이언트에서 직접 호출하기 어려움
        // 아래 코드는 CORS 프록시를 사용하여 우회하지만, 프록시 서비스가 작동하지 않을 수 있음
        // 프로덕션 환경에서는 서버를 통한 프록시나 CORS 허용된 API를 사용해야 함
        try {
            // CORS 이슈로 인해 직접 fetch는 작동하지 않을 수 있어 프록시 서비스 사용
            // 다양한 공개 CORS 프록시 서비스 중 하나를 선택
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            
            fetch(proxyUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('공휴일 데이터를 가져오는데 실패했습니다.');
                    }
                    return response.json();
                })
                .then(data => {
                    // allorigins 프록시는 응답을 contents 속성에 문자열로 담아 반환
                    const apiResponse = JSON.parse(data.contents);
                    
                    if (apiResponse.response && 
                        apiResponse.response.header.resultCode === '00' && 
                        apiResponse.response.body.items.item) {
                        // 기존 공휴일 백업
                        const existingHolidays = this.data.holidays[year] || [];
                        
                        // 새 공휴일 목록 생성
                        const newHolidays = [];
                        const items = Array.isArray(apiResponse.response.body.items.item) 
                            ? apiResponse.response.body.items.item 
                            : [apiResponse.response.body.items.item];
                        
                        items.forEach(item => {
                            if (item.isHoliday === 'Y') {
                                const locdate = item.locdate.toString();
                                const month = parseInt(locdate.substring(4, 6));
                                const day = parseInt(locdate.substring(6, 8));
                                const name = item.dateName;
                                
                                // 중복 공휴일 확인
                                const exists = existingHolidays.some(h => 
                                    h.month === month && h.day === day
                                );
                                
                                if (!exists) {
                                    newHolidays.push({ month, day, name });
                                }
                            }
                        });
                        
                        // 공휴일 추가 및 정렬
                        if (newHolidays.length > 0) {
                            if (!this.data.holidays[year]) {
                                this.data.holidays[year] = [];
                            }
                            
                            this.data.holidays[year] = [
                                ...existingHolidays,
                                ...newHolidays
                            ].sort((a, b) => {
                                if (a.month === b.month) {
                                    return a.day - b.day;
                                }
                                return a.month - b.month;
                            });
                            
                            this.saveData();
                            this.renderHolidays(year);
                            this.renderCalendar();
                            
                            alert(`${newHolidays.length}개의 공휴일이 추가되었습니다.`);
                        } else {
                            alert('추가할 새 공휴일이 없습니다.');
                        }
                    } else {
                        throw new Error('공휴일 데이터가 없거나 형식이 잘못되었습니다.');
                    }
                })
                .catch(error => {
                    console.error('API 호출 오류:', error);
                    alert(`공휴일 데이터를 가져오는데 실패했습니다: ${error.message}\n\n기본 공휴일을 대신 추가합니다.`);
                    
                    // 대체 방법: 일반적인 한국 공휴일 자동 추가
                    this.addDefaultHolidays(year);
                })
                .finally(() => {
                    // 로딩 메시지 제거
                    this.renderHolidays(year);
                });
        } catch (error) {
            console.error('API 호출 시도 오류:', error);
            alert('API 호출에 실패했습니다. 기본 공휴일을 추가합니다.');
            
            // API 호출 실패 시 기본 공휴일 추가
            this.addDefaultHolidays(year);
        }
    },

    // 사용자 정의 스타일 추가
    addCustomStyles() {
        // 기존 스타일이 있으면 삭제
        const existingStyle = document.getElementById('expense-manager-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // 새 스타일 추가
        const style = document.createElement('style');
        style.id = 'expense-manager-styles';
        style.textContent = `
            /* 분류 관리 탭 스타일 */
            .category-tabs {
                display: flex;
                margin-bottom: 15px;
                border-bottom: 1px solid #ddd;
            }
            
            .tab-btn {
                padding: 10px 20px;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                border-bottom: none;
                cursor: pointer;
                margin-right: 5px;
                border-radius: 5px 5px 0 0;
                font-weight: normal;
            }
            
            .tab-btn.active {
                background-color: #4CAF50;
                color: white;
                font-weight: bold;
                border-color: #4CAF50;
            }
            
            /* 분류 입력 폼 스타일 */
            .category-form {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                border: 1px solid #ddd;
                margin-bottom: 20px;
            }
            
            .form-row {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .form-row label {
                width: 100px;
                font-weight: bold;
            }
            
            .form-row input, .form-row select {
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .add-btn {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 5px;
                font-weight: bold;
            }
            
            .add-btn:hover {
                background-color: #45a049;
            }
            
            /* 분류 목록 테이블 스타일 */
            .category-list-container h3 {
                margin-bottom: 10px;
                color: #333;
                font-size: 16px;
            }
            
            .category-table {
                width: 100%;
                border-collapse: collapse;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .category-table th, .category-table td {
                padding: 10px;
                text-align: left;
                border: 1px solid #ddd;
            }
            
            .category-table th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            
            .category-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            .category-table tr:hover {
                background-color: #f0f0f0;
            }
            
            .delete-btn {
                background-color: #f44336;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .delete-btn:hover {
                background-color: #d32f2f;
            }
            
            .no-category {
                padding: 15px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: center;
                color: #666;
                font-style: italic;
            }
            
            /* 월별 요약 및 상세 스타일 */
            .month {
                margin-bottom: 30px;
                border: 1px solid #ddd;
                border-radius: 5px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            
            .month-title {
                background-color: #4CAF50;
                color: white;
                padding: 10px 15px;
                font-weight: bold;
                font-size: 16px;
            }
            
            .month-summary {
                padding: 15px;
            }
            
            .summary-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                font-weight: bold;
            }
            
            .detail-btn {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .detail-btn:hover {
                background-color: #0b7dda;
            }
            
            .summary-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
            }
            
            .summary-table th, .summary-table td {
                padding: 8px;
                text-align: left;
                border: 1px solid #ddd;
            }
            
            .summary-table th {
                background-color: #f5f5f5;
                font-weight: bold;
            }
            
            .summary-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            .text-center {
                text-align: center;
            }
            
            .text-right {
                text-align: right;
            }
            
            .no-expense {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 10px;
            }
            
            /* 팝업 스타일 */
            .expense-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .popup-content {
                background-color: white;
                border-radius: 5px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                width: 80%;
                max-width: 900px;
                max-height: 80vh;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .popup-header {
                background-color: #4CAF50;
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .popup-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .close-popup-btn {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            .popup-body {
                padding: 15px;
                overflow-y: auto;
                max-height: calc(80vh - 60px);
            }
            
            .popup-tabs {
                display: flex;
                margin-bottom: 15px;
                border-bottom: 1px solid #ddd;
            }
            
            .popup-tab {
                padding: 10px 20px;
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                border-bottom: none;
                cursor: pointer;
                margin-right: 5px;
                border-radius: 5px 5px 0 0;
            }
            
            .popup-tab.active {
                background-color: #4CAF50;
                color: white;
                font-weight: bold;
                border-color: #4CAF50;
            }
            
            .popup-tab-content {
                margin-bottom: 20px;
            }
            
            .popup-tab-content.hidden {
                display: none;
            }
            
            .detail-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .detail-table th, .detail-table td {
                padding: 10px;
                text-align: left;
                border: 1px solid #ddd;
            }
            
            .detail-table th {
                background-color: #f5f5f5;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            .detail-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            
            .detail-table tr:hover {
                background-color: #f0f0f0;
            }
            
            .tab-section {
                margin-bottom: 20px;
            }
            
            .tab-section h4 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #333;
            }
            
            /* 기존 달력 스타일 수정 */
            .expense-day {
                margin: 5px 0;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 3px;
                background-color: #f9f9f9;
            }
            
            .expense-day.weekend {
                background-color: #fff8e1;
            }
            
            .expense-day.holiday {
                background-color: #ffebee;
            }
            
            .category-summary {
                margin-top: 10px;
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 분류 관리 탭 이벤트 리스너 설정
    setupCategoryTabListeners() {
        const categoryTabs = document.querySelectorAll('[data-bs-toggle="tab"]');
        
        categoryTabs.forEach(tab => {
            // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
            const clonedTab = tab.cloneNode(true);
            if (tab.parentNode) {
                tab.parentNode.replaceChild(clonedTab, tab);
            }
            
            clonedTab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = clonedTab.getAttribute('data-bs-target');
                
                // 활성화된 탭 설정
                document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
                clonedTab.classList.add('active');
                
                // 탭 컨텐츠 활성화
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('show', 'active');
                });
                
                const targetPane = document.querySelector(targetId);
                if (targetPane) {
                    targetPane.classList.add('show', 'active');
                    
                    // 선택된 탭에 따라 적절한 데이터 렌더링
                    if (targetId === '#main-category') {
                        this.renderMainCategories();
                    } else if (targetId === '#sub-category') {
                        this.renderSubCategories();
                        this.updateSubCategoryMainSelect();
                    }
                }
                
                // 엘리먼트 속성 설정
                document.querySelectorAll('.nav-link').forEach(t => {
                    t.setAttribute('aria-selected', 'false');
                });
                clonedTab.setAttribute('aria-selected', 'true');
            });
        });
        
        // 대분류 추가 버튼 이벤트 확인 및 설정
        const addMainCategoryBtn = document.getElementById('add-main-category-btn');
        if (addMainCategoryBtn) {
            // 기존 이벤트 제거 및 재설정
            const clonedBtn = addMainCategoryBtn.cloneNode(true);
            if (addMainCategoryBtn.parentNode) {
                addMainCategoryBtn.parentNode.replaceChild(clonedBtn, addMainCategoryBtn);
            }
            
            clonedBtn.addEventListener('click', () => {
                const code = document.getElementById('main-category-code').value.trim().toUpperCase();
                const name = document.getElementById('main-category-name').value.trim();
                
                if (code && name) {
                    this.addMainCategory(code, name);
                } else {
                    alert('분류 코드와 분류명을 모두 입력해주세요.');
                }
            });
        }
        
        // 중분류 추가 버튼 이벤트 확인 및 설정
        const addSubCategoryBtn = document.getElementById('add-sub-category-btn');
        if (addSubCategoryBtn) {
            // 기존 이벤트 제거 및 재설정
            const clonedBtn = addSubCategoryBtn.cloneNode(true);
            if (addSubCategoryBtn.parentNode) {
                addSubCategoryBtn.parentNode.replaceChild(clonedBtn, addSubCategoryBtn);
            }
            
            clonedBtn.addEventListener('click', () => {
                const mainCode = document.getElementById('sub-category-main').value;
                const code = document.getElementById('sub-category-code').value.trim().toUpperCase();
                const name = document.getElementById('sub-category-name').value.trim();
                
                if (mainCode && code && name) {
                    this.addSubCategory(mainCode, code, name);
                } else {
                    alert('대분류, 분류 코드, 분류명을 모두 입력해주세요.');
                }
            });
        }
    },

    // 연간 총 지출 및 월 평균 지출 업데이트
    updateSummary() {
        // 현재 년도의 모든 지출 금액 계산
        const year = this.data.year;
        let totalAmount = 0;
        
        // 반복 지출 금액 계산
        this.data.recurringExpenses.forEach(expense => {
            // 시작 년월/종료 년월 확인
            const startYear = expense.startDate ? parseInt(expense.startDate.split('-')[0]) : 0;
            const endYear = expense.endDate ? parseInt(expense.endDate.split('-')[0]) : 9999;
            
            // 현재 년도가 지출 기간에 포함되는 경우만 계산
            if (year >= startYear && year <= endYear) {
                const startMonth = (startYear === year && expense.startDate) ? 
                    parseInt(expense.startDate.split('-')[1]) - 1 : 0;
                const endMonth = (endYear === year && expense.endDate) ? 
                    parseInt(expense.endDate.split('-')[1]) - 1 : 11;
                
                // 해당 년도 내 적용 월 수 계산
                const monthsInYear = endMonth - startMonth + 1;
                totalAmount += expense.amount * monthsInYear;
            }
        });
        
        // 일회성 지출 금액 계산
        this.data.oneTimeExpenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            if (expenseDate.getFullYear() === year) {
                totalAmount += expense.amount;
            }
        });
        
        // UI 업데이트
        const totalExpenseElement = document.getElementById('total-expense');
        const monthlyAverageElement = document.getElementById('monthly-average');
        
        if (totalExpenseElement) {
            totalExpenseElement.textContent = totalAmount.toLocaleString();
        }
        
        if (monthlyAverageElement) {
            const monthlyAverage = Math.round(totalAmount / 12);
            monthlyAverageElement.textContent = monthlyAverage.toLocaleString();
        }
    },
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    ExpenseManager.init();
}); 
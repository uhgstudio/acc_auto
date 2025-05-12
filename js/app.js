/**
 * 메인 어플리케이션 모듈
 * 각 모듈을 초기화하고 전체 앱을 구동
 */
const App = {
    // 앱 초기화
    initialize() {
        console.log('가계부 앱 초기화 중...');
        
        // 데이터 로드
        DataManager.initialize();
        
        // 각 모듈 초기화
        this.initializeModules();
        
        // 탭 전환 이벤트 설정
        this.setupTabEvents();
        
        // 백업/복원 기능 설정
        this.setupBackupRestore();
        
        // 데이터 변경 이벤트 설정
        this.setupDataChangeEvents();
        
        // 년도 선택기 초기화
        this.setupYearSelector();
        
        // 테마 설정 기능 초기화
        this.setupThemeManager();
        
        // 상단 요약 정보 업데이트
        this.updateSummary();
        
        console.log('가계부 앱 초기화 완료');
    },
    
    // 각 모듈 초기화
    initializeModules() {
        // 달력 모듈 초기화
        ExpenseCalendar.initialize();
        
        // 지출 관리 모듈 초기화
        ExpenseManager.initialize();
        
        // 분류 관리 모듈 초기화
        CategoryManager.initialize();
        
        // 공휴일 관리 모듈 초기화
        HolidayManager.initialize();
    },
    
    // 탭 전환 이벤트 설정
    setupTabEvents() {
        // bootstrap 탭 이벤트 리스너 (탭 전환 시 해당 모듈 UI 갱신)
        document.addEventListener('shown.bs.tab', (event) => {
            const targetId = event.detail.target.getAttribute('data-bs-target');
            
            switch (targetId) {
                case '#calendar-tab':
                    ExpenseCalendar.renderCalendar();
                    break;
                case '#finance-statement-tab':
                    this.renderFinanceStatement();
                    break;
                case '#recurring-expense-tab':
                    ExpenseManager.renderRecurringExpenses();
                    break;
                case '#one-time-expense-tab':
                    ExpenseManager.renderOneTimeExpenses();
                    break;
                case '#category-management-tab':
                    CategoryManager.renderMainCategories();
                    CategoryManager.renderSubCategories();
                    break;
                case '#holiday-management-tab':
                    HolidayManager.renderHolidays();
                    break;
            }
        });
    },
    
    // 백업/복원 기능 설정
    setupBackupRestore() {
        // 데이터 백업 버튼
        const backupBtn = document.getElementById('backup-data-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                DataManager.backupData();
            });
        }
        
        // 데이터 복원 버튼
        const restoreFileInput = document.getElementById('restore-data-file');
        const restoreBtn = document.getElementById('restore-data-btn');
        
        if (restoreBtn && restoreFileInput) {
            restoreBtn.addEventListener('click', () => {
                if (restoreFileInput.files.length === 0) {
                    alert('복원할 파일을 선택해주세요.');
                    return;
                }
                
                const file = restoreFileInput.files[0];
                if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                    alert('JSON 형식의 파일만 복원할 수 있습니다.');
                    return;
                }
                
                const confirmRestore = confirm('데이터를 복원하면 현재 데이터가 모두 삭제됩니다. 계속하시겠습니까?');
                if (!confirmRestore) return;
                
                DataManager.restoreData(file)
                    .then(() => {
                        alert('데이터가 성공적으로 복원되었습니다.');
                        
                        // 모든 모듈 UI 갱신
                        this.initializeModules();
                        
                        // 파일 입력 초기화
                        restoreFileInput.value = '';
                    })
                    .catch(error => {
                        alert('데이터 복원 중 오류가 발생했습니다: ' + error);
                    });
            });
        }
        
        // 데이터 초기화 버튼 - 비밀번호 확인 추가
        const resetDataBtn = document.getElementById('reset-data-btn');
        const resetPasswordInput = document.getElementById('reset-password');
        
        if (resetDataBtn && resetPasswordInput) {
            resetDataBtn.addEventListener('click', () => {
                const password = resetPasswordInput.value;
                
                // 비밀번호 확인 (230218)
                if (password !== '230218') {
                    alert('비밀번호가 올바르지 않습니다.');
                    return;
                }
                
                const confirmReset = confirm('모든 데이터가 초기화됩니다. 계속하시겠습니까?');
                if (confirmReset) {
                    DataManager.resetData();
                    
                    // 모든 모듈 UI 갱신
                    this.initializeModules();
                    
                    // 비밀번호 입력 초기화
                    resetPasswordInput.value = '';
                    
                    alert('데이터가 초기화되었습니다.');
                }
            });
        }
    },
    
    // 데이터 변경 이벤트 설정
    setupDataChangeEvents() {
        // 지출 데이터 변경 시 달력 업데이트 (expenses-updated 이벤트)
        document.addEventListener('expenses-updated', () => {
            ExpenseCalendar.renderCalendar();
            this.updateSummary();
        });
    },
    
    // 년도 선택기 설정
    setupYearSelector() {
        const yearSelector = document.getElementById('year-selector');
        if (!yearSelector) return;
        
        // 현재 년도 기준으로 앞뒤 5년씩 옵션 생성
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 5;
        const endYear = currentYear + 5;
        
        for (let year = startYear; year <= endYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}년`;
            
            // 현재 선택된 년도 설정
            if (year === DataManager.data.year) {
                option.selected = true;
            }
            
            yearSelector.appendChild(option);
        }
        
        // 년도 변경 이벤트
        yearSelector.addEventListener('change', () => {
            const selectedYear = parseInt(yearSelector.value);
            DataManager.changeYear(selectedYear);
            
            // 달력 및 공휴일 갱신
            ExpenseCalendar.renderCalendar();
            HolidayManager.renderHolidays();
            
            // 상단 요약 정보 업데이트
            this.updateSummary();
        });
    },
    
    // 상단 요약 정보 업데이트
    updateSummary() {
        // 요약 정보 표시할 요소 참조
        const totalExpenseElement = document.getElementById('total-expense');
        const totalIncomeElement = document.getElementById('total-income');
        const netIncomeElement = document.getElementById('net-income');
        
        if (!totalExpenseElement || !totalIncomeElement || !netIncomeElement) return;
        
        // ExpenseCalendar의 월별 잔액 계산 함수 활용
        const monthlyBalanceData = ExpenseCalendar.calculateMonthlyBalanceWithCarryover();
        const summary = ExpenseCalendar.summarizeMonthlyData(monthlyBalanceData);
        
        // 디버깅: 월별 원래 금액 확인
        console.log('월별 데이터:', monthlyBalanceData);
        console.log('월별 요약:', summary);
        
        // 화면에 표시 (이월 금액 제외한 실제 수입/지출)
        totalExpenseElement.textContent = Utils.number.formatCurrency(summary.totalOriginalExpense).replace('원', '');
        totalIncomeElement.textContent = Utils.number.formatCurrency(summary.totalOriginalIncome).replace('원', '');
        
        // 연간 순수입 계산 (원래 금액으로만 계산)
        const netIncome = summary.totalOriginalIncome - summary.totalOriginalExpense;
        
        // 순수입 양수/음수에 따라 스타일 설정
        if (netIncome >= 0) {
            netIncomeElement.textContent = Utils.number.formatCurrency(netIncome).replace('원', '');
            netIncomeElement.style.color = 'var(--accent-color)';
        } else {
            netIncomeElement.textContent = '-' + Utils.number.formatCurrency(Math.abs(netIncome)).replace('원', '');
            netIncomeElement.style.color = '#e57373';
        }
    },
    
    // 자금수지 렌더링
    renderFinanceStatement() {
        const financeBody = document.getElementById('finance-statement-body');
        if (!financeBody) return;
        
        // 기존 내용 초기화
        financeBody.innerHTML = '';
        
        // 월별 잔액 데이터 계산 (이월 포함)
        const monthlyBalanceData = ExpenseCalendar.calculateMonthlyBalanceWithCarryover();
        
        // 카테고리별 지출/수입 데이터 수집
        const categories = this.collectCategoryData();
        
        // 1. 기초잔액 행 추가 (이전달 기말잔액을 표시)
        const initialBalanceRow = document.createElement('tr');
        initialBalanceRow.className = 'finance-row-total';
        
        // 월별 초기 잔액 계산 (전월 기말잔액)
        const monthlyInitialBalance = Array(12).fill(0);
        
        // 첫 달은 0으로 시작, 나머지 달은 이전 달의 최종 잔액을 초기 잔액으로 설정
        for (let month = 1; month < 12; month++) {
            if (monthlyBalanceData[month-1]) {
                monthlyInitialBalance[month] = monthlyBalanceData[month-1].finalBalance;
            }
        }
        
        // 연간 총 기초잔액은 1월의 기초잔액으로 설정 (보통 0)
        const totalInitialBalance = monthlyInitialBalance[0];
        
        // 기초잔액 행 HTML 생성
        initialBalanceRow.innerHTML = `
            <td class="finance-sticky-col finance-first-col"><기초잔액></td>
            <td class="finance-sticky-col finance-second-col text-end">${Utils.number.formatCurrency(totalInitialBalance)}</td>
            ${monthlyInitialBalance.map(balance => `
                <td class="text-end">${Utils.number.formatCurrency(balance)}</td>
            `).join('')}
        `;
        financeBody.appendChild(initialBalanceRow);
        
        // 2. 수입 데이터 처리
        // 수입 카테고리를 찾아서 그룹화
        const incomeCategories = {};
        let totalIncomeAmount = 0;
        const monthlyIncomeAmount = Array(12).fill(0);
        
        // 대분류 수집
        Object.values(categories).forEach(category => {
            if (category.isIncome) {
                const code = category.code;
                
                if (!incomeCategories[code]) {
                    incomeCategories[code] = {
                        name: category.name,
                        isIncome: true,
                        total: category.totalAmount,
                        monthly: [...category.monthlyAmount],
                        subCategories: []
                    };
                }
                
                totalIncomeAmount += category.totalAmount;
                
                // 월별 총액 누적
                for (let i = 0; i < 12; i++) {
                    monthlyIncomeAmount[i] += category.monthlyAmount[i] || 0;
                }
            }
        });
        
        // 중분류를 각 대분류에 할당
        DataManager.data.categories.sub.forEach(subCategory => {
            const mainCategory = DataManager.data.categories.main.find(main => main.code === subCategory.mainCode);
            
            if (mainCategory && mainCategory.type === 'income' && incomeCategories[mainCategory.code]) {
                // 이 중분류에 할당된 수입 계산
                let subCategoryTotal = 0;
                const subCategoryMonthly = Array(12).fill(0);
                
                // 반복 수입
                DataManager.data.recurringExpenses.forEach(expense => {
                    if (expense.subCategory === subCategory.code) {
                        if (expense.startDate) {
                            const startDate = new Date(expense.startDate + '-01');
                            let endDate;
                            
                            if (expense.endDate) {
                                endDate = new Date(expense.endDate + '-01');
                            } else {
                                endDate = new Date();
                            }
                            
                            const startYear = startDate.getFullYear();
                            const startMonth = startDate.getMonth();
                            const endYear = endDate.getFullYear();
                            const endMonth = endDate.getMonth();
                            
                            // 해당 년도에 속하는 달만 계산
                            if (startYear <= DataManager.data.year && DataManager.data.year <= endYear) {
                                const yearStartMonth = (startYear === DataManager.data.year) ? startMonth : 0;
                                const yearEndMonth = (endYear === DataManager.data.year) ? endMonth : 11;
                                
                                for (let month = yearStartMonth; month <= yearEndMonth; month++) {
                                    subCategoryMonthly[month] += expense.amount;
                                    subCategoryTotal += expense.amount;
                                }
                            }
                        }
                    }
                });
                
                // 일회성 수입
                DataManager.data.oneTimeExpenses.forEach(expense => {
                    if (expense.subCategory === subCategory.code) {
                        if (expense.date) {
                            const expenseDate = new Date(expense.date);
                            const expenseYear = expenseDate.getFullYear();
                            
                            if (expenseYear === DataManager.data.year) {
                                const expenseMonth = expenseDate.getMonth();
                                subCategoryMonthly[expenseMonth] += expense.amount;
                                subCategoryTotal += expense.amount;
                            }
                        }
                    }
                });
                
                // 중분류 데이터가 있는 경우만 추가
                if (subCategoryTotal > 0) {
                    incomeCategories[mainCategory.code].subCategories.push({
                        name: subCategory.name,
                        total: subCategoryTotal,
                        monthly: subCategoryMonthly
                    });
                }
            }
        });
        
        // 총수입 행 추가
        const totalIncomeRow = document.createElement('tr');
        totalIncomeRow.className = 'finance-row-main';
        totalIncomeRow.innerHTML = `
            <td class="finance-sticky-col finance-first-col">총수입</td>
            <td class="finance-sticky-col finance-second-col text-end finance-positive">${Utils.number.formatCurrency(totalIncomeAmount)}</td>
            ${monthlyIncomeAmount.map(amount => `<td class="text-end finance-positive">${Utils.number.formatCurrency(amount)}</td>`).join('')}
        `;
        financeBody.appendChild(totalIncomeRow);
        
        // 수입 카테고리 행 추가
        Object.values(incomeCategories).forEach(category => {
            // 대분류 행 추가
            const categoryRow = document.createElement('tr');
            categoryRow.className = 'finance-row-subtotal';
            categoryRow.innerHTML = `
                <td class="finance-sticky-col finance-first-col">${category.name}</td>
                <td class="finance-sticky-col finance-second-col text-end">${Utils.number.formatCurrency(category.total)}</td>
                ${category.monthly.map(amount => `<td class="text-end">${Utils.number.formatCurrency(amount)}</td>`).join('')}
            `;
            financeBody.appendChild(categoryRow);
            
            // 중분류 행 추가
            category.subCategories.forEach(subCategory => {
                const subCategoryRow = document.createElement('tr');
                subCategoryRow.innerHTML = `
                    <td class="finance-sticky-col finance-first-col"><span class="finance-row-sub">${subCategory.name}</span></td>
                    <td class="finance-sticky-col finance-second-col text-end">${Utils.number.formatCurrency(subCategory.total)}</td>
                    ${subCategory.monthly.map(amount => `<td class="text-end">${Utils.number.formatCurrency(amount)}</td>`).join('')}
                `;
                financeBody.appendChild(subCategoryRow);
            });
        });
        
        // 3. 지출 섹션 헤더
        const expenseHeaderRow = document.createElement('tr');
        expenseHeaderRow.className = 'finance-row-total';
        expenseHeaderRow.innerHTML = `
            <td class="finance-sticky-col finance-first-col">지출</td>
            <td class="finance-sticky-col finance-second-col text-end"></td>
            ${Array(12).fill('<td class="text-end"></td>').join('')}
        `;
        financeBody.appendChild(expenseHeaderRow);
        
        // 지출 카테고리 데이터 처리
        const expenseCategories = {};
        let totalExpenseAmount = 0;
        const monthlyExpenseAmount = Array(12).fill(0);
        
        // 대분류 수집
        Object.values(categories).forEach(category => {
            if (!category.isIncome) {
                const code = category.code;
                
                if (!expenseCategories[code]) {
                    expenseCategories[code] = {
                        name: category.name,
                        isIncome: false,
                        total: category.totalAmount,
                        monthly: [...category.monthlyAmount],
                        subCategories: []
                    };
                }
                
                totalExpenseAmount += category.totalAmount;
                
                // 월별 총액 누적
                for (let i = 0; i < 12; i++) {
                    monthlyExpenseAmount[i] += category.monthlyAmount[i] || 0;
                }
            }
        });
        
        // 중분류를 각 대분류에 할당 (지출)
        DataManager.data.categories.sub.forEach(subCategory => {
            const mainCategory = DataManager.data.categories.main.find(main => main.code === subCategory.mainCode);
            
            if (mainCategory && mainCategory.type === 'expense' && expenseCategories[mainCategory.code]) {
                // 이 중분류에 할당된 지출 계산
                let subCategoryTotal = 0;
                const subCategoryMonthly = Array(12).fill(0);
                
                // 반복 지출
                DataManager.data.recurringExpenses.forEach(expense => {
                    if (expense.subCategory === subCategory.code) {
                        if (expense.startDate) {
                            const startDate = new Date(expense.startDate + '-01');
                            let endDate;
                            
                            if (expense.endDate) {
                                endDate = new Date(expense.endDate + '-01');
                            } else {
                                endDate = new Date();
                            }
                            
                            const startYear = startDate.getFullYear();
                            const startMonth = startDate.getMonth();
                            const endYear = endDate.getFullYear();
                            const endMonth = endDate.getMonth();
                            
                            // 해당 년도에 속하는 달만 계산
                            if (startYear <= DataManager.data.year && DataManager.data.year <= endYear) {
                                const yearStartMonth = (startYear === DataManager.data.year) ? startMonth : 0;
                                const yearEndMonth = (endYear === DataManager.data.year) ? endMonth : 11;
                                
                                for (let month = yearStartMonth; month <= yearEndMonth; month++) {
                                    subCategoryMonthly[month] += expense.amount;
                                    subCategoryTotal += expense.amount;
                                }
                            }
                        }
                    }
                });
                
                // 일회성 지출
                DataManager.data.oneTimeExpenses.forEach(expense => {
                    if (expense.subCategory === subCategory.code) {
                        if (expense.date) {
                            const expenseDate = new Date(expense.date);
                            const expenseYear = expenseDate.getFullYear();
                            
                            if (expenseYear === DataManager.data.year) {
                                const expenseMonth = expenseDate.getMonth();
                                subCategoryMonthly[expenseMonth] += expense.amount;
                                subCategoryTotal += expense.amount;
                            }
                        }
                    }
                });
                
                // 중분류 데이터가 있는 경우만 추가
                if (subCategoryTotal > 0) {
                    expenseCategories[mainCategory.code].subCategories.push({
                        name: subCategory.name,
                        total: subCategoryTotal,
                        monthly: subCategoryMonthly
                    });
                }
            }
        });
        
        // 총지출 행 추가
        const totalExpenseRow = document.createElement('tr');
        totalExpenseRow.className = 'finance-row-main';
        totalExpenseRow.innerHTML = `
            <td class="finance-sticky-col finance-first-col">총지출</td>
            <td class="finance-sticky-col finance-second-col text-end finance-negative">${Utils.number.formatCurrency(totalExpenseAmount)}</td>
            ${monthlyExpenseAmount.map(amount => `<td class="text-end finance-negative">${Utils.number.formatCurrency(amount)}</td>`).join('')}
        `;
        financeBody.appendChild(totalExpenseRow);
        
        // 지출 카테고리 행 추가
        Object.values(expenseCategories).forEach(category => {
            // 대분류 행 추가
            const categoryRow = document.createElement('tr');
            categoryRow.className = 'finance-row-subtotal';
            categoryRow.innerHTML = `
                <td class="finance-sticky-col finance-first-col">${category.name}</td>
                <td class="finance-sticky-col finance-second-col text-end">${Utils.number.formatCurrency(category.total)}</td>
                ${category.monthly.map(amount => `<td class="text-end">${Utils.number.formatCurrency(amount)}</td>`).join('')}
            `;
            financeBody.appendChild(categoryRow);
            
            // 중분류 행 추가
            category.subCategories.forEach(subCategory => {
                const subCategoryRow = document.createElement('tr');
                subCategoryRow.innerHTML = `
                    <td class="finance-sticky-col finance-first-col"><span class="finance-row-sub">${subCategory.name}</span></td>
                    <td class="finance-sticky-col finance-second-col text-end">${Utils.number.formatCurrency(subCategory.total)}</td>
                    ${subCategory.monthly.map(amount => `<td class="text-end">${Utils.number.formatCurrency(amount)}</td>`).join('')}
                `;
                financeBody.appendChild(subCategoryRow);
            });
        });
        
        // 4. 기말잔액 행 추가
        const finalBalanceRow = document.createElement('tr');
        finalBalanceRow.className = 'finance-row-total';
        
        // 월별 최종 잔액 계산
        const monthlyFinalBalance = monthlyBalanceData.map(data => data.finalBalance);
        const totalFinalBalance = monthlyFinalBalance[11] || 0; // 12월의 최종 잔액이 연간 총 잔액
        
        finalBalanceRow.innerHTML = `
            <td class="finance-sticky-col finance-first-col"><기말잔액></td>
            <td class="finance-sticky-col finance-second-col text-end ${totalFinalBalance >= 0 ? 'finance-positive' : 'finance-negative'}">${Utils.number.formatCurrency(totalFinalBalance)}</td>
            ${monthlyFinalBalance.map(balance => `
                <td class="text-end ${balance >= 0 ? 'finance-positive' : 'finance-negative'}">
                    ${Utils.number.formatCurrency(balance)}
                </td>
            `).join('')}
        `;
        financeBody.appendChild(finalBalanceRow);
    },
    
    // 카테고리별 데이터 수집
    collectCategoryData() {
        const categories = {};
        const year = DataManager.data.year;
        
        // 카테고리 구조 초기화
        DataManager.data.categories.main.forEach(mainCategory => {
            categories[mainCategory.code] = {
                code: mainCategory.code,
                name: mainCategory.name,
                isIncome: mainCategory.type === 'income',
                totalAmount: 0,
                monthlyAmount: Array(12).fill(0)
            };
        });
        
        // 반복 지출/수입 처리
        DataManager.data.recurringExpenses.forEach(expense => {
            if (!expense.mainCategory) return;
            
            const mainCategoryCode = expense.mainCategory;
            if (!categories[mainCategoryCode]) return;
            
            // 시작일과 종료일 확인
            if (expense.startDate) {
                const startDate = new Date(expense.startDate + '-01');
                let endDate;
                
                if (expense.endDate) {
                    endDate = new Date(expense.endDate + '-01');
                } else {
                    endDate = new Date();
                }
                
                const startYear = startDate.getFullYear();
                const startMonth = startDate.getMonth();
                const endYear = endDate.getFullYear();
                const endMonth = endDate.getMonth();
                
                // 해당 년도에 속하는 달만 계산
                if (startYear <= year && year <= endYear) {
                    const yearStartMonth = (startYear === year) ? startMonth : 0;
                    const yearEndMonth = (endYear === year) ? endMonth : 11;
                    
                    for (let month = yearStartMonth; month <= yearEndMonth; month++) {
                        categories[mainCategoryCode].monthlyAmount[month] += expense.amount;
                        categories[mainCategoryCode].totalAmount += expense.amount;
                    }
                }
            }
        });
        
        // 일회성 지출/수입 처리
        DataManager.data.oneTimeExpenses.forEach(expense => {
            if (!expense.mainCategory) return;
            
            const mainCategoryCode = expense.mainCategory;
            if (!categories[mainCategoryCode]) return;
            
            if (expense.date) {
                const expenseDate = new Date(expense.date);
                const expenseYear = expenseDate.getFullYear();
                
                if (expenseYear === year) {
                    const expenseMonth = expenseDate.getMonth();
                    categories[mainCategoryCode].monthlyAmount[expenseMonth] += expense.amount;
                    categories[mainCategoryCode].totalAmount += expense.amount;
                }
            }
        });
        
        return categories;
    },
    
    // 자금수지 엑셀 다운로드 함수
    exportFinanceToExcel() {
        // 테이블 데이터 가져오기
        const table = document.getElementById('finance-statement-table');
        if (!table) return;
        
        try {
            // 현재 년도
            const year = DataManager.data.year;
            
            // CSV 데이터 생성 - BOM 추가하여 한글 깨짐 방지
            let csvContent = '\ufeff'; // BOM (Byte Order Mark)
            csvContent += '자금수지표 - ' + year + '년\r\n\r\n';
            
            // 헤더 추가
            const headers = [];
            table.querySelectorAll('thead th').forEach(th => {
                // CSV 형식에 맞게 텍스트 처리 (콤마, 쌍따옴표 처리)
                const cellText = th.textContent.trim();
                headers.push(this.escapeCSVCell(cellText));
            });
            csvContent += headers.join(',') + '\r\n';
            
            // 데이터 행 추가
            table.querySelectorAll('tbody tr').forEach(row => {
                const rowData = [];
                row.querySelectorAll('td').forEach(cell => {
                    // 셀 텍스트 가져오기 (숫자 포맷팅 제거)
                    let cellText = cell.textContent.trim();
                    
                    // 통화 기호 및 콤마 제거 (숫자 데이터의 경우)
                    if (/^[+-]?[\d,]+원?$/.test(cellText)) {
                        // 모든 콤마 제거 및 '원' 문자 제거
                        cellText = cellText.replace(/,/g, '').replace(/원$/, '');
                        
                        // 순수 숫자값만 남김 (CSV에서 숫자로 인식되도록)
                        if (!isNaN(parseFloat(cellText))) {
                            cellText = parseFloat(cellText);
                        }
                    }
                    
                    // CSV 형식에 맞게 처리
                    rowData.push(this.escapeCSVCell(cellText));
                });
                csvContent += rowData.join(',') + '\r\n';
            });
            
            // 엑셀에서 UTF-8로 열리도록 설정
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `자금수지표_${year}년_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('자금수지 데이터가 CSV 파일로 저장되었습니다.\n파일을 열 때 Excel에서 UTF-8 인코딩으로 열어주세요.');
        } catch (error) {
            console.error('엑셀 다운로드 중 오류 발생:', error);
            alert('파일 다운로드 중 오류가 발생했습니다.');
        }
    },
    
    // CSV 셀 값 이스케이프 처리
    escapeCSVCell(cellText) {
        // 숫자인 경우 그대로 반환 (따옴표로 감싸지 않음)
        if (typeof cellText === 'number') {
            return cellText;
        }
        
        // 쌍따옴표, 콤마, 개행문자가 포함된 경우 쌍따옴표로 감싸고 내부 쌍따옴표는 두 번 사용
        if (cellText.includes('"') || cellText.includes(',') || cellText.includes('\n') || cellText.includes('\r')) {
            return '"' + cellText.replace(/"/g, '""') + '"';
        }
        return cellText;
    },
    
    // 테마 설정 기능 초기화
    setupThemeManager() {
        // 현재 테마 확인 및 적용
        const currentTheme = localStorage.getItem('theme') || 'default';
        this.applyTheme(currentTheme);
        
        // 테마 버튼 이벤트 처리
        const themeButtons = document.querySelectorAll('.theme-btn');
        const currentThemeNameElement = document.getElementById('current-theme-name');
        
        if (themeButtons.length && currentThemeNameElement) {
            // 현재 테마에 active 클래스 추가
            themeButtons.forEach(btn => {
                const btnTheme = btn.getAttribute('data-theme');
                if (btnTheme === currentTheme) {
                    btn.classList.add('active');
                    
                    // 현재 테마 이름 표시
                    currentThemeNameElement.textContent = this.getThemeName(currentTheme);
                }
                
                // 테마 버튼 클릭 이벤트
                btn.addEventListener('click', () => {
                    const theme = btn.getAttribute('data-theme');
                    
                    // 현재 테마 저장 및 적용
                    localStorage.setItem('theme', theme);
                    this.applyTheme(theme);
                    
                    // active 클래스 업데이트
                    themeButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // 현재 테마 이름 업데이트
                    currentThemeNameElement.textContent = this.getThemeName(theme);
                });
            });
        }
    },
    
    // 테마 적용 함수
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },
    
    // 테마 이름 반환 함수
    getThemeName(theme) {
        switch (theme) {
            case 'default': return '기본 테마';
            case 'blue': return '블루 테마';
            case 'green': return '그린 테마';
            case 'orange': return '오렌지 테마';
            case 'purple': return '퍼플 테마';
            default: return '기본 테마';
        }
    }
};

// DOM이 로드된 후 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    App.initialize();
    
    // 자금수지 엑셀 다운로드 버튼 이벤트 처리
    const exportFinanceBtn = document.getElementById('export-finance-btn');
    if (exportFinanceBtn) {
        exportFinanceBtn.addEventListener('click', () => {
            App.exportFinanceToExcel();
        });
    }
}); 
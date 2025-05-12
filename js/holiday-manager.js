/**
 * 공휴일 관리 모듈
 * 공휴일 추가, 삭제, 표시 기능 담당
 */
const HolidayManager = {
    // 공휴일 관리 초기화
    initialize() {
        this.renderHolidays();
        this.setupHolidayEventListeners();
    },
    
    // 공휴일 목록 렌더링
    renderHolidays() {
        const holidayList = document.getElementById('holiday-list');
        if (!holidayList) return;
        
        const year = DataManager.data.year.toString();
        document.getElementById('holiday-year').textContent = year;
        
        if (!DataManager.data.holidays[year] || DataManager.data.holidays[year].length === 0) {
            let html = '<p>등록된 공휴일이 없습니다.</p>';
            html += '<button id="fetch-holidays-btn" class="btn btn-primary mt-3">공휴일 자동 설정</button>';
            holidayList.innerHTML = html;
            
            // 공휴일 자동 설정 버튼 이벤트 추가
            const fetchBtn = document.getElementById('fetch-holidays-btn');
            if (fetchBtn) {
                fetchBtn.addEventListener('click', () => {
                    this.fetchHolidays(year);
                });
            }
            return;
        }
        
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>공휴일 명</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        DataManager.data.holidays[year].forEach((holiday, index) => {
            const date = new Date(parseInt(year), holiday.month - 1, holiday.day);
            const dateStr = Utils.date.formatDate(date);
            
            html += `
                <tr>
                    <td>${dateStr} (${this.getDayOfWeek(date)})</td>
                    <td>${holiday.name}</td>
                    <td><button class="btn btn-sm btn-danger delete-holiday" data-index="${index}">삭제</button></td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            <button id="fetch-holidays-btn" class="btn btn-outline-primary mt-3">공휴일 추가 가져오기</button>
        `;
        
        holidayList.innerHTML = html;
        
        // 삭제 버튼 이벤트 리스너 추가
        const deleteButtons = holidayList.querySelectorAll('.delete-holiday');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteHoliday(index);
            });
        });
        
        // 공휴일 자동 설정 버튼 이벤트 추가
        const fetchBtn = document.getElementById('fetch-holidays-btn');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => {
                this.fetchHolidays(year);
            });
        }
    },
    
    // API에서 공휴일 가져오기
    fetchHolidays(year) {
        // 로딩 메시지 표시
        const holidayList = document.getElementById('holiday-list');
        holidayList.innerHTML = '<p class="loading-message">공휴일 정보를 가져오는 중입니다...</p>';
        
        // 한국 공휴일 API URL
        // 실제로는 API 키 등이 필요할 수 있으며, CORS 정책에 따라 직접 호출이 제한될 수 있습니다.
        // 여기서는 기본적인 한국 공휴일 데이터를 직접 설정합니다.
        
        // 공휴일 데이터 생성 (API 호출 대신 직접 설정)
        setTimeout(() => {
            // 해당 년도의 한국 공휴일
            const koreanHolidays = [
                { month: 1, day: 1, name: '신정' },
                { month: 3, day: 1, name: '삼일절' },
                { month: 5, day: 5, name: '어린이날' },
                { month: 6, day: 6, name: '현충일' },
                { month: 8, day: 15, name: '광복절' },
                { month: 10, day: 3, name: '개천절' },
                { month: 10, day: 9, name: '한글날' },
                { month: 12, day: 25, name: '크리스마스' }
            ];
            
            // 음력 공휴일 (매년 날짜가 다름)
            // 실제로는 음력->양력 변환 API 호출 필요
            // 여기서는 대략적인 날짜로 설정
            const lunarHolidays = {
                '2023': [
                    { month: 1, day: 22, name: '설날' },
                    { month: 5, day: 29, name: '부처님오신날' },
                    { month: 9, day: 29, name: '추석' }
                ],
                '2024': [
                    { month: 2, day: 10, name: '설날' },
                    { month: 5, day: 15, name: '부처님오신날' },
                    { month: 9, day: 17, name: '추석' }
                ],
                '2025': [
                    { month: 1, day: 28, name: '설날' },
                    { month: 5, day: 5, name: '부처님오신날' },
                    { month: 10, day: 7, name: '추석' }
                ]
            };
            
            // 해당 년도 공휴일 목록 초기화 또는 생성
            if (!DataManager.data.holidays[year]) {
                DataManager.data.holidays[year] = [];
            }
            
            // 양력 공휴일 추가
            koreanHolidays.forEach(holiday => {
                // 중복 체크
                const exists = DataManager.data.holidays[year].some(
                    h => h.month === holiday.month && h.day === holiday.day
                );
                
                if (!exists) {
                    DataManager.data.holidays[year].push(holiday);
                }
            });
            
            // 음력 공휴일 추가 (해당 년도에 있는 경우만)
            if (lunarHolidays[year]) {
                lunarHolidays[year].forEach(holiday => {
                    // 중복 체크
                    const exists = DataManager.data.holidays[year].some(
                        h => h.month === holiday.month && h.day === holiday.day
                    );
                    
                    if (!exists) {
                        DataManager.data.holidays[year].push(holiday);
                    }
                });
            }
            
            // 날짜 순으로 정렬
            DataManager.data.holidays[year].sort((a, b) => {
                if (a.month === b.month) {
                    return a.day - b.day;
                }
                return a.month - b.month;
            });
            
            // 데이터 저장
            DataManager.saveData();
            
            // 공휴일 목록 다시 렌더링
            this.renderHolidays();
            
            // 달력 업데이트를 위한 이벤트 발생
            document.dispatchEvent(new CustomEvent('expenses-updated'));
            
        }, 1000); // 1초 지연 (API 호출 시간 시뮬레이션)
    },
    
    // 요일 문자열 반환
    getDayOfWeek(date) {
        const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
        return daysOfWeek[date.getDay()];
    },
    
    // 공휴일 삭제
    deleteHoliday(index) {
        const year = DataManager.data.year.toString();
        const holiday = DataManager.data.holidays[year][index];
        const date = new Date(parseInt(year), holiday.month - 1, holiday.day);
        const dateStr = Utils.date.formatDate(date);
        
        const confirmDelete = confirm(`${dateStr} ${holiday.name} 공휴일을 삭제하시겠습니까?`);
        
        if (confirmDelete) {
            try {
                DataManager.removeHoliday(year, index);
                this.renderHolidays();
                
                // 달력 업데이트를 위한 이벤트 발생
                document.dispatchEvent(new CustomEvent('expenses-updated'));
            } catch (error) {
                alert(error.message);
            }
        }
    },
    
    // 공휴일 관련 이벤트 리스너 설정
    setupHolidayEventListeners() {
        // 년도 이동 버튼 (이전년도)
        const prevHolidayYearBtn = document.getElementById('prev-holiday-year-btn');
        if (prevHolidayYearBtn) {
            prevHolidayYearBtn.addEventListener('click', () => {
                DataManager.changeYear(DataManager.data.year - 1);
                this.renderHolidays();
            });
        }
        
        // 년도 이동 버튼 (다음년도)
        const nextHolidayYearBtn = document.getElementById('next-holiday-year-btn');
        if (nextHolidayYearBtn) {
            nextHolidayYearBtn.addEventListener('click', () => {
                DataManager.changeYear(DataManager.data.year + 1);
                this.renderHolidays();
            });
        }
        
        // 공휴일 추가 폼 이벤트
        const addHolidayForm = document.getElementById('add-holiday-form');
        if (addHolidayForm) {
            addHolidayForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const year = DataManager.data.year;
                const dateStr = document.getElementById('holiday-date').value;
                const name = document.getElementById('holiday-name').value.trim();
                
                if (dateStr && name) {
                    try {
                        // 날짜 파싱
                        const date = Utils.date.parseDate(dateStr);
                        const month = date.getMonth() + 1; // 0-based to 1-based
                        const day = date.getDate();
                        
                        // 입력한 날짜의 년도가 현재 선택된 년도와 일치하는지 확인
                        if (date.getFullYear() !== year) {
                            alert(`선택하신 날짜의 년도(${date.getFullYear()})가 현재 표시 중인 년도(${year})와 일치하지 않습니다.`);
                            return;
                        }
                        
                        // 공휴일 추가
                        DataManager.addHoliday(year.toString(), month, day, name);
                        
                        // 입력 필드 초기화
                        document.getElementById('holiday-date').value = '';
                        document.getElementById('holiday-name').value = '';
                        
                        // 목록 갱신
                        this.renderHolidays();
                        
                        // 달력 업데이트를 위한 이벤트 발생
                        document.dispatchEvent(new CustomEvent('expenses-updated'));
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert('날짜와 공휴일 명을 모두 입력해주세요.');
                }
            });
        }
    }
}; 
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
        
        // 공공데이터포털 공휴일 API URL 및 필요한 매개변수 설정
        const url = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
        
        // 년도가 문자열인지 확인하고 변환
        const yearStr = year.toString();
        
        // 데이터 로딩 시작
        const fetchYearHolidays = async () => {
            try {
                // 로딩 메시지 업데이트
                holidayList.innerHTML = `<p class="loading-message">${yearStr}년 공휴일 정보를 가져오는 중입니다...</p>`;
                
                // 한 번의 요청으로 전체 년도 공휴일 가져오기
                const yearlyHolidays = await this.fetchYearlyHolidays(yearStr);
                
                // 공휴일 데이터가 있는 경우
                if (yearlyHolidays && yearlyHolidays.length > 0) {
                    // 기존 공휴일 데이터 초기화
                    if (!DataManager.data.holidays[yearStr]) {
                        DataManager.data.holidays[yearStr] = [];
                    }
                    
                    // 새로 가져온 공휴일 데이터 추가 (중복 체크)
                    yearlyHolidays.forEach(holiday => {
                        // 이미 있는 공휴일인지 확인
                        const exists = DataManager.data.holidays[yearStr].some(
                            h => h.month === holiday.month && h.day === holiday.day
                        );
                        
                        if (!exists) {
                            DataManager.data.holidays[yearStr].push(holiday);
                        }
                    });
                    
                    // 날짜순 정렬
                    DataManager.data.holidays[yearStr].sort((a, b) => {
                        if (a.month === b.month) {
                            return a.day - b.day;
                        }
                        return a.month - b.month;
                    });
                    
                    // 로컬 데이터 저장
                    DataManager.saveData();
                    
                    // MongoDB에도 저장하기
                    try {
                        // API를 통해 DB에 공휴일 저장
                        this.saveHolidaysToDB(yearStr, DataManager.data.holidays[yearStr]);
                    } catch (dbError) {
                        console.error('공휴일 DB 저장 중 오류:', dbError);
                        // DB 저장 실패해도 로컬 저장은 완료됨
                    }
                    
                    // 공휴일 목록 다시 렌더링
                    this.renderHolidays();
                    
                    // 달력 업데이트를 위한 이벤트 발생
                    document.dispatchEvent(new CustomEvent('expenses-updated'));
                    
                    // 성공 메시지 표시
                    alert(`${yearStr}년 공휴일 정보가 성공적으로 가져와졌습니다.`);
                } else {
                    // 데이터가 없는 경우
                    holidayList.innerHTML = '<p class="error-message">공휴일 정보를 찾을 수 없습니다.</p>';
                    setTimeout(() => this.renderHolidays(), 2000);
                }
            } catch (error) {
                console.error('공휴일 데이터 가져오기 실패:', error);
                holidayList.innerHTML = '<p class="error-message">공휴일 정보를 가져오는 중 오류가 발생했습니다.</p>';
                setTimeout(() => this.renderHolidays(), 2000);
            }
        };
        
        // 공휴일 데이터 가져오기 시작
        fetchYearHolidays();
    },
    
    // 특정 년도의 전체 공휴일 데이터 가져오기
    fetchYearlyHolidays(year) {
        return new Promise((resolve, reject) => {
            // 공공데이터포털 API URL 및 필요한 매개변수 설정
            const url = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';
            
            // 로컬 스토리지에서 API 키 가져오기 (디코딩된 값 사용)
            const serviceKey = "FtHeLbjpVuh3T/f1ni81E0sVXqCBABBj5nC11MV591pdnc5gzHS7PGeRNQTJT5nezvJ5UE5cAiQ4Opfb94CZ0A==";
            
            // API 키가 없는 경우
            if (!serviceKey) {
                reject(new Error('API 키가 설정되지 않았습니다.'));
                return;
            }
            
            // 년도의 공휴일 정보 요청 URL 생성 (월 파라미터 없이 년도만 전달)
            const queryParams = `?serviceKey=${encodeURIComponent(serviceKey)}&solYear=${year}&numOfRows=100&_type=json`;
            const requestUrl = url + queryParams;
            
            // XMLHttpRequest 생성
            const xhr = new XMLHttpRequest();
            xhr.open('GET', requestUrl);
            xhr.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        try {
                            // 응답이 JSON인지 확인
                            let responseData;
                            if (this.responseText.trim().startsWith('{')) {
                                // JSON 응답 파싱
                                responseData = JSON.parse(this.responseText);
                                
                                // 결과 코드 확인
                                const resultCode = responseData.response?.header?.resultCode;
                                const resultMsg = responseData.response?.header?.resultMsg;
                                
                                // 결과가 정상이 아닌 경우
                                if (resultCode !== "00") {
                                    reject(new Error(`API 오류: ${resultMsg || '알 수 없는 오류'}`));
                                    return;
                                }
                                
                                // 공휴일 데이터 추출
                                const items = responseData.response?.body?.items?.item || [];
                                const holidays = [];
                                
                                // 단일 객체인 경우 배열로 변환
                                const itemArray = Array.isArray(items) ? items : [items];
                                
                                // 아이템이 없는 경우 빈 배열 반환
                                if (itemArray.length === 0) {
                                    resolve([]);
                                    return;
                                }
                                
                                itemArray.forEach(item => {
                                    if (!item.locdate) return;
                                    
                                    // locdate 형식: YYYYMMDD (문자열)
                                    const locdate = item.locdate.toString();
                                    const monthFromData = parseInt(locdate.substring(4, 6));
                                    const dayFromData = parseInt(locdate.substring(6, 8));
                                    const holidayName = item.dateName || "공휴일";
                                    
                                    holidays.push({
                                        month: monthFromData,
                                        day: dayFromData,
                                        name: holidayName
                                    });
                                });
                                
                                resolve(holidays);
                            } else {
                                // XML 응답 파싱
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(this.responseText, "text/xml");
                                
                                // 오류 코드 확인
                                const resultCode = xmlDoc.getElementsByTagName("resultCode")[0]?.textContent;
                                const resultMsg = xmlDoc.getElementsByTagName("resultMsg")[0]?.textContent;
                                
                                // 결과가 정상이 아닌 경우
                                if (resultCode !== "00") {
                                    reject(new Error(`API 오류: ${resultMsg || '알 수 없는 오류'}`));
                                    return;
                                }
                                
                                // 공휴일 데이터 추출
                                const items = xmlDoc.getElementsByTagName("item");
                                const holidays = [];
                                
                                // 아이템이 없는 경우 빈 배열 반환
                                if (!items || items.length === 0) {
                                    resolve([]);
                                    return;
                                }
                                
                                for (let i = 0; i < items.length; i++) {
                                    const item = items[i];
                                    
                                    // locdate 형식: YYYYMMDD
                                    const locdate = item.getElementsByTagName("locdate")[0]?.textContent;
                                    if (!locdate) continue;
                                    
                                    const monthFromData = parseInt(locdate.substring(4, 6));
                                    const dayFromData = parseInt(locdate.substring(6, 8));
                                    const holidayName = item.getElementsByTagName("dateName")[0]?.textContent || "공휴일";
                                    
                                    holidays.push({
                                        month: monthFromData,
                                        day: dayFromData,
                                        name: holidayName
                                    });
                                }
                                
                                resolve(holidays);
                            }
                        } catch (error) {
                            console.error('응답 파싱 오류:', error);
                            reject(error);
                        }
                    } else {
                        // HTTP 오류 처리
                        reject(new Error(`HTTP 오류: ${this.status} ${this.statusText}`));
                    }
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('네트워크 오류가 발생했습니다.'));
            };
            
            xhr.send();
        });
    },
    
    // 한국 공휴일 데이터 (API 호출 실패 시 대체용)
    getDefaultHolidays(year) {
        // 양력 공휴일
        const fixedHolidays = [
            { month: 1, day: 1, name: '신정' },
            { month: 3, day: 1, name: '삼일절' },
            { month: 5, day: 5, name: '어린이날' },
            { month: 6, day: 6, name: '현충일' },
            { month: 8, day: 15, name: '광복절' },
            { month: 10, day: 3, name: '개천절' },
            { month: 10, day: 9, name: '한글날' },
            { month: 12, day: 25, name: '크리스마스' }
        ];
        
        // 음력 공휴일 (연도별로 다름)
        // 실제로는 정확한 날짜를 알기 위해 API를 사용해야 함
        const lunarHolidays = {
            '2023': [
                { month: 1, day: 22, name: '설날' },
                { month: 1, day: 23, name: '설날' },
                { month: 1, day: 24, name: '설날' },
                { month: 5, day: 29, name: '부처님오신날' },
                { month: 9, day: 28, name: '추석' },
                { month: 9, day: 29, name: '추석' },
                { month: 9, day: 30, name: '추석' }
            ],
            '2024': [
                { month: 2, day: 9, name: '설날' },
                { month: 2, day: 10, name: '설날' },
                { month: 2, day: 11, name: '설날' },
                { month: 5, day: 15, name: '부처님오신날' },
                { month: 9, day: 16, name: '추석' },
                { month: 9, day: 17, name: '추석' },
                { month: 9, day: 18, name: '추석' }
            ],
            '2025': [
                { month: 1, day: 28, name: '설날' },
                { month: 1, day: 29, name: '설날' },
                { month: 1, day: 30, name: '설날' },
                { month: 5, day: 5, name: '부처님오신날' },
                { month: 10, day: 6, name: '추석' },
                { month: 10, day: 7, name: '추석' },
                { month: 10, day: 8, name: '추석' }
            ]
        };
        
        const yearStr = year.toString();
        const holidays = [...fixedHolidays];
        
        // 해당 연도의 음력 공휴일이 있으면 추가
        if (lunarHolidays[yearStr]) {
            holidays.push(...lunarHolidays[yearStr]);
        }
        
        return holidays;
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
                // MongoDB에 저장된 공휴일이면 API를 통해 삭제
                if (holiday._id && window.api && window.api.holidays) {
                    console.log(`MongoDB에서 공휴일 삭제 시도: ${holiday._id}`);
                    window.api.holidays.delete(holiday._id)
                        .then(response => {
                            if (response.success) {
                                console.log('MongoDB에서 공휴일 삭제 성공');
                            } else {
                                console.error('MongoDB에서 공휴일 삭제 실패:', response.error);
                            }
                        })
                        .catch(error => {
                            console.error('MongoDB에서 공휴일 삭제 오류:', error);
                        });
                }
                
                // 로컬 데이터에서도 삭제
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
                        
                        // MongoDB에 공휴일 추가 (API 사용)
                        if (window.api && window.api.holidays) {
                            console.log(`MongoDB에 공휴일 추가 시도: ${year}년 ${month}월 ${day}일 ${name}`);
                            const holidayData = {
                                year: year,
                                month: month,
                                day: day,
                                name: name
                            };
                            
                            window.api.holidays.create(holidayData)
                                .then(response => {
                                    if (response.success) {
                                        console.log('MongoDB에 공휴일 추가 성공:', response.data);
                                        
                                        // 입력 필드 초기화
                                        document.getElementById('holiday-date').value = '';
                                        document.getElementById('holiday-name').value = '';
                                        
                                        // 로컬 데이터에도 추가 (MongoDB ID 포함)
                                        const yearStr = year.toString();
                                        if (!DataManager.data.holidays[yearStr]) {
                                            DataManager.data.holidays[yearStr] = [];
                                        }
                                        
                                        DataManager.data.holidays[yearStr].push({
                                            month: month,
                                            day: day,
                                            name: name,
                                            _id: response.data._id
                                        });
                                        
                                        // 날짜순 정렬
                                        DataManager.data.holidays[yearStr].sort((a, b) => {
                                            if (a.month === b.month) {
                                                return a.day - b.day;
                                            }
                                            return a.month - b.month;
                                        });
                                        
                                        // 로컬 데이터 저장
                                        DataManager.saveData();
                                        
                                        // 목록 갱신
                                        this.renderHolidays();
                                        
                                        // 달력 업데이트를 위한 이벤트 발생
                                        document.dispatchEvent(new CustomEvent('expenses-updated'));
                                    } else {
                                        console.error('MongoDB에 공휴일 추가 실패:', response.error);
                                        alert(`공휴일 추가에 실패했습니다: ${response.error || '알 수 없는 오류'}`);
                                    }
                                })
                                .catch(error => {
                                    console.error('MongoDB에 공휴일 추가 오류:', error);
                                    alert(`공휴일 추가 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
                                    
                                    // API 실패 시 로컬만 추가
                                    DataManager.addHoliday(year.toString(), month, day, name);
                                    this.renderHolidays();
                                    document.dispatchEvent(new CustomEvent('expenses-updated'));
                                });
                        } else {
                            // API를 사용할 수 없는 경우 로컬에만 추가
                            DataManager.addHoliday(year.toString(), month, day, name);
                            
                            // 입력 필드 초기화
                            document.getElementById('holiday-date').value = '';
                            document.getElementById('holiday-name').value = '';
                            
                            // 목록 갱신
                            this.renderHolidays();
                            
                            // 달력 업데이트를 위한 이벤트 발생
                            document.dispatchEvent(new CustomEvent('expenses-updated'));
                        }
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert('날짜와 공휴일 명을 모두 입력해주세요.');
                }
            });
        }
        
        // 공공데이터포털 API 키 설정 폼 이벤트
        const fetchBtn = document.getElementById('fetch-holidays-btn');
        if (fetchBtn) {
            // API 키 입력 다이얼로그 표시 후 공휴일 가져오기
            fetchBtn.addEventListener('click', () => {
                // 로컬 스토리지에서 이전에 저장된 API 키 가져오기
                const savedApiKey = localStorage.getItem('holidayApiKey') || '';
                
                // API 키 입력 다이얼로그 표시
                const apiKey = prompt(
                    '공공데이터포털의 디코딩된 서비스 키를 입력하세요.\n' +
                    '(공공데이터포털 > 마이페이지 > 개발계정에서 확인할 수 있습니다.)', 
                    savedApiKey
                );
                
                // 취소를 누르거나 빈 문자열을 입력한 경우
                if (apiKey === null) {
                    return;
                }
                
                if (apiKey.trim() === '') {
                    alert('유효한 API 키를 입력해주세요.');
                    return;
                }
                
                // API 키 로컬 스토리지에 저장
                localStorage.setItem('holidayApiKey', apiKey);
                
                // 공휴일 데이터 가져오기
                this.fetchHolidays(DataManager.data.year);
            });
        }
    },
    
    // MongoDB에 공휴일 저장
    saveHolidaysToDB(year, holidays) {
        return new Promise(async (resolve, reject) => {
            try {
                // 인증된 사용자만 API 호출 가능
                if (!window.api || !window.api.holidays) {
                    console.warn('API 클라이언트가 초기화되지 않았습니다.');
                    resolve(false);
                    return;
                }
                
                // 먼저 해당 연도의 기존 공휴일을 모두 삭제 (초기화)
                await window.api.holidays.deleteByYear(year);
                
                // 공휴일 데이터 준비
                const holidaysToSave = holidays.map(holiday => ({
                    year: parseInt(year),
                    month: holiday.month,
                    day: holiday.day,
                    name: holiday.name
                }));
                
                // 일괄 저장 API 호출
                const result = await window.api.holidays.batchCreate(holidaysToSave);
                
                console.log(`DB 저장 결과: 성공 ${result.data.successCount}개, 실패 ${result.data.failedCount}개`);
                
                // 실패한 항목이 있다면 경고 표시
                if (result.data.failedCount > 0) {
                    console.warn('일부 공휴일 저장 실패:', result.data.failedItems);
                }
                
                resolve(result.data.successCount > 0);
            } catch (error) {
                console.error('DB 저장 중 오류 발생:', error);
                reject(error);
            }
        });
    }
}; 
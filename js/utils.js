/**
 * 유틸리티 모듈
 * 앱 전체에서 사용하는 공통 유틸리티 함수 제공
 */
const Utils = {
    // 날짜 관련 유틸리티
    date: {
        // 주어진 날짜가 공휴일인지 확인
        isHoliday(date, holidays) {
            const year = date.getFullYear().toString();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            // 해당 년도의 공휴일 목록이 있는지 확인
            if (holidays[year]) {
                // 해당 날짜가 공휴일인지 확인
                return holidays[year].some(holiday => 
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
        getNextBusinessDay(date, holidays) {
            let nextDay = new Date(date);
            
            do {
                nextDay.setDate(nextDay.getDate() + 1);
            } while (this.isWeekend(nextDay) || this.isHoliday(nextDay, holidays));
            
            return nextDay;
        },
        
        // 두 날짜 비교 (정렬용)
        compareDates(a, b) {
            return a.getTime() - b.getTime();
        },
        
        // YYYY-MM-DD 형식의 문자열을 Date 객체로 변환
        parseDate(dateString) {
            const parts = dateString.split('-');
            // Date 객체는 월을 0부터 시작하므로 -1 필요
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        },
        
        // Date 객체를 YYYY-MM-DD 형식 문자열로 변환
        formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
        
        // Date 객체를 YYYY-MM 형식 문자열로 변환
        formatYearMonth(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
        },
        
        // 현재 날짜가 주어진 기간 내에 있는지 확인
        isDateInRange(date, startDate, endDate) {
            if (!startDate) return false;
            
            const currentYearMonth = this.formatYearMonth(date);
            
            if (currentYearMonth < startDate) return false;
            if (endDate && currentYearMonth > endDate) return false;
            
            return true;
        }
    },
    
    // 숫자 포맷팅 유틸리티
    number: {
        // 숫자를 천 단위 구분자가 있는 문자열로 포맷팅
        formatCurrency(value) {
            return value.toLocaleString() + '원';
        },
        
        // 퍼센트 포맷팅
        formatPercent(value, decimal = 1) {
            return value.toFixed(decimal) + '%';
        }
    },
    
    // DOM 관련 유틸리티
    dom: {
        // 새 DOM 요소 생성
        createElement(tag, className, innerHTML) {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (innerHTML) element.innerHTML = innerHTML;
            return element;
        },
        
        // 요소 내용 모두 지우기
        clearElement(element) {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
        }
    },
    
    // 기타 유틸리티
    common: {
        // 깊은 복사
        deepClone(obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        
        // 객체 배열에서 특정 속성 값을 가진 객체 찾기
        findByProperty(array, property, value) {
            return array.find(item => item[property] === value);
        },
        
        // 객체 배열에서 특정 속성 값이 일치하는 첫 번째 객체의 인덱스 찾기
        findIndexByProperty(array, property, value) {
            return array.findIndex(item => item[property] === value);
        },
        
        // 배열에서 특정 속성을 기준으로 그룹화
        groupByProperty(array, property) {
            return array.reduce((grouped, item) => {
                const key = item[property] || 'undefined';
                
                if (!grouped[key]) {
                    grouped[key] = [];
                }
                
                grouped[key].push(item);
                return grouped;
            }, {});
        },
        
        // UUID 생성 (간단한 버전)
        generateId() {
            return 'id-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
        }
    }
}; 
# UI 리팩토링 구현 계획: 캘린더 기반 뷰

## 요구사항 정리

| 위치 | 현재 | 목표 |
|---|---|---|
| **홈 피드 Shorts 선반** | MiniWidget (리스트 3개) | **주간 캘린더** (월~일, 일정 도트 표시) |
| **Schedule 클릭 시** | 풀스크린 오버레이 (전체 덮음) | **월간 캘린더** (YouTube 사이드바 유지, 콘텐츠 영역만 대체) |
| **일정 상세** | 일간 TimelineView | 월간 그리드에서 날짜 클릭 → 일간 상세 패널 |

## 단계별 구현 순서

### Phase 1: 기반 (유틸 + 스토어 + 리포지토리) — 1일
1. `src/utils/calendar-utils.ts` — 주간/월간 날짜 계산 함수
2. `src/storage/schedule-repository.ts` — 날짜 범위 일괄 조회 추가
3. `src/stores/schedule-store.ts` — 다중 날짜 상태 + 액션 추가

### Phase 2: 캘린더 컴포넌트 (순수 UI) — 2~3일
4. `src/components/calendar/MonthNavigator.tsx` — 월 이동 헤더
5. `src/components/calendar/MonthDayCell.tsx` — 개별 날짜 셀
6. `src/components/calendar/MonthGrid.tsx` — 7열 그리드
7. `src/components/calendar/DailyDetailPanel.tsx` — 일간 상세 (TimelineView 래핑)
8. `src/components/calendar/MonthlyCalendar.tsx` — 월간 뷰 오케스트레이터
9. `src/components/calendar/WeeklyCalendar.tsx` — 홈 피드용 주간 스트립

### Phase 3: 인라인 주입 (YouTube 통합) — 1일
10. `src/content/utils/youtube-selectors.ts` — PRIMARY_CONTENT 셀렉터 추가
11. `src/content/injectors/scheduler-inline-injector.ts` — 콘텐츠 영역 내 Shadow DOM

### Phase 4: 연결 (전체 와이어링) — 1~2일
12. `src/components/widget/MiniWidget.tsx` — WeeklyCalendar 연결
13. `src/components/widget/InlineScheduler.tsx` — MonthlyCalendar + Modal 래퍼
14. `src/content/index.tsx` — inline injector로 전환

### Phase 5: 폴리시 — 1~2일
15. YouTube 디자인 통합 (Roboto 폰트, html[dark] 다크모드, YouTube 색상 톤)

## 새로 만들 파일 (9개)

| 파일 | 역할 | 예상 줄수 |
|---|---|---|
| `src/components/calendar/WeeklyCalendar.tsx` | 홈 피드용 주간 스트립 | ~150 |
| `src/components/calendar/MonthlyCalendar.tsx` | 월간 뷰 오케스트레이터 | ~200 |
| `src/components/calendar/MonthGrid.tsx` | 7×5/6 그리드 레이아웃 | ~120 |
| `src/components/calendar/MonthDayCell.tsx` | 개별 날짜 셀 (숫자 + 일정 도트) | ~100 |
| `src/components/calendar/MonthNavigator.tsx` | 월 이동 네비게이터 | ~80 |
| `src/components/calendar/DailyDetailPanel.tsx` | 날짜 클릭 → 일간 상세 | ~120 |
| `src/content/injectors/scheduler-inline-injector.ts` | YouTube 콘텐츠 영역 내 Shadow DOM | ~130 |
| `src/utils/calendar-utils.ts` | 주간/월간 날짜 생성 유틸 | ~100 |
| `src/hooks/useCalendarSchedules.ts` | 날짜 범위 일정 일괄 로딩 훅 | ~80 |

## 수정할 파일 (5개)

| 파일 | 변경 내용 |
|---|---|
| `schedule-store.ts` | monthSchedules, weekSchedules, 월 탐색 액션 추가 |
| `schedule-repository.ts` | getSchedulesByDateRange() 일괄 조회 추가 |
| `date-utils.ts` | getWeekDates, getMonthDates, addMonths 등 추가 |
| `MiniWidget.tsx` | ScheduleList → WeeklyCalendar 교체 |
| `content/index.tsx` | overlay → inline injector 전환 |

## 리스크

| 수준 | 리스크 | 대응 |
|---|---|---|
| HIGH | YouTube #primary DOM 구조 변경 가능 | 셀렉터 폴백 전략 |
| HIGH | 월간 일괄 조회 성능 (28~42일) | chrome.storage.sync.get 멀티키 배치 |
| MEDIUM | Shadow DOM이 YouTube flexbox 안에서 크기 조정 | 다양한 뷰포트/사이드바 테스트 |
| LOW | 하위 호환성 | 기존 overlay injector 폴백 유지 |

## 상태

- [x] 계획 수립 완료
- [ ] Phase 1: 기반
- [ ] Phase 2: 캘린더 컴포넌트
- [ ] Phase 3: 인라인 주입
- [ ] Phase 4: 연결
- [ ] Phase 5: 폴리시

/**
 * Korean locale strings
 */
export const ko = {
  // Common actions
  common: {
    cancel: '취소',
    delete: '삭제',
    save: '저장',
    add: '추가',
    edit: '편집',
    close: '닫기',
    today: '오늘',
    retry: '다시 시도',
    viewAll: '전체 보기',
    disconnect: '연결 해제',
    sync: '동기화',
    syncing: '동기화 중...',
  },

  // Aria labels
  aria: {
    closePanel: '패널 닫기',
    closeForm: '폼 닫기',
    prevMonth: '이전 달',
    nextMonth: '다음 달',
    prevWeek: '이전 주',
    nextWeek: '다음 주',
    prevDate: '이전 날짜',
    nextDate: '다음 날짜',
    closeModal: '닫기',
    backToYouTube: 'YouTube로 돌아가기',
    connectGoogle: 'Google 캘린더 연결',
    syncGoogle: 'Google 캘린더 동기화',
    disconnectGoogle: 'Google 캘린더 연결 해제',
    scheduleCount: (date: string, count: number) => `${date}에 일정 ${count}개`,
    markComplete: '완료로 표시',
    markIncomplete: '미완료로 표시',
  },

  // Schedule
  schedule: {
    addSchedule: '+ 일정 추가',
    addScheduleShort: '일정 추가',
    noSchedules: '일정 없음',
    noSchedulesToday: '오늘 일정 없음',
    noSchedulesThisWeek: '이번 주 일정 없음',
    addPrompt: '+를 눌러 추가하세요',
    titlePlaceholder: '제목 추가',
    descriptionLabel: '설명 (선택)',
    descriptionPlaceholder: '메모 추가',
    startLabel: '시작',
    endLabel: '종료',
    calendarLabel: '캘린더',
    repeatLabel: '반복',
    colorLabel: '색상',
    newSchedule: '새 일정',
    editSchedule: '일정 편집',
    deleteSchedule: '일정 삭제',
    noTitle: '(제목 없음)',
    moreCount: (n: number) => `+${n}개 더`,
    scheduleCount: (n: number) => `일정 ${n}개`,
    editFailed: (msg: string) => `편집 실패: ${msg}`,
    defaultCalendar: '개인 (기본)',
    calendarDefaultBadge: '기본',
    openInYouTube: 'YouTube에서 스케줄러 열기 →',
  },

  // Recurrence
  recurrence: {
    none: '안 함',
    daily: '매일',
    weekly: '매주',
    monthly: '매월',
    yearly: '매년 (생일/기념일)',
    labelDaily: '매일',
    labelWeekly: '매주',
    labelMonthly: '매월',
    labelYearly: '매년',
    recurring: '반복',
  },

  // Recurring delete dialog
  recurringDelete: {
    title: '반복 일정 삭제',
    thisOnly: '이 일정',
    thisOnlyDesc: '이 일정만 삭제',
    thisAndFuture: '이 일정 및 이후 일정',
    thisAndFutureDesc: '이 일정과 이후 모든 일정을 삭제하고, 이전 기록은 유지',
    allEvents: '모든 일정',
    allEventsDesc: '모든 과거 및 미래 일정 삭제',
  },

  // Calendar navigation
  calendar: {
    backToYouTube: 'YouTube로 돌아가기',
    connectGoogle: 'Google 캘린더 연결',
    thisWeekSchedules: '이번 주 일정',
    weekHighlights: '주간 하이라이트',
    openCalendar: '캘린더 →',
    viewAllSchedules: '전체 일정 보기',
    weekLabel: (month: number, week: number) => `${month}월 ${week}주차`,
  },

  // Widget
  widget: {
    todaySchedules: '오늘의 일정',
    noSchedulesToday: '오늘 일정 없음',
    weekHighlights: '주간 하이라이트',
    thisWeek: '이번 주 일정',
  },

  // Time
  time: {
    am: '오전',
    pm: '오후',
    weekdays: ['월', '화', '수', '목', '금', '토', '일'] as const,
    weekdaysShort: ['일', '월', '화', '수', '목', '금', '토'] as const,
    today: '오늘',
    formatMonthYear: (year: number, month: number) => `${year}년 ${String(month).padStart(2, '0')}월`,
    formatWeekLabel: (month: number, week: number) => `${month}월 ${week}주차`,
    formatDayLabel: (month: number, day: number, dayOfWeek: string) => `${month}월 ${day}일 (${dayOfWeek})`,
  },

  // Errors
  error: {
    general: '오류가 발생했습니다',
    temporary: '일시적인 오류가 발생했습니다.',
    tokenFailed: '토큰 가져오기 실패',
    googleConnectFailed: 'Google 연결 실패',
    googleSyncFailed: 'Google 동기화 실패',
    apiError: (status: number) => `Google Calendar API 오류: ${status}`,
    fetchFailed: (status: number) => `이벤트 가져오기 실패: ${status}`,
    createFailed: (status: number) => `이벤트 생성 실패: ${status}`,
    updateFailed: (status: number) => `이벤트 수정 실패: ${status}`,
    deleteFailed: (status: number) => `이벤트 삭제 실패: ${status}`,
    calendarListFailed: (status: number) => `캘린더 목록 가져오기 실패: ${status}`,
    scheduleNotFound: '일정을 찾을 수 없습니다',
    rruleNotFound: '상위 이벤트의 반복 규칙(RRULE)을 찾을 수 없습니다',
  },

  // Validation
  validation: {
    timeFormat: 'HH:mm 형식이어야 합니다',
    dateFormat: 'YYYY-MM-DD 형식이어야 합니다',
    titleRequired: '제목을 입력해주세요',
    titleMaxLength: '제목은 100자 이하여야 합니다',
    descriptionMaxLength: '설명은 500자 이하여야 합니다',
    startBeforeEnd: '시작 시간은 종료 시간보다 이전이어야 합니다',
  },
} as const

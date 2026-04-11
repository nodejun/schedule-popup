/**
 * English locale strings
 */
export const en = {
  // Common actions
  common: {
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    add: 'Add',
    edit: 'Edit',
    close: 'Close',
    today: 'Today',
    retry: 'Try Again',
    viewAll: 'View All',
    disconnect: 'Disconnect',
    sync: 'Sync',
    syncing: 'Syncing...',
  },

  // Aria labels
  aria: {
    closePanel: 'Close panel',
    closeForm: 'Close form',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    prevWeek: 'Previous week',
    nextWeek: 'Next week',
    prevDate: 'Previous date',
    nextDate: 'Next date',
    closeModal: 'Close',
    backToYouTube: 'Back to YouTube',
    connectGoogle: 'Connect Google Calendar',
    syncGoogle: 'Sync Google Calendar',
    disconnectGoogle: 'Disconnect Google Calendar',
    scheduleCount: (date: string, count: number) => `${count} schedule(s) on ${date}`,
    markComplete: 'Mark as complete',
    markIncomplete: 'Mark as incomplete',
  },

  // Schedule
  schedule: {
    addSchedule: '+ Add Schedule',
    addScheduleShort: 'Add Schedule',
    noSchedules: 'No schedules',
    noSchedulesToday: 'No schedules today',
    noSchedulesThisWeek: 'No schedules this week',
    addPrompt: 'Press + to add one',
    titlePlaceholder: 'Add title',
    descriptionLabel: 'Description (optional)',
    descriptionPlaceholder: 'Add a note',
    startLabel: 'Start',
    endLabel: 'End',
    calendarLabel: 'Calendar',
    repeatLabel: 'Repeat',
    colorLabel: 'Color',
    newSchedule: 'New Schedule',
    editSchedule: 'Edit Schedule',
    deleteSchedule: 'Delete Schedule',
    noTitle: '(No title)',
    moreCount: (n: number) => `+${n} more`,
    scheduleCount: (n: number) => `${n} schedule(s)`,
    editFailed: (msg: string) => `Edit failed: ${msg}`,
    defaultCalendar: 'Personal (default)',
    calendarDefaultBadge: 'default',
    openInYouTube: 'Open Scheduler in YouTube →',
  },

  // Recurrence
  recurrence: {
    none: 'None',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly (Birthday/Anniversary)',
    labelDaily: 'Daily',
    labelWeekly: 'Weekly',
    labelMonthly: 'Monthly',
    labelYearly: 'Yearly',
    recurring: 'Recurring',
  },

  // Recurring delete dialog
  recurringDelete: {
    title: 'Delete Recurring Event',
    thisOnly: 'This event',
    thisOnlyDesc: 'Delete only this occurrence',
    thisAndFuture: 'This and following events',
    thisAndFutureDesc: 'Delete this and all future occurrences, keep past records',
    allEvents: 'All events',
    allEventsDesc: 'Delete all past and future occurrences',
  },

  // Calendar navigation
  calendar: {
    backToYouTube: 'Back to YouTube',
    connectGoogle: 'Connect Google Calendar',
    thisWeekSchedules: "This Week's Schedules",
    weekHighlights: 'Week Highlights',
    openCalendar: 'Calendar →',
    viewAllSchedules: 'View All Schedules',
    weekLabel: (month: number, week: number) => `Week ${week} of ${month}`,
  },

  // Widget
  widget: {
    todaySchedules: "Today's Schedules",
    noSchedulesToday: 'No schedules today',
    weekHighlights: 'Week Highlights',
    thisWeek: "This Week's Schedules",
  },

  // Time
  time: {
    am: 'AM',
    pm: 'PM',
    weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const,
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const,
    today: 'Today',
    formatMonthYear: (year: number, month: number) => `${year}. ${String(month).padStart(2, '0')}`,
    formatWeekLabel: (month: number, week: number) => `Week ${week} of Month ${month}`,
    formatDayLabel: (month: number, day: number, dayOfWeek: string) => `${month}/${day} (${dayOfWeek})`,
  },

  // Errors
  error: {
    general: 'Something went wrong',
    temporary: 'A temporary error occurred.',
    tokenFailed: 'Failed to retrieve token',
    googleConnectFailed: 'Google connection failed',
    googleSyncFailed: 'Google sync failed',
    apiError: (status: number) => `Google Calendar API error: ${status}`,
    fetchFailed: (status: number) => `Failed to fetch events: ${status}`,
    createFailed: (status: number) => `Failed to create event: ${status}`,
    updateFailed: (status: number) => `Failed to update event: ${status}`,
    deleteFailed: (status: number) => `Failed to delete event: ${status}`,
    calendarListFailed: (status: number) => `Failed to fetch calendar list: ${status}`,
    scheduleNotFound: 'Schedule not found',
    rruleNotFound: 'Recurrence rule (RRULE) not found for parent event',
  },

  // Validation
  validation: {
    timeFormat: 'Must be in HH:mm format',
    dateFormat: 'Must be in YYYY-MM-DD format',
    titleRequired: 'Title is required',
    titleMaxLength: 'Title must be 100 characters or less',
    descriptionMaxLength: 'Description must be 500 characters or less',
    startBeforeEnd: 'Start time must be before end time',
  },
} as const

export type Translations = typeof en

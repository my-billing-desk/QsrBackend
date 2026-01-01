// India is UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get current time shifted to IST, used for extracting IST year/month/day
 */
function getNowIST() {
    const now = new Date();
    // Shift current UTC time by 5.5 hours so it represents IST visually in UTC methods
    return new Date(now.getTime() + IST_OFFSET_MS);
}

/**
 * Get today's date in YYYY-MM-DD format based on IST
 */
function getTodayIST() {
    const nowLocal = getNowIST();
    // toISOString on the shifted date will give us the IST date
    return nowLocal.toISOString().split('T')[0];
}

/**
 * Get the UTC Date object representing the start of the day (00:00:00) in IST
 * @param {Date|string} dateInput - The date to get the start of
 */
function getStartOfDayIST(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    // 1. Shift to IST
    const istDate = new Date(d.getTime() + IST_OFFSET_MS);
    // 2. Set to midnight in "IST shifted time"
    istDate.setUTCHours(0, 0, 0, 0);
    // 3. Shift back to UTC
    return new Date(istDate.getTime() - IST_OFFSET_MS);
}

/**
 * Get the UTC Date object representing the end of the day (23:59:59) in IST
 * @param {Date|string} dateInput - The date to get the end of
 */
function getEndOfDayIST(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    // 1. Shift to IST
    const istDate = new Date(d.getTime() + IST_OFFSET_MS);
    // 2. Set to end of day in "IST shifted time"
    istDate.setUTCHours(23, 59, 59, 999);
    // 3. Shift back to UTC
    return new Date(istDate.getTime() - IST_OFFSET_MS);
}

module.exports = {
    getNowIST,
    getTodayIST,
    getStartOfDayIST,
    getEndOfDayIST
};

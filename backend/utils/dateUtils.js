const getISTDate = () => {
    const now = new Date();
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
    return new Date(utc + istOffset);
};

const getTodayStr = () => {
    const istDate = getISTDate();
    return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
};

const getMonthPrefix = (date = getISTDate()) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

module.exports = { getISTDate, getTodayStr, getMonthPrefix };

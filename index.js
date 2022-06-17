// used to fetch data from the api
import moment from 'moment';
import fetch from 'node-fetch';
import fs from 'fs';

// get the third argument from the command line
const arg = process.argv?.[2] || null;

// commissions for each user
const cashInCommission = {
    percents: 0.03,
    max: {
        amount: 5,
        currency: 'EUR',
    },
};
const cashOutCommissionNatural = {
    percents: 0.3,
    week_limit: {
        amount: 1000,
        currency: 'EUR',
    },
};

const cashOutCommissionJuridical = {
    percents: 0.3,
    min: {
        amount: 0.5,
        currency: 'EUR',
    },
};

// Check if the data is is an array and
const isNonEmptyArray = (data) => Array.isArray(data) && (data.length > 0);

// Check if the data has correct data structure
const isValidJSON = (data) => ['date', 'user_id', 'user_type', 'type', 'operation'].every((x) => x in data[0]);

// Get the start day of the week
const getStartOfTheWeek = (date) => moment(date).startOf('isoWeek').format('YYYY-MM-DD');

// Get all cash-outs for a specific natural user
const getAllCashOutsThisWeekForNaturalUsers = (data, userId, today, weekStart) => data.filter((item) => item.date >= weekStart && item.date <= today && item.user_id === userId && item.type === 'cash_out' && item.user_type === 'natural');

// Calculate the cash-out commission for each natural user
const getCommissionAfterDecuction = (totalAmount, todaysAmount, commission) => {
    if (totalAmount > commission.week_limit.amount) {
        if (todaysAmount > commission.week_limit.amount) {
            return ((todaysAmount - commission.week_limit.amount) * (commission.percents / 100)).toFixed(2);
        }
        return (todaysAmount * (commission.percents / 100)).toFixed(2);
    }
    return 0.00;
};

// Calculate the cash-out commission for each natural
const totalCashOutCommissionPerWeekPerNaturalUser = (data, userId, todaysAmount, commission, today) => {
    const weekStart = getStartOfTheWeek(today);
    const allCashoutsThisWeekForNaturalUsers = getAllCashOutsThisWeekForNaturalUsers(data, userId, today, weekStart);
    const totalAmount = allCashoutsThisWeekForNaturalUsers.reduce((acc, item) => acc + item.operation.amount, 0);
    const commissionAfterDecuction = getCommissionAfterDecuction(totalAmount, todaysAmount, commission);
    return commissionAfterDecuction;
};

// Get the data from a local JSON file or from the API
const responseFromApi = async (_arg) => {
    if (_arg.includes('.json')) {
        if (fs.existsSync(_arg)) {
            return JSON.parse(fs.readFileSync(_arg, 'utf8'));
        }
        return 'File does not exist!';
    }
    return fetch(_arg).then((data) => data?.json() || null).catch(() => {
        process.stdout.write('1.Please provide a valid path with valid data!!');
    });
};

const getCommission = (type, userType) => {
    if (type === 'cash_in') {
        return cashInCommission;
    }
    if (userType === 'natural') {
        return cashOutCommissionNatural;
    }
    return cashOutCommissionJuridical;
};

const getValidCommissionAmount = (type, userType, comissionAmount, totalCashOut, maxAmount, minAmount) => {
    if (type === 'cash_in') {
        return comissionAmount < maxAmount ? comissionAmount : maxAmount;
    }
    if (userType === 'natural') {
        return +totalCashOut > 0 ? +totalCashOut : 0;
    }
    return comissionAmount > minAmount ? comissionAmount : minAmount;
};

const calculateValidCommissionAmount = (validData) => validData?.map((item) => {
    const {
        date, user_id: userId, user_type: userType, type, operation,
    } = item;
    const { amount } = operation;
    const commission = getCommission(type, userType);
    const { percents, max, min } = commission;
    const comissionAmount = amount * (percents / 100);
    const maxAmount = max ? max.amount : 0;
    const minAmount = min ? min.amount : 0;

    // only for natural users and cash-out
    const totalCashOutCurrentWeekPerNaturalUser = totalCashOutCommissionPerWeekPerNaturalUser(validData, userId, amount, cashOutCommissionNatural, date);

    // Calculate the commission for each user
    const validCommissionAmount = getValidCommissionAmount(type, userType, comissionAmount, totalCashOutCurrentWeekPerNaturalUser, maxAmount, minAmount);

    // Return the rounded commission per user
    return validCommissionAmount.toFixed(2);
});

// Check if a path to the input file is provided
if (arg) {
    const data = await responseFromApi(arg) || null;

    if (!data) process.exit(1);

    // Check if the data is useful and has correct data structure to calculate the commission
    const validData = isNonEmptyArray(data) && isValidJSON(data) ? data : null;
    if (validData) {
        const validCommissionAmount = calculateValidCommissionAmount(validData) || null;

        // Write the validCommissionAmount if there is any
        if (validCommissionAmount) {
            process.stdout.write(validCommissionAmount.join('\n'));
        } else {
            process.stdout.write('2.No data found');
        }
    } else {
        process.stdout.write('3.Please provide a valid path with valid data!!');
    }
} else {
    process.stdout.write('5.Please provide a path to the data input file!!');
}

export {
    isNonEmptyArray,
    isValidJSON,
    getStartOfTheWeek,
    getAllCashOutsThisWeekForNaturalUsers,
    getCommissionAfterDecuction,
    totalCashOutCommissionPerWeekPerNaturalUser,
    calculateValidCommissionAmount,
    getValidCommissionAmount,
    getCommission,
    responseFromApi,
};

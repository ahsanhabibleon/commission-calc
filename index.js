//used to fetch data from the api
import moment from 'moment';
import fetch from 'node-fetch';
import fs from 'fs';

//get the third argument from the command line
const arg = process.argv?.[2] || null;

//commissions for each user
const cash_in_comission = {
    "percents": 0.03,
    "max": {
        "amount": 5,
        "currency": "EUR"
    }
}
const cash_out_comission__natural = {
    "percents": 0.3,
    "week_limit": {
        "amount": 1000,
        "currency": "EUR"
    }
}

const cash_out_comission__juridical = {
    "percents": 0.3,
    "min": {
        "amount": 0.5,
        "currency": "EUR"
    }
}

//Check if the data is is an array and
const isNonEmptyArray = (data) => Array.isArray(data) && (data.length > 0);

//Check if the data has correct data structure
const isValidJSON = (data) => ['date', 'user_id', 'user_type', 'type', 'operation'].every(function (x) { return x in data[0] });

//Get the start day of the week
const getStartOfTheWeek = (date) => {
    return moment(date).startOf('isoWeek').format('YYYY-MM-DD');
}

// Get all cash-outs for a specific natural user
const getAllCashOutsThisWeekForNaturalUsers = (data, userId, today, weekStart) => {
    return data.filter(item => item.date >= weekStart && item.date <= today && item.user_id === userId && item.type === 'cash_out' && item.user_type === 'natural');
}

//Calculate the cash-out commission for each natural user
const getCommissionAfterDecuction = (totalAmount, todaysAmount, commission) => {
    if (totalAmount > commission.week_limit.amount) {
        if (todaysAmount > commission.week_limit.amount) {
            return ((todaysAmount - commission.week_limit.amount) * (commission.percents / 100)).toFixed(2)
        } else {
            return (todaysAmount * (commission.percents / 100)).toFixed(2)
        }
    } else {
        return 0.00
    }
}

//Calculate the cash-out commission for each natural
const totalCashOutAmountPerWeekPerNaturalUser = (data, userId, todaysAmount, commission, today) => {
    const weekStart = getStartOfTheWeek(today);
    const allCashoutsThisWeekForNaturalUsers = getAllCashOutsThisWeekForNaturalUsers(data, userId, today, weekStart);
    const totalAmount = allCashoutsThisWeekForNaturalUsers.reduce((acc, item) => acc + item.operation.amount, 0);
    const commissionAfterDecuction = getCommissionAfterDecuction(totalAmount, todaysAmount, commission);
    return commissionAfterDecuction;
}

//Get the data from a local JSON file or from the API
const responseFromApi = async (arg) => arg.includes('.json') ? (fs.existsSync(arg) ? JSON.parse(fs.readFileSync(arg, 'utf8')) : 'File does not exist!') : await fetch(arg).catch(err => {
    process.stdout.write('1.Please provide a valid path!!');
    return null;
}).then(data => data?.json() || null);

const getValidCommissionAmount = (validData) => {
    return validData?.map(item => {

        const { date, user_id, user_type, type, operation } = item;
        const { amount } = operation;
        const comission = type === 'cash_in' ? cash_in_comission : (user_type === 'natural' ? cash_out_comission__natural : cash_out_comission__juridical);
        const { percents, max, min } = comission;
        const comissionAmount = amount * (percents / 100);
        const maxAmount = max ? max.amount : 0;
        const minAmount = min ? min.amount : 0;

        //only for natural users and cash-out
        const totalCashOutCurrentWeekPerNaturalUser = totalCashOutAmountPerWeekPerNaturalUser(validData, user_id, amount, cash_out_comission__natural, date);

        //Calculate the commission for each user
        const validCommissionAmount = type === 'cash_in' ? (comissionAmount < maxAmount ? comissionAmount : maxAmount) : (user_type === 'natural' ? (+totalCashOutCurrentWeekPerNaturalUser > 0 ? +totalCashOutCurrentWeekPerNaturalUser : 0) : (comissionAmount > minAmount ? comissionAmount : minAmount));

        //Return the rounded commission per user
        return validCommissionAmount.toFixed(2);
    })
}

//Check if a path to the input file is provided
if (arg) {
    const data = await responseFromApi(arg) || null;

    !data && process.exit(1);

    //Check if the data is useful and has correct data structure to calculate the commission
    const validData = isNonEmptyArray(data) && isValidJSON(data) ? data : null;
    if (validData) {
        const result = getValidCommissionAmount(validData) || null

        //Write the result if there is any
        result ? process.stdout.write(result.join('\n')) : process.stdout.write('2.No data found');
    } else {
        process.stdout.write('3.Please provide a valid path!!');
    }

} else {
    process.stdout.write('5.Please provide a path to the data input file!!');
}
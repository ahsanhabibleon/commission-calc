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

//Calculate the cash-out commission for each natural
const totalCashOutAmountPerWeekPerNaturalUser = (data, userId, todaysAmount, commission, today) => {
    const weekStart = moment(today).startOf('isoWeek').format('YYYY-MM-DD');
    const week = data.filter(item => item.date >= weekStart && item.date <= today && item.user_id === userId && item.type === 'cash_out' && item.user_type === 'natural');
    const totalAmount = week.reduce((acc, item) => acc + item.operation.amount, 0);
    let commissionAfterDecuction = 0;
    if (totalAmount > commission.week_limit.amount) {
        if (todaysAmount > commission.week_limit.amount) {
            commissionAfterDecuction = ((todaysAmount - commission.week_limit.amount) * (commission.percents / 100)).toFixed(2)
        } else {
            commissionAfterDecuction = (todaysAmount * (commission.percents / 100)).toFixed(2)
        }
    } else {
        commissionAfterDecuction = 0;
    }
    return commissionAfterDecuction;
}

//Check if a path to the input file is provided
if (arg) {

    //Get the data from a local JSON file or from the API
    const responseFromApi = arg.includes('.json') ? (fs.existsSync(arg) ? JSON.parse(fs.readFileSync(arg, 'utf8')) : 'File does not exist!') : await fetch(arg).catch(err => {
        process.stdout.write('1.Please provide a valid path!!');
        return null;
    }).then(data => data?.json() || null);

    !responseFromApi && process.exit(1);

    const data = await responseFromApi || null;

    //Check if the data is useful and has correct data structure to calculate the commission
    const validData = isNonEmptyArray(data) && isValidJSON(data) ? data : null;
    if (validData) {
        const result = validData?.map(item => {

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

        }) || null

        //Write the result if there is any
        result ? process.stdout.write(result.join('\n')) : process.stdout.write('2.No data found');
    } else {
        process.stdout.write('3.Please provide a valid path!!');
    }

} else {
    process.stdout.write('5.Please provide a path to the data input file!!');
}
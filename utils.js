import moment from 'moment';
import fs from 'fs';
import fetch from 'node-fetch';

// Get the data from a local JSON file or from the API
export const responseFromApi = async (_arg) => {
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

// Check if the data is is an array and
export const isNonEmptyArray = (data) => Array.isArray(data) && (data.length > 0);

// Check if the data has correct data structure
export const isValidJSON = (data) => ['date', 'user_id', 'user_type', 'type', 'operation'].every((x) => x in data[0]);

// Get the start day of the week
export const getStartOfTheWeek = (date) => moment(date).startOf('isoWeek').format('YYYY-MM-DD');

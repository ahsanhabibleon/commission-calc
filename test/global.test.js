// Importing mocha and chai
import { describe, it } from 'mocha';
import chai from 'chai';

import {
    getAllCashOutsThisWeekForNaturalUsers,
    getCommissionAfterDecuction,
    totalCashOutCommissionPerWeekPerNaturalUser,
    calculateValidCommissionAmount,
    getValidCommissionAmount,
    getCommission,
    responseFromApi,
} from '../index.js';
import { getStartOfTheWeek, isNonEmptyArray } from '../utils.js';

const { expect } = chai;

const data = [
    {
        date: '2016-01-05', user_id: 1, user_type: 'natural', type: 'cash_in', operation: { amount: 200.00, currency: 'EUR' },
    },
    {
        date: '2016-01-06', user_id: 2, user_type: 'juridical', type: 'cash_out', operation: { amount: 300.00, currency: 'EUR' },
    },
    {
        date: '2016-01-06', user_id: 1, user_type: 'natural', type: 'cash_out', operation: { amount: 30000, currency: 'EUR' },
    },
    {
        date: '2016-01-07', user_id: 1, user_type: 'natural', type: 'cash_out', operation: { amount: 1000.00, currency: 'EUR' },
    },

];

const fullData = [
    {
        date: '2016-01-05', user_id: 1, user_type: 'natural', type: 'cash_in', operation: { amount: 200.00, currency: 'EUR' },
    },
    {
        date: '2016-01-06', user_id: 2, user_type: 'juridical', type: 'cash_out', operation: { amount: 300.00, currency: 'EUR' },
    },
    {
        date: '2016-01-06', user_id: 1, user_type: 'natural', type: 'cash_out', operation: { amount: 30000, currency: 'EUR' },
    },
    {
        date: '2016-01-07', user_id: 1, user_type: 'natural', type: 'cash_out', operation: { amount: 1000.00, currency: 'EUR' },
    },
    {
        date: '2016-01-07', user_id: 1, user_type: 'natural', type: 'cash_out', operation: { amount: 100.00, currency: 'EUR' },
    },
    {
        date: '2016-01-10', user_id: 1, user_type: 'natural', type: 'cash_out', operation: { amount: 100.00, currency: 'EUR' },
    },
    {
        date: '2016-01-10', user_id: 2, user_type: 'juridical', type: 'cash_in', operation: { amount: 1000000.00, currency: 'EUR' },
    },
    {
        date: '2016-01-10', user_id: 3, user_type: 'natural', type: 'cash_out', operation: { amount: 1000.00, currency: 'EUR' },
    },
    {
        date: '2016-02-15', user_id: 1, user_type: 'natural', type: 'cash_out', operation: { amount: 300.00, currency: 'EUR' },
    },
];

const cashOutCommissionNatural = {
    percents: 0.3,
    week_limit: {
        amount: 1000,
        currency: 'EUR',
    },
};

// Group of tests using describe
describe('commission calculation', () => {
    // We will describe each single test using it
    it('expect to be a non-empty array', () => {
        const result = isNonEmptyArray(['a', 'b', 'c']);
        expect(result).to.equal(true);

        const result2 = isNonEmptyArray([]);
        expect(result2).to.equal(false);

        const result3 = isNonEmptyArray({});
        expect(result3).to.equal(false);

        const result4 = isNonEmptyArray('string');
        expect(result4).to.equal(false);
    });

    it('expect to get the start of the week', () => {
        const today = '2022-06-18';
        const weekStart = getStartOfTheWeek(today);
        expect(weekStart).to.equal('2022-06-13');
    });

    it('expect to get all cash-outs for a specific natural user', () => {
        const today = '2016-01-07';
        const weekStart = getStartOfTheWeek(today);
        const result = getAllCashOutsThisWeekForNaturalUsers(data, 1, today, weekStart);
        expect(result).to.deep.equal(
            [
                {
                    date: '2016-01-06',
                    user_id: 1,
                    user_type: 'natural',
                    type: 'cash_out',
                    operation: { amount: 30000, currency: 'EUR' },
                },
                {
                    date: '2016-01-07',
                    user_id: 1,
                    user_type: 'natural',
                    type: 'cash_out',
                    operation: { amount: 1000, currency: 'EUR' },
                },
            ],
        );
    });

    it('expect to get commission after deduction', () => {
        const result = +getCommissionAfterDecuction(3490, 2200, cashOutCommissionNatural);
        expect(result).to.equal(3.6);
    });

    it('expect to get total cash-out amount per week per natural user', () => {
        const today = '2016-01-07';
        const result = +totalCashOutCommissionPerWeekPerNaturalUser(data, 1, 3490, cashOutCommissionNatural, today);
        expect(result).to.equal(7.47);
    });

    it('expect to calculate valid commission amount', () => {
        const result = calculateValidCommissionAmount(data);
        expect(result).to.deep.equal(['0.06', '0.90', '87.00', '3.00']);
    });

    it('expect to get valid commission amount', () => {
        const result = getValidCommissionAmount('case_out', 'natural', 90, 87.00, 0, 0);
        expect(result).to.equal(87);
    });

    it('expect to get commission', () => {
        const result = getCommission('case_out', 'natural');
        expect(result).to.deep.equal(cashOutCommissionNatural);
    });

    it('expect to get response from API', async () => {
        const result = await responseFromApi('data.json');
        expect(result).to.deep.equal(fullData);
    });
});

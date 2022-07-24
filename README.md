# commission-calc

## To `run` and `test` the project please follow the following steps:

1. Clone the project to your local machine (`git clone https://github.com/ahsanhabibleon/commission-calc.git`)
2. Enter the project directory, fetch the branches and checkout to master branch (`cd commission-calc && git fetch && git checkout master`)
3. Install the project in your local machine (`npm install`)
4. Run the project (`npm start PATH_TO_INPUT_FILE` or `node index.js PATH_TO_INPUT_FILE`)
5. Test the project (`npm test`)

# Problem to solve
=================

## Situation
Users can go to a branch to cash in and/or cash out from their account. There are also commission fees for both cash in and cash out. Only supported currency is EUR.

## Commission Fees

### For Cash In
Commission fee - 0.03% from total amount, but no more than 5.00 EUR.

### For Cash Out
There are different commission fees for cash out for natural and legal persons.

#### Natural Persons
Default commission fee - 0.3% from cash out amount.

1000.00 EUR per week (from monday to sunday) is free of charge.

If total cash out amount is exceeded - commission is calculated only from exceeded amount (that is, for 1000.00 EUR there is still no commission fee).

#### Legal persons
Commission fee - 0.3% from amount, but not less than 0.50 EUR for operation.


### Rounding
After calculating commission fee, it's rounded to the smallest currency item (for example, for EUR currency - cents) to upper bound (ceiled). For example, 0.023 EUR should be rounded to 3 Euro cents.

## Input data
Input data is given in JSON file. Performed operations are given in that file. In each object following data is provided:
```js
{
    "date": "2016-01-05", // operation date in format `Y-m-d`
    "user_id": 1, // user id, integer
    "user_type": "natural", // user type, one of “natural”(natural person) or “juridical”(legal person)
    "type": "cash_in", // operation type, one of “cash_in” or “cash_out”
    "operation": {
        "amount": 200, // operation amount(for example `2.12` or `3`)
        "currency": "EUR" // operation currency `EUR`
    }
}
```
All operations are ordered by their date ascendingly.

## Expected Result
As a single argument program must accept a path to the input file.

Program must output result to stdout.

Result - calculated commission fees for each operation. In each line only final calculated commission fee must be provided without currency.

Example Data
============
```
➜  cat input.json
[
    { "date": "2016-01-05", "user_id": 1, "user_type": "natural", "type": "cash_in", "operation": { "amount": 200.00, "currency": "EUR" } },
    { "date": "2016-01-06", "user_id": 2, "user_type": "juridical", "type": "cash_out", "operation": { "amount": 300.00, "currency": "EUR" } },
    { "date": "2016-01-06", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 30000, "currency": "EUR" } },
     { "date": "2016-01-07", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 1000.00, "currency": "EUR" } },
    { "date": "2016-01-07", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 100.00, "currency": "EUR" } },
    { "date": "2016-01-10", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 100.00, "currency": "EUR" } },
    { "date": "2016-01-10", "user_id": 2, "user_type": "juridical", "type": "cash_in", "operation": { "amount": 1000000.00, "currency": "EUR" } },
    { "date": "2016-01-10", "user_id": 3, "user_type": "natural", "type": "cash_out", "operation": { "amount": 1000.00, "currency": "EUR" } },
    { "date": "2016-02-15", "user_id": 1, "user_type": "natural", "type": "cash_out", "operation": { "amount": 300.00, "currency": "EUR" } },
]

➜  node app.js input.json
0.06
0.90
87.00
3.00
0.30
0.30
5.00
0.00
0.00
```

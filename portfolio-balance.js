#!/usr/bin/env node

const FILE_PATH = 'transactions.csv';

const yargs = require("yargs");
const fs = require("fs");
const {parse} = require("csv-parse");
const DataFrame = require('dataframe-js').DataFrame;
const request = require('request');

let transHistRows = [];
let transHistCol;
const transHistCol_TOKEN = 'token';
const transHistCol_TRANSACTION_TYPE = 'transaction_type';
const transHistCol_AMOUNT = 'amount';
const transHistCol_TIMESTAMP = 'timestamp';
const cryptocurrencyConverterBaseURL = 'https://min-api.cryptocompare.com/data/price';


// Configuring Command Line Input
const options = yargs
    .option("d", {alias: "date", describe: "Enter date: format dd/mm/yyy", type: "string"})
    .option("t", {alias: "token", describe: "Enter token: format XXX", type: "string"})
    .argv;


// get USD value for a particular crypto token via API call
const getUSDValueForParticularToken = (token, date, balance) => {
    let url = cryptocurrencyConverterBaseURL + '?fsym=' + token + '&tsyms=USD';
    request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            const obj = JSON.parse(body);
            if (date === '') {
                console.log("Portfolio Value for " + token + " is : $" + balance * obj["USD"] + "\n");
            } else {
                console.log("Portfolio Value for the token " + token + " in the " + date + " is : $" + balance * obj["USD"] + "\n");
            }
        }
    });
}


// Method to get the latest portfolio value for a given token input
const getLatestPortfolioForParticularToken = (df, token) => {
    let balance = 0;
    df.filter(row => row.get(transHistCol_TOKEN) === token)
        .cast(transHistCol_AMOUNT, Number)
        .map(row => {
            balance = row.get(transHistCol_TRANSACTION_TYPE) === "DEPOSIT" ?
                balance + row.get(transHistCol_AMOUNT) :
                balance - row.get(transHistCol_AMOUNT);
        });

    getUSDValueForParticularToken(token, '', balance);
}


// Method to get the portfolio value for a given date : format (yyyy-mm-dd)
const getPortfolioValueForParticularDate = (df, date) => {
    let initialEpochAtGMT = new Date(date + 'T00:00:00.000+00:00').getTime() / 1000;
    let finalEpochAtGMT = initialEpochAtGMT + 86400000;
    let tokenBalanceMap = new Map();
    let token;

    function predicateTheTimestamp(timestamp) {
        let intTimestamp = parseInt(timestamp);
        return intTimestamp > initialEpochAtGMT && intTimestamp < finalEpochAtGMT;
    }

    df.filter(row => predicateTheTimestamp(row.get(transHistCol_TIMESTAMP)))
        .cast(transHistCol_AMOUNT, Number)
        .map(row => {
            token = row.get(transHistCol_TOKEN);
            if (tokenBalanceMap.has(token)) {
                tokenBalanceMap.set(token, row.get(transHistCol_TRANSACTION_TYPE) === "DEPOSIT" ?
                    tokenBalanceMap.get(token) + row.get(transHistCol_AMOUNT) :
                    tokenBalanceMap.get(token) - row.get(transHistCol_AMOUNT));
            } else {
                tokenBalanceMap.set(token, row.get(transHistCol_TRANSACTION_TYPE) === "DEPOSIT" ?
                    row.get(transHistCol_AMOUNT) :
                    -Math.abs(row.get(transHistCol_AMOUNT)));
            }
        });

    tokenBalanceMap.forEach((value, key) => {
        getUSDValueForParticularToken(key, date, value);
    });
}


// Method to get the portfolio value for a particular token in a given date : format (yyyy-mm-dd)
const getPortfolioForParticularTokenInParticularDate = (df, date, token) => {
    let balance = 0;
    let initialEpochAtGMT = new Date(date + 'T00:00:00.000+00:00').getTime() / 1000;
    let finalEpochAtGMT = initialEpochAtGMT + 86400000;

    function predicateTheTimestamp(timestamp) {
        let intTimestamp = parseInt(timestamp);
        return intTimestamp > initialEpochAtGMT && intTimestamp < finalEpochAtGMT;
    }

    df.filter(row => row.get(transHistCol_TOKEN) === token)
        .filter(row => predicateTheTimestamp(row.get(transHistCol_TIMESTAMP)))
        .cast(transHistCol_AMOUNT, Number)
        .map(row => {
            balance = row.get(transHistCol_TRANSACTION_TYPE) === "DEPOSIT" ?
                balance + row.get(transHistCol_AMOUNT) :
                balance - row.get(transHistCol_AMOUNT);
        });

    getUSDValueForParticularToken(token, date, balance);
}


// Method to get the latest portfolio value for a given token input
const getLatestPortfolioForEveryToken = df => {
    let tokenBalanceMap = new Map();
    let token;

    df.cast(transHistCol_AMOUNT, Number)
        .map(row => {
            token = row.get(transHistCol_TOKEN);
            if (tokenBalanceMap.has(token)) {
                tokenBalanceMap.set(token, row.get(transHistCol_TRANSACTION_TYPE) === "DEPOSIT" ?
                    tokenBalanceMap.get(token) + row.get(transHistCol_AMOUNT) :
                    tokenBalanceMap.get(token) - row.get(transHistCol_AMOUNT));
            } else {
                tokenBalanceMap.set(token, row.get(transHistCol_TRANSACTION_TYPE) === "DEPOSIT" ?
                    row.get(transHistCol_AMOUNT) :
                    -Math.abs(row.get(transHistCol_AMOUNT)));
            }
        });

    tokenBalanceMap.forEach((value, key) => {
        getUSDValueForParticularToken(key, '', value);
    });
}


// Read csv file and process data using data frame
console.log("csv file loading started...\n");
fs.createReadStream(FILE_PATH)
    .pipe(parse({delimiter: ",", from_line: 1, to_line: 1}))
    .on("data", function (row) {
        transHistCol = row;
    })
    .on("end", function () {
        fs.createReadStream(FILE_PATH)
            .pipe(parse({delimiter: ",", from_line: 2}))
            .on("data", function (row) {
                transHistRows.push(row);
            })
            .on("end", function () {
                console.log("csv file loading finished...\n");
                let transactionHistoryDF = new DataFrame(transHistRows, transHistCol);

                // using predefined methods based on options (input argument)
                if (options.d && options.t) {
                    getPortfolioForParticularTokenInParticularDate(transactionHistoryDF, options.d, options.t);
                } else if (options.t) {
                    getLatestPortfolioForParticularToken(transactionHistoryDF, options.t);
                } else if (options.d) {
                    getPortfolioValueForParticularDate(transactionHistoryDF, options.d);
                } else {
                    getLatestPortfolioForEveryToken(transactionHistoryDF);
                }

            })
            .on("error", function (error) {
                console.log(error.message);
            });
    })
    .on("error", function (error) {
        console.log(error.message);
    });
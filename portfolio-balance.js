#!/usr/bin/env node

const FILE_PATH = 'transactions.csv';

const yargs = require("yargs");
const fs = require("fs");
const {parse} = require("csv-parse");
const row = require("dataframe-js/lib/row");
const DataFrame = require('dataframe-js').DataFrame;

let transHistRows = [];
let transHistCol;
const transHistCol_TOKEN = 'token';
const transHistCol_TRANSACTION_TYPE = 'transaction_type';
const transHistCol_AMOUNT = 'amount';


// Configuring Command Line Input
const options = yargs
    .option("d", {alias: "date", describe: "Enter date: format dd/mm/yyy", type: "string"})
    .option("t", {alias: "token", describe: "Enter token: format XXX", type: "string"})
    .argv;


// Method to get the latest portfolio balance for a given token input
const getLatestPortfolioForParticularToken = (df, token) => {
    let balance = 0;
    df.filter(row => row.get(transHistCol_TOKEN) === token)
        .cast(transHistCol_AMOUNT, Number)
        .map(row => {
            balance = row.get(transHistCol_TRANSACTION_TYPE) === "DEPOSIT" ?
                balance + row.get(transHistCol_AMOUNT) :
                balance - row.get(transHistCol_AMOUNT);
        });

    console.log("Latest Portfolio for " + token + " is : " + balance);
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
            .pipe(parse({delimiter: ",", from_line: 2, to_line: 1500}))
            .on("data", function (row) {
                transHistRows.push(row);
            })
            .on("end", function () {
                console.log("csv file loading finished...\n");
                let transactionHistoryDF = new DataFrame(transHistRows, transHistCol);

                // using predefined methods based on options (input argument)
                if (options.t) {
                    getLatestPortfolioForParticularToken(transactionHistoryDF, options.t);
                }

            })
            .on("error", function (error) {
                console.log(error.message);
            });
    })
    .on("error", function (error) {
        console.log(error.message);
    });




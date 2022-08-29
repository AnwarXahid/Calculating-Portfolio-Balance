#!/usr/bin/env node

const FILE_PATH = 'transactions.csv';

const yargs = require("yargs");
const fs = require("fs");
const {parse} = require("csv-parse");
const DataFrame = require('dataframe-js').DataFrame;

let transHistRows = [];
let transHistCol;


// Configuring Command Line Input
const options = yargs
    .option("d", {alias: "date", describe: "Enter date: format dd/mm/yyy", type: "string"})
    .option("t", {alias: "token", describe: "Enter token: format XXX", type: "string"})
    .argv;


// Read csv file and process data using data frame
console.log("csv file loading started...\n");
fs.createReadStream(FILE_PATH)
    .pipe(parse({delimiter: ",", from_line: 1, to_line: 1}))
    .on("data", function (row) {
        transHistCol = row;
    })
    .on("end", function () {
        fs.createReadStream(FILE_PATH)
            .pipe(parse({delimiter: ",", from_line: 2, to_line: 50}))
            .on("data", function (row) {
                transHistRows.push(row);
            })
            .on("end", function () {
                console.log("csv file loading finished...\n");
                let transactionHistoryDF = new DataFrame(transHistRows, transHistCol);

                // using predefined methods based on options (input argument)
                transactionHistoryDF.show(4);

            })
            .on("error", function (error) {
                console.log(error.message);
            });
    })
    .on("error", function (error) {
        console.log(error.message);
    });




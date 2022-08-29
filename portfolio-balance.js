#!/usr/bin/env node

// Configuring Command Line Input
const yargs = require("yargs");

const options = yargs
    .option("d", { alias: "date", describe: "Enter date: format dd/mm/yyy", type: "string" })
    .option("t", { alias: "token", describe: "Enter token: format XXX", type: "string" })
    .argv;


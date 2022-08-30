# Calculating Portfolio Value from the given CSV file data


## Problem set
You have given some transactions over a period of time which is logged in a [CSV file](https://s3-ap-southeast-1.amazonaws.com/static.propine.com/transactions.csv.zip). Write a command line program that does the following

- Given no parameters, return the latest portfolio value per token in USD
- Given a token, return the latest portfolio value for that token in USD
- Given a date, return the portfolio value per token in USD on that date
- Given a date and a token, return the portfolio value of that token in USD on that date

The CSV file has the following columns
- timestamp: Integer number of seconds since the Epoch
- transaction_type: Either a DEPOSIT or a WITHDRAWAL
- token: The token symbol
- amount: The amount transacted

Portfolio means the balance of the token where you need to add deposits and subtract withdrawals. You may obtain the exchange rates from [cryptocompare](https://min-api.cryptocompare.com/) where the API is free. You should write it in Node.js as our main stack is in Javascript/Typescript and we need to assess your proficiency.

## How to run the program
- clone the project
- run: npm install (for installing required node modules)
- run: node portfolio-balance.js --help (to see the options)
- run: node portfolio-balance.js -d 2019-10-25 -t ETH (for example)


## Some analysis on my code:
- I considered, the input would be just as program expects
- I've used dataframe for loading this huge csv file (almost 1 GB). But most of the dataframe implementations
in the javascript have some constraints. Among them, I've found dataframe-js is best for simple use. But it 
read csv as immutable string, and no os give such huge (1 GB) chunk of precious memory to a simple program. So, I
used a different method to load CSV
- I've assumed that the timestamps given in the csv file are in GMT.
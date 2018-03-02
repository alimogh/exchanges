/**
 * Coinsquare API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:coinsquare');
const config = require('../config');

const API_URL = 'https://coinsquare.io/api/v1';

const MARKETS = config.MARKETS;

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/data/quotes`;
    debug(`Getting markets list from url ${url}...`);

    request({
        uri: url,
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        if (!body) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt of body.quotes) {
            let [market, ticker] = [mt.base, mt.ticker];
            if (MARKETS.indexOf(market) === -1) {
                continue;
            }

            if (!markets[market]) {
                markets[market] = [];
            }

            counter += 1;
            markets[market].push(ticker);
        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    const marketTicker = market + ticker;
    const url = `${API_URL}/data/bookandsales/${ticker}/${market}/16`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o.prc),
            quantity: Number(o.amt)
        };
    };

    request({
        uri: url,
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        if (!body) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        // not sure if sales/book should be asks/bids. there is a "t": "s/b" property in each object. no docs for this exchange
        const res = {
            market: market,
            ticker: ticker,
            asks: body.sales.map(mapOrder),
            bids: body.book.map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
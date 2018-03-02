/**
 * GDAX API client.
 *
 * We throttle public endpoints by IP: 3 requests per second, up to 6 requests per second in bursts.
 *
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:gdax');
const config = require('../config');

const API_URL = 'https://api.gdax.com';
const API_BOOK_LEVEL = 2;

const MARKETS = config.MARKETS;

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/products`;
    debug(`Getting markets list from url ${url}...`);

    request({
        uri: url,
        headers: {
            'User-Agent': 'request'
        },
        json: true,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt of body) {
            let market = mt.quote_currency,
                ticker = mt.base_currency;

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

    let marketTicker = `${ticker}-${market}`;
    const url = `${API_URL}/products/${marketTicker}/book?level=${API_BOOK_LEVEL}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o[0]),
            quantity: Number(o[1])
        };
    };

    request({
        uri: url,
        headers: {
            'User-Agent': 'request'
        },
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
        const res = {
            market: market,
            ticker: ticker,
            asks: body.asks.map(mapOrder),
            bids: body.bids.map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
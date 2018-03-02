/**
 * Quoine API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:quoine');
const config = require('../config');

const API_URL = 'https://api.quoine.com';

const MARKETS = config.MARKETS;

let marketIdTable = {};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/products`;
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

        for (let mt of body) {
            let [market, ticker] = [mt.quoted_currency, mt.base_currency];

            if (MARKETS.indexOf(market) === -1) {
                continue;
            }

            if (!markets[market]) {
                markets[market] = [];
            }

            counter += 1;
            marketIdTable[`${ticker}${market}`] = mt.id;
            markets[market].push(ticker);
        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    const marketTicker = ticker + market;
    const url = `${API_URL}/products/${marketIdTable[marketTicker]}/price_levels/`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o[0]),
            quantity: Number(o[1])
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
        const res = {
            market: market,
            ticker: ticker,
            asks: body.sell_price_levels.map(mapOrder),
            bids: body.buy_price_levels.map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    marketIdTable: marketIdTable,

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
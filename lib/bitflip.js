/**
 * BitFlip API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:BitFlip');
const config = require('../config');

const API_URL = 'https://api.bitflip.cc';
const API_RESULTS_DEPTH = 50;

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
    const groups = str.split(':');
    return [groups[1], groups[0]];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/method/market.getPairs`;
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

        for (let mt of body[1]) {
            let [market, ticker] = parseMarketName(mt.pair);
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
    const marketTicker = ticker + market;
    const url = `${API_URL}/method/market.getOrderBook`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: o.rate,
            quantity: o.amount
        };
    };

    request({
        uri: url,
        json: true,
        body: {"version": "1.0", "pair" : `${ticker}:${market}`, "limit" : API_RESULTS_DEPTH},
        method: 'POST'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        if (!body) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }
        else if (!body[1]) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body[1].sell ? body[1].sell.map(mapOrder) : [],
            bids: body[1].buy ? body[1].buy.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
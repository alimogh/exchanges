/**
 * Exmo API client.
 *
 * The number of API requests is limited to 180 per/minute from one IP address or by a single user.
 *
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:exmo');
const config = require('../config');

const API_URL = 'https://api.exmo.com/v1';

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
    const groups = str.split('_');
    return [groups[1], groups[0]];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/pair_settings`;
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

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt in body) {
            let [market, ticker] = parseMarketName(mt);

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

    let marketTicker = ticker + market;
    const url = `${API_URL}/order_book/?pair=${ticker}_${market}`;
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

        let data = body[`${ticker}_${market}`];
        if (!data) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: data.ask ? data.ask.map(mapOrder) : [],
            bids: data.bid ? data.bid.map(mapOrder) : []
    };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
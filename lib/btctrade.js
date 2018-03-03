/**
 * BTC Trade API client.
 */

const cloudscraper = require('cloudscraper');
const debug = require('debug')('cointrage:order_book:btctrade');
const config = require('../config');
const async  = require('async');

const API_URL = 'https://www.btctrade.im';

const MARKETS = config.MARKETS;

const getMarkets = () => new Promise((resolve, reject) => {
    const markets = {};
    let counter = 0;

    async.eachSeries(MARKETS, (mt, callback) => {
        let url = `${API_URL}/coin/${mt.toLowerCase()}/allcoin`;
        debug(`Getting markets list from url ${url}...`);

        cloudscraper.request({
            url: url,
            method: 'GET'
        }, (err, response, body) => {
            if (err) return callback(null);

            if (response.statusCode !== 200) {
                // some other error
                return callback(null);
            }

            if (!body) {
                return callback(null);
            }

            body = JSON.parse(body);

            for (let tk in body) {
                let [market, ticker] = [mt, tk.toUpperCase()];

                if (!markets[market]) {
                    markets[market] = [];
                }

                counter += 1;
                markets[market].push(ticker);
            }

            callback(null);
        });
    }, (err) => {
        debug(`Found ${counter} markets`);

        resolve(markets);
    });
});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    let marketTicker = ticker + market;
    const url = `${API_URL}/coin/${market.toLowerCase()}/${ticker.toLowerCase()}/trades`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o[0]),
            quantity: Number(o[1])
        };
    };

    cloudscraper.request({
        url: url,
        method: 'GET'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        if (!body) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        body = JSON.parse(body);

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.sell ? body.sell.map(mapOrder) : [],
            bids: body.buy ? body.buy.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};



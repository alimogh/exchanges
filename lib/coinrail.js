/**
 * Coinrail API client.
 *
 * 999 - When a call is made exceeding a limited number of times. 20 times per second for the public API .
 * 10 times per second for the private API. If the above limit is exceeded, it will be stopped for 5 minutes.
 *
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:coinrail');
const config = require('../config');

const API_URL = 'https://api.coinrail.co.kr/public';
const API_MARKETS_URL = 'https://coinrail.co.kr/main';

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
    const groups = str.split('-');
    return [groups[1].toUpperCase(), groups[0].toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_MARKETS_URL}/market_info?v=${new Date().getTime()}`;
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

        for (let o of MARKETS) {
            let marketData = body[`${o.toLowerCase()}_market`];
            if (marketData) {
                for (let mt of marketData) {
                    let [market, ticker] = parseMarketName(mt.currency);

                    if (!markets[market]) {
                        markets[market] = [];
                    }

                    counter += 1;
                    markets[market].push(ticker);
                }
            }
        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    const marketTicker = ticker + market;
    const url = `${API_URL}/orderbook/?currency=${ticker.toLowerCase()}-${market.toLowerCase()}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o.price),
            quantity: Number(o.qty)
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
            asks: body.ask_orderbook.map(mapOrder),
            bids: body.bid_orderbook.map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
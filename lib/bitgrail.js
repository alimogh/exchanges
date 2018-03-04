/**
 * Bitgrail API client.
 *
 * You may perform no more than 60 calls per minute or we could ban temporarily you IP address.
 * 
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:bitgrail');
const config = require('../config');

const API_URL = 'https://api.bitgrail.com/v1';

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
    const groups = str.split('/');
    return [groups[1], groups[0]];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/markets`;
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
        else if (!body.response) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        let marketsData = [];
        Object.keys(body.response)
            .filter(key => MARKETS.includes(key))
            .reduce((obj, key) => {
                marketsData = marketsData.concat(Object.keys(body.response[key].markets));
            }, {});

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt of marketsData) {
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

    const marketTicker = ticker + market;
    const url = `${API_URL}/${market}-${ticker}/orderbook`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o.price),
            quantity: Number(o.amount)
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
        else if (!body.response) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.response.asks ? body.response.asks.map(mapOrder).reverse() : [],
            bids: body.response.bids ? body.response.bids.map(mapOrder).reverse() : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
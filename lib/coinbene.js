/**
 * Coinbene API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:coinbene');
const config = require('../config');

const API_URL = 'http://api.coinbene.com/v1';

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
    const market = MARKETS.filter((o) => {
        return (str.substr(str.length - o.length).toUpperCase() === o);
    }).toString();

    return [market , str.slice(0, -market.length).toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/market/ticker?symbol=all`;
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
        else if (!body.ticker) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt of body.ticker) {
            let [market, ticker] = parseMarketName(mt.symbol);
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
    const url = `${API_URL}/market/orderbook?symbol=${ticker.toLowerCase()}${market.toLowerCase()}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o.price),
            quantity: Number(o.quantity)
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
        else if (!body.orderbook) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.orderbook.asks ? body.orderbook.asks.map(mapOrder) : [],
            bids: body.orderbook.bids ? body.orderbook.bids.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};

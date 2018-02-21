/**
 * BTCC API client.
 *
 * DAX platform is closed, so we have only BTC/USD exchange.
 *
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:btcc');

const API_URL = 'https://spotusd-data.btcc.com';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

/////////////////////////

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    let marketTicker = market + ticker;
    const url = `${API_URL}/data/pro/orderbook?symbol=${ticker}${market}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: o[0],
            quantity: o[1]
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
            asks: body.asks ? body.asks.map(mapOrder) : [],
            bids: body.bids ? body.bids.map(mapOrder) : []
        };

        resolve(res);
    });
});


module.exports = {

    // getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
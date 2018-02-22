/**
 * Coolcoin API client.
 *
 * Not using their official api.
 *
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:coolcoin');

const API_URL = 'https://www.coolcoin.com';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/ajax/coin/coinlist`;
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
        else if(!body.data) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let o of MARKETS) {
            let marketData = body.data[`${o.toLowerCase()}`];

            if (marketData) {
                for (let mt in marketData) {
                    let [market, ticker] = [o, mt.toUpperCase()];

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

    const marketTicker = market + ticker;
    const url = `${API_URL}/coin/${market.toLowerCase()}/${ticker.toLowerCase()}/depth.js`;
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
            asks: body[1].map(mapOrder),
            bids: body[0].map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
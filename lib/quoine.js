/**
 * Quoine API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:quoine');

const API_URL = 'https://api.quoine.com';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

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
            let [market, ticker, id] = [mt.quoted_currency, mt.base_currency, mt.id];

            if (MARKETS.indexOf(market) === -1) {
                continue;
            }

            if (!markets[market]) {
                markets[market] = [];
            }

            counter += 1;
            markets[market].push({ticker, id});
        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const getOrderBook = (market, ticker, id) => new Promise((resolve, reject) => {

    let marketTicker = market + ticker;
    const url = `${API_URL}/products/${id}/price_levels/`;
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

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
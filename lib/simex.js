/**
 * Simex API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:simex');

const API_URL = 'https://simex.global/api';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/pairs?lang=en`;
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

        for (let mt of body.data) {
            let [market, ticker] = [mt.quote.name, mt.base.name];
            if (MARKETS.indexOf(market) === -1) {
                continue;
            }

            if (!markets[market]) {
                markets[market] = [];
            }

            counter += 1;
            markets[market].push({ticker: ticker, id: mt.id});
        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const getOrderBook = (market, ticker, id) => new Promise((resolve, reject) => {

    let marketTicker = market + ticker;
    const url = `${API_URL}/orders?pair=${id}&lang=en`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o.price),
            quantity: Number(o.amount)
        };
    };

    const filterOrder = (o, type) => {
        return o.side === type;
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
        else if (!body.data) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.data.filter((o) => { return filterOrder(o, 'sell'); }).map(mapOrder),
            bids: body.data.filter((o) => { return filterOrder(o, 'buy'); }).map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
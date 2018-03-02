/**
 * Coinut API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:coinut');

const API_URL = 'https://api-eu.coinut.com';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];
let nonce = 1;
let marketIdTable = {};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}`;
    debug(`Getting markets list from url ${url}...`);

    request({
        uri: url,
        json: true,
        body: {"request": "inst_list", "sec_type": "SPOT", "nonce": nonce++},
        method: 'POST'
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        if (!body) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }
        else if (!body.SPOT) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt in body.SPOT) {
            let md = body.SPOT[mt][0];
            if (!md) {
                continue;
            }

            let [market, ticker] = [md.quote, md.base];
            if (MARKETS.indexOf(market) === -1) {
                continue;
            }

            if (!markets[market]) {
                markets[market] = [];
            }

            counter += 1;
            marketIdTable[`${ticker}${market}`] = md.inst_id;
            markets[market].push(ticker);
        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    const marketTicker = ticker + market;
    const url = `${API_URL}`;
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
        body: {"request" : "inst_order_book", "inst_id" : marketIdTable[marketTicker], "nonce" : nonce++},
        method: 'POST'
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
            asks: body.sell ? body.sell.map(mapOrder) : [],
            bids: body.buy ? body.buy.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    nonce: nonce,

    marketIdTable: marketIdTable,

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
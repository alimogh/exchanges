/**
 * C-cex API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:c-cex');
const config = require('../config');

const API_URL = 'https://c-cex.com/t/api_pub.html';
const API_RESULTS_DEPTH = 50;

const MARKETS = config.MARKETS;

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}?a=getmarkets`;
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

        if (!body || !body.result) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt of body.result) {
            let [market, ticker] = [mt.BaseCurrency, mt.MarketCurrency];
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
    const url = `${API_URL}?a=getorderbook&market=${ticker}-${market}&type=both&depth=${API_RESULTS_DEPTH}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: o.Rate,
            quantity: o.Quantity
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

        if (!body || !body.result) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.result.sell ? body.result.sell.map(mapOrder) : [],
            bids: body.result.buy ? body.result.buy.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
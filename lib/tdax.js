/**
 * TDAX API client.
 */

const request = require('request');
const BigNumber = require('bignumber.js');
const debug = require('debug')('cointrage:exchanges:tdax');
const config = require('../config');

const API_URL = 'https://api.tdax.com';

const MARKETS = config.MARKETS;

const toEth = (wei, decimals) => new BigNumber(String(wei)).div(new BigNumber(10 ** decimals));

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/public/getmarkets`;
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
    const url = `${API_URL}/orders?Symbol=${ticker}_${market}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const decimals = market === 'BTC' ? 8 : 18;

    const mapOrder = (o) => {
        return {
            rate: toEth(o.Price, decimals).toNumber(),
            quantity: toEth(o.RemainQty, 18).toNumber()
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
            asks: body.Asks ? body.Asks.map(mapOrder) : [],
            bids: body.Bids ? body.Bids.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
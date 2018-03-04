/**
 * RightBTC API client.
 *
 * No request limit specified anywhere.
 *
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:rightbtc');
const config = require('../config');

const API_URL = 'https://www.rightbtc.com/api/public';
const API_RESULTS_DEPTH = 50;

const MARKETS = config.MARKETS;

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/trading_pairs`;
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
        else if(!body.status) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt in body.status.message) {
            let [market, ticker] = [body.status.message[mt].ask_asset_symbol, body.status.message[mt].bid_asset_symbol];
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

    const marketTicker = market + ticker;
    const url = `${API_URL}/depth/${ticker}${market}/${API_RESULTS_DEPTH}`;
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
        else if (!body.result) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.result.ask ? body.result.ask.map(mapOrder) : [],
            bids: body.result.bid ? body.result.bid.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};


/**
 * TradeByTrade API client.
 *
 * Please note that making more than 6 calls per second to the public API, or repeatedly and needlessly fetching excessive amounts of data(legit reasoning), can result in your IP being banned.
 *
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:tradebytrade');

const API_URL = 'https://app.tradebytrade.com/api';
const API_RESULTS_DEPTH = 50;

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

const parseMarketName = (str) => {
    const groups = str.split('_');
    return [groups[0], groups[1]];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/coin-rates`;
    debug(`Getting markets list from url ${url}...`);

    request({
        uri: url,
        headers: {
            'User-Agent': 'request'
        },
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

        for (let mt in body) {
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

    let marketTicker = ticker + market;
    const url = `${API_URL}/public/returnOrderBook/${market}_${ticker}/${API_RESULTS_DEPTH}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o[0]),
            quantity: Number(o[1])
        };
    };

    request({
        uri: url,
        headers: {
            'User-Agent': 'request'
        },
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

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
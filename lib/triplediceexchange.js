/**
 * Tripe Dice Exchange API client.
 */

const cloudscraper = require('cloudscraper');
const debug = require('debug')('cointrage:exchanges:triplediceexchange');
const config = require('../config');

const API_URL = 'https://anxpro.com/api';

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
    const market = MARKETS.filter((o) => {
        return (str.substr(str.length - o.length).toUpperCase() === o);
    }).toString();

    return [market , str.slice(0, -market.length).toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/3/currencyStatic`;
    debug(`Getting markets list from url ${url}...`);

    cloudscraper.request({
        method: 'GET',
        url: url
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        body = JSON.parse(body);

        if (!body) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt in body.currencyStatic.currencyPairs) {
            if (body.currencyStatic.currencyPairs[mt].preferredMarket !== 'ANX') {
                continue;
            }

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
    const url = `${API_URL}/2/${ticker}${market}/money/depth/full`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o.price),
            quantity: Number(o.amount)
        };
    };

    cloudscraper.request({
        method: 'GET',
        url: url
    }, (err, response, body) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        body = JSON.parse(body);

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
            asks: body.data.asks ? body.data.asks.map(mapOrder) : [],
            bids: body.data.bids ? body.data.bids.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
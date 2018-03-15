/**
 * Ethfinex API client.
 */

const request = require('request');
const cheerio = require('cheerio');
const debug = require('debug')('cointrage:exchanges:ethfinex');
const config = require('../config');

const API_URL = 'https://api.ethfinex.com/v2';
const MARKETS_URL = 'https://coinmarketcap.com/exchanges/ethfinex/';
const API_RESULTS_DEPTH = 100;

const MARKETS = config.MARKETS;

/**
 * Mappings of ethfinex tickets to standard.
 */
const STANDARD_MAPPINGS = {
    'DAT': 'DATA'
};

const parseMarketName = (str) => {
    const groups = str.split('/');
    return [groups[1], groups[0]];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${MARKETS_URL}`;
    debug(`Getting markets list from url ${url}...`);

    request(url, (err, response, html) => {
        if (err) return reject(err);

        if (response.statusCode !== 200) {
            // some other error
            return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        const _$ = cheerio.load(html);

        _$('table#exchange-markets > tbody tr').each((i, row) => {
            let mt  = _$(row).find('a').not('.market-name').text();
            if (mt) {
                let [market, ticker] = parseMarketName(mt);
                if (MARKETS.indexOf(market) !== -1) {
                    if (!markets[market]) {
                        markets[market] = [];
                    }

                    counter += 1;
                    markets[market].push(ticker);
                }
            }
        });

        debug(`Found ${counter} markets`);

        resolve(markets);
    });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    const marketTicker = ticker + market;
    const url = `${API_URL}/book/t${marketTicker}/P0/?len=${API_RESULTS_DEPTH}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: o[0],
            quantity: Math.abs(o[2])
        };
    };

    const filterOrder = (o, type) => {
        if (type === 'sell' && o[2] < 0) {
            return o;
        }
        else if(type === 'buy' && o[2] > 0) {
            return o;
        }
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
            asks: body.filter((o) => { return filterOrder(o, 'sell'); }).map(mapOrder),
            bids: body.filter((o) => { return filterOrder(o, 'buy'); }).map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
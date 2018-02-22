/**
 * Lykke API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:lykke');

const API_URL = 'https://hft-api.lykke.com/api';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

const parseMarketName = (str) => {
    const groups = str.split('/');
    return [groups[1], groups[0]];
};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_URL}/AssetPairs`;
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
            let [market, ticker] = parseMarketName(mt.Name);
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
    const url = `${API_URL}/OrderBooks/${ticker}${market}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: o.Price,
            quantity: Math.abs(o.Volume)
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

        let asksData = body.filter((o) => {
            return !o.IsBuy;
        });
        let bidsData = body.filter((o) => {
            return o.IsBuy;
        });

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: asksData[0].Prices ? asksData[0].Prices.map(mapOrder) : [],
            bids: bidsData[0].Prices ? bidsData[0].Prices.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
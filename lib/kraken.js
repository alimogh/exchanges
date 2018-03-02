/**
 * Kraken API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:kraken');

const API_URL = 'https://api.kraken.com/0/public';

const MARKETS = ['ETH', 'XBT', 'USDT', 'USD'];

const parseMarketName = (str) => {
    const market = MARKETS.filter((o) => {
        return (str.substr(str.length - o.length).toUpperCase() === o);
    }).toString();

    return [market , str.slice(0, -market.length).toUpperCase()];
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

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let mt in body.result) {
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

const parseMarket = (market) => {
    if (market === 'XBT') {
        return 'BTC';
    }

    return market;
};

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    let marketTicker = ticker + market;
    const url = `${API_URL}/Depth?pair=${marketTicker}`;
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

        market = parseMarket(market);

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.result && body.result[marketTicker] ? body.result[marketTicker].asks.map(mapOrder) : [],
            bids: body.result && body.result[marketTicker] ? body.result[marketTicker].bids.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
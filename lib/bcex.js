/**
 * BCEX API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:bcex');

const API_URL = 'https://www.bcex.ca/Api_Order';
const API_MARKETS_URL = 'https://www.bcex.ca/coins/markets';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `${API_MARKETS_URL}`;
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
        else if (!body.data) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let o of MARKETS) {
            let marketData = body.data[`${o.toLowerCase()}`];

            if (marketData) {
                for (let mt of marketData) {
                    let [market, ticker] = [o, mt.coin_from.toUpperCase()];

                    if (!markets[market]) {
                        markets[market] = [];
                    }

                    counter += 1;
                    markets[market].push(ticker);
                }
            }

        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    const marketTicker = ticker + market;
    const url = `${API_URL}/depth`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: o[0],
            quantity: o[1]
        };
    };

    request({
        uri: url,
        formData: {symbol : `${ticker.toLowerCase()}2${market.toLowerCase()}`},
        method: 'POST'
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
            asks: body.data.asks.map(mapOrder),
            bids: body.data.bids.map(mapOrder)
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};


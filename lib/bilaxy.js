/**
 * Bilaxy API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:bilaxy');
const config = require('../config');

const API_URL = 'http://api.bilaxy.com/v1';

const MARKETS = config.MARKETS;

const MARKET_IDS = {};

const getMarkets = () => new Promise((resolve, reject) => {

    const url = `https://bilaxy.com/api/v2/market/coins`;
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
        
        if(!body.dataMap) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // filtering active markets only
        const markets = {};
        let counter = 0;

        for (let market in body.dataMap) {            
            if (MARKETS.indexOf(market) === -1) {
                continue;
            }

            if (!markets[market]) {
                markets[market] = [];
            }

            if (!MARKET_IDS[market]) {
                MARKET_IDS[market] = {};
            }

            for (let p of body.dataMap[market]) {
                
                let ticker = p.fShortName;
                counter += 1;
                
                markets[market].push(ticker);
                MARKET_IDS[market][ticker] = p.fid;
            }
        }

        debug(`Found ${counter} markets`);

        resolve(markets);

    });

});

const resolveMarketId = (market, ticker) => new Promise((resolve, reject) => {

  if (MARKET_IDS[market]) {
    return resolve(MARKET_IDS[market][ticker]);
  }

  getMarkets()
    .then(() => {
      resolve(MARKET_IDS[market][ticker]);
    })
    .catch(reject);

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    resolveMarketId(market, ticker)
        .then((market_id) => {

            const url = `${API_URL}/depth?symbol=${market_id}`;
            debug(`Getting order book for market ${market_id} from url ${url}...`);

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

                if (!body || !body.data) {
                    return reject(`Invalid response from url ${url}: ${JSON.stringify(body)}`);
                }

                // formatting response
                const asks = body.data ? JSON.parse(body.data.bids) : [];
                const bids = body.data ? JSON.parse(body.data.asks) : [];

                const res = {
                    market: market,
                    ticker: ticker,
                    asks: asks.map(mapOrder).reverse(),
                    bids: bids.map(mapOrder)
                };

                resolve(res);
            });


        })
        .catch(reject);

});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
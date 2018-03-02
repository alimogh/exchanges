/**
 * Huobi API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:huobi');

const API_URL = 'https://api.huobi.pro';

const TICKER_BLACK_LIST = ['BT1', 'BT2'];

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/v1/common/symbols`;
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
    for (let d of body.data) {
      let market = d['quote-currency'].toUpperCase();
      let ticker = d['base-currency'].toUpperCase();

      if (TICKER_BLACK_LIST.indexOf(ticker) !== -1) {
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
  
  const marketTicker = ticker.toLowerCase() + market.toLowerCase();
  const url = `${API_URL}/market/depth?symbol=${marketTicker}&type=step1`;
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

    if (!body.tick) {
      return reject(`Invalid data received from url ${url}: ${JSON.stringify(body)}`);
    }

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      asks: body.tick.asks ? body.tick.asks.map(mapOrder) : [],
      bids: body.tick.bids ? body.tick.bids.map(mapOrder) : []
    };

    resolve(res);
  });
});


module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
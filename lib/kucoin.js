/**
 * Kucoin API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:kucoin');

const API_URL = 'https://api.kucoin.com/v1';

const BLACK_LIST = ['KCS', 'NEO'];

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/market/open/symbols`;
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

    if (!body.data) {
      // some other error
      return reject(`Invalid response from url ${url}: ${JSON.stringify(body)}`);
    }

    // filtering active markets only
    const markets = {};
    let counter = 0;
    for (let p of body.data) {
      if (!p.trading || !p.vol) {
        continue;
      }

      let market = p.coinTypePair;
      let ticker = p.coinType;

      if (BLACK_LIST.indexOf(market) >= 0) {
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
  
  const marketTicker = ticker + '-' + market;
  const url = `${API_URL}/open/orders?symbol=${marketTicker}&limit=50`;
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

    if (!body.data) {
      return reject(`Invalid data got from url ${url}: ${JSON.stringify(body)}`);
    }

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      asks: body.data.SELL ? body.data.SELL.map(mapOrder) : [],
      bids: body.data.BUY ? body.data.BUY.map(mapOrder) : []
    };

    resolve(res);
  });
});


module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
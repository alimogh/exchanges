/**
 * Binance API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:binance');

const API_URL = 'https://www.binance.com/api/v1';
const DEFAULT_ORDEBOOK_DEPTH = 50;

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

/**
 * Mappings of bitfinex tickets to standard.
 */
const STANDARD_MAPPINGS = {
  'BCC': 'BCH'
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `https://www.binance.com/exchange/public/product`;
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
    for (let m of body.data) {
      if (!m.active || m.status !== 'TRADING') {
        continue;
      }

      let market = m.quoteAsset;
      let ticker = m.baseAsset;

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

const getOrderBook = (market, ticker, depth) => new Promise((resolve, reject) => {
  
  if (!depth) {
    depth = DEFAULT_ORDEBOOK_DEPTH;
  }

  const mapOrder = (o) => { 
    return { 
      rate: +o[0], 
      quantity: +o[1] 
    };
  };

  const marketTicker = ticker + market;

  const url = `${API_URL}/depth?symbol=${marketTicker}&limit=${depth}`;
  debug(`Getting order book for market ${marketTicker} from url ${url}`);

  request({
    uri: url,
    json: true,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      if (response.statusCode === 400 && body.code === -1121) {
        // invalid symbol
        return reject(`Invalid symbol: ${marketTicker}`);
      } else {
        // some other error
        return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
      }
    }

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      bids: body.bids.map(o => mapOrder(o)),
      asks: body.asks.map(o => mapOrder(o))
    };

    resolve(res);
  });

});

module.exports = {

  getMarkets: getMarkets,

  getOrderBook: getOrderBook

};

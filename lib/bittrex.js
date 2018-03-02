/**
 * Bittrex API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:bittrex');
const config = require('../config');

const DEFAULT_ORDEBOOK_DEPTH = 50;

const MARKETS = config.MARKETS;

const bittrex = require('node.bittrex.api');
bittrex.options({
  inverse_callback_arguments: true
});


const parseMarketName = (str) => {
  const groups = str.match(/(\w+)-(\w+)/);
  return [groups[1], groups[2]];
};


const getMarkets = (fn) => new Promise((resolve, reject) => {

  debug(`Getting markets...`);

  bittrex.getmarketsummaries((err, data) => {
    if (err) return reject(err);
    
    // formatting markets data
    const res = {};
    let counter = 0;
    for (let m of data.result) {
      let [market, ticker] = parseMarketName(m.MarketName);

      if (!m.Volume) {
        continue;
      }

      if (MARKETS.indexOf(market) === -1) {
        continue;
      }

      if (!res[market]) {
        res[market] = [];
      }

      counter += 1;

      res[market].push(ticker);
    }

    debug(`Found ${counter} markets`);

    resolve(res);
  });

});



const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {
  
  const marketTicker = market + '-' + ticker;
  debug(`Getting order book for ${marketTicker}...`);
  
  const mapOrder = (o) => { 
    return { 
      rate: o.Rate, 
      quantity: o.Quantity 
    };
  };
  
  bittrex.getorderbook({market: marketTicker, depth: DEFAULT_ORDEBOOK_DEPTH, type: 'both'}, (err, data) => {
    if (err) {
      return reject(err.success === false ? `${err.message} for ${marketTicker}` : err);
    };

    debug(`Got ${marketTicker} order book`);

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      bids: data.result.buy ? data.result.buy.slice(0, DEFAULT_ORDEBOOK_DEPTH).map(o => mapOrder(o)) : [],
      asks: data.result.sell ? data.result.sell.slice(0, DEFAULT_ORDEBOOK_DEPTH).map(o => mapOrder(o)): []
    };
    
    resolve(res);
  });
});

module.exports = {

  getMarkets: getMarkets,

  getOrderBook: getOrderBook

};
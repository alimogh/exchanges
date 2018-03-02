/**
 * YoBit API client.
 */

const request = require('request');
const cheerio = require('cheerio');
const debug = require('debug')('cointrage:exchanges:yobit');

const API_URL = 'https://yobit.net/api/3';
const MARKETS_URL = 'https://coinmarketcap.com/exchanges/yobit/';
const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];
// const FILTERED_MARKETS = { ETH: [], BTC: [ 'ETH', 'DASH', 'LSK', 'BCC', 'ETC', 'LTC', 'B2B', 'WAVES', 'TRX', 'DOGE', 'PAC', 'DFT', 'CAT', 'FRST', 'TOKC', 'NLC2', 'PING', 'XVG', 'ZEC', 'BTG', 'CRAVE', 'LCC', 'RDD', 'UBTC', 'XEM', 'DGB', 'HPC', 'BSTY', 'EDR2', 'HKN', 'BIO', 'CNX', 'LEPEN', 'EOS', 'NYC', 'SANDG', 'HDG', 'UNIT', 'POSW', 'ECASH', 'LINDA', 'HMC', 'SLS', 'ZENI', 'QBC', 'FJC', 'CMS', 'DCR', 'EDRC', 'ATL' ] };

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

        const _$ = cheerio.load(html);
        const markets = {};
        let counter = 0;

        _$('table#exchange-markets > tbody tr').each((i, row) => {
            let mt  = _$(row).find('a').not('.market-name').text();
            if (mt) {
                let [market, ticker] = parseMarketName(mt);
                if (MARKETS.indexOf(market) !== -1) {
                    if (!markets[market]) {
                        markets[market] = [];
                    }

                    if (markets[market].length < 50) {
                        markets[market].push(ticker);
                        counter += 1;
                    }
                }
            }
        });

        debug(`Found ${counter} markets`);

        resolve(markets);
    });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {

    let marketTicker = ticker + market;
    const url = `${API_URL}/depth/${ticker.toLowerCase()}_${market.toLowerCase()}`;
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

        if (!body) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        let bookData = body[`${ticker.toLowerCase()}_${market.toLowerCase()}`];
        if (!bookData) {
            return reject(`Invalid response: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: bookData.asks ? bookData.asks.map(mapOrder) : [],
            bids: bookData.bids ? bookData.bids.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
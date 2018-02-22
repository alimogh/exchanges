/**
 * TOPBTC API client.
 */

const request = require('request');
const cheerio = require('cheerio');
const debug = require('debug')('cointrage:exchanges:topbtc');

const API_URL = 'https://topbtc.com/market/market.php';
const MARKETS_URL = 'https://coinmarketcap.com/exchanges/topbtc/';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

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
    const url = `${API_URL}`;
    debug(`Getting order book for market ${marketTicker} from url ${url}...`);

    const mapOrder = (o) => {
        return {
            rate: Number(o.price),
            quantity: Number(o.amount)
        };
    };

    request({
        uri: url,
        formData: {coin : ticker, market: market},
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

        debug(body);

        // formatting response
        const res = {
            market: market,
            ticker: ticker,
            asks: body.sell ? body.sell.map(mapOrder) : [],
            bids: body.buy ? body.buy.map(mapOrder) : []
        };

        resolve(res);
    });
});

module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
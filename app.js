require('dotenv').config();
const { runCrawler } = require('./src/crawler');

(async () => await runCrawler())();

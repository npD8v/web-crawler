const puppeteer = require('puppeteer');
const path = require('path');
const logger = require('./helpers/loggerConfig.helper');
const { ensureDirExist, downloadPDF, writeDataToFile } = require('./helpers/files.helper');

//constants
const url = process.env.URL || '';
const DATA_FILE = path.resolve(process.cwd(), 'data','data.json');
const DOWNLOAD_DIR = path.resolve(process.cwd(), 'data', 'downloads');

// Function to fetch data and process PDFs
exports.runCrawler = async () => {
    logger.info(`Fetching data from ${url}`);
  
    try {
      const browser = await puppeteer.launch();
      logger.info('Browser launched');
  
      const page = await browser.newPage();
      logger.info('New page opened');
  
      await page.goto(url, { waitUntil: 'networkidle2' });
      logger.info(`Navigated to ${url}`);
  
      const collectedData = await page.evaluate(() => {
        const data = [];
        document.querySelectorAll('.card-catalogue').forEach(element => {
          const catalogueTitle = element.querySelector('.hover h3')?.textContent.trim() || '';
          const expirationPeriod = element.querySelector('p')?.textContent.trim() || '';
          const catalogueLink = element.querySelector('a.pdf')?.href || '';
  
          data.push({ catalogueTitle, expirationPeriod, catalogueLink });
        });
        return data;
      });
  
      logger.info(`Data collected: ${collectedData.length} items`);
  
      await browser.close();
      logger.info('Browser closed');
  
      await Promise.all(collectedData.map(async item => {
        if (!item.catalogueLink.startsWith('http')) {
          item.catalogueLink = new URL(item.link, url).href;
          logger.info(`Converted relative URL to absolute: ${item.link}`);
        }
  
        const fileName = path.basename(item.catalogueLink);
        const outputLocationPath = path.join(DOWNLOAD_DIR, fileName);
  
        await ensureDirExist(DOWNLOAD_DIR);

        try {
          await downloadPDF(item.catalogueLink, outputLocationPath);
        } catch (error) {
          logger.error(`Failed to download ${item.catalogueLink}: ${error.message}`);
        }
      }));
  
      await writeDataToFile(DATA_FILE, collectedData);
    } catch (error) {
      logger.error(`Error fetching or parsing data: ${error.message}`);
    }
  }
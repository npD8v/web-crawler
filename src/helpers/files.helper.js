const fs = require('fs').promises;
const { createWriteStream } = require('fs');
const  logger = require('./loggerConfig.helper');
const http = require('http');
const https = require('https');

// Helper function to download a PDF
exports.downloadPDF = async (pdfUrl, outputLocationPath) => {
    logger.info(`Starting download: ${pdfUrl}`);
  
    return new Promise((resolve, reject) => {
      const protocol = pdfUrl.startsWith('https') ? https : http;
  
      const file = createWriteStream(outputLocationPath);
      protocol.get(pdfUrl, response => {
        logger.info(`Downloading to: ${outputLocationPath}`);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close(() => {
            logger.info(`Download completed: ${outputLocationPath}`);
            resolve();
          });
        });
  
        file.on('error', err => {
          fs.unlink(outputLocationPath, () => reject(err));
          logger.error(`Error writing file ${outputLocationPath}: ${err.message}`);
        });
      }).on('error', err => {
        fs.unlink(outputLocationPath, () => reject(err));
        logger.error(`Request error for ${pdfUrl}: ${err.message}`);
      });
    });
  }
  
  // Helper function to create download directory if it doesn't exist
  exports.ensureDirExist = async (directoryName) => {
    try {
      await fs.access(directoryName);
      logger.info(`Download directory exists: ${directoryName}`);
    } catch {
      await fs.mkdir(directoryName, { recursive: true });
      logger.info(`Download directory created: ${directoryName}`);
    }
  }

  exports.writeDataToFile = async (fileName, data) => {
    await fs.writeFile(fileName, JSON.stringify(data, null, 2));
    logger.info(`Data successfully written to ${fileName}`);
  }
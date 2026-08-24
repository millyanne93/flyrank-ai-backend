const { chromium } = require('playwright');
const buildReportHtml = require('./render');
const getReportData = require('./report');
const fs = require('fs');
const path = require('path');

async function generatePdf(outputPath) {
  const data = getReportData();
  const html = buildReportHtml(data);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  return outputPath;
}

module.exports = generatePdf;

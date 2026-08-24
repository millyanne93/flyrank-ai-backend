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

  // make sure reports/ exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  console.log(`✅ PDF saved to ${outputPath}`);
}

if (require.main === module) {
  generatePdf('reports/test.pdf');
}

module.exports = generatePdf;

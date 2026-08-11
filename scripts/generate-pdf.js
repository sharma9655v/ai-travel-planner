const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  console.log('Launching headless browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const htmlPath = path.join(__dirname, '../docs/deepseek_r1_guide.html');
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  
  console.log(`Loading HTML from: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  const pdfPath = path.join(__dirname, '../docs/DeepSeek-R1_Beginners_Guide.pdf');
  const rootPdfPath = path.join(__dirname, '../DeepSeek-R1_Beginners_Guide.pdf');
  const artifactPdfPath = 'C:/Users/legion/.gemini/antigravity-ide/brain/632b7b71-9180-46f4-b264-890ea4cff015/DeepSeek-R1_Beginners_Guide.pdf';

  console.log('Generating PDF document...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '15mm',
      right: '15mm'
    }
  });

  await browser.close();

  // Copy to workspace root and artifacts folder
  fs.copyFileSync(pdfPath, rootPdfPath);
  fs.copyFileSync(pdfPath, artifactPdfPath);

  console.log(`PDF successfully created at: ${pdfPath}`);
  console.log(`PDF copied to workspace root: ${rootPdfPath}`);
  console.log(`PDF copied to artifacts: ${artifactPdfPath}`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

// Copy PDF.js worker file to public directory
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const destDir = path.join(__dirname, '../public/pdfjs');
const dest = path.join(destDir, 'pdf.worker.min.mjs');

try {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy the file
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log('✓ PDF.js worker copied to public/pdfjs/');
  } else {
    console.warn('⚠ PDF.js worker source not found, skipping copy');
  }
} catch (error) {
  console.error('Error copying PDF.js worker:', error.message);
  process.exit(1);
}


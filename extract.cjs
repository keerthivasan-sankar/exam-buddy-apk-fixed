const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

try {
  const zip = new AdmZip('appstore-images (1).zip');
  zip.extractAllTo('public', true);
  console.log('Extracted to public directory');
} catch (e) {
  console.error('Error extracting:', e);
}

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

async function createLosBrosZip() {
  const zip = new JSZip();
  const losBrosPath = 'C:\\Users\\dusti\\OneDrive\\Desktop\\LosBros';
  
  console.log('📁 Creating ZIP from LosBros folder...');
  
  function addFilesToZip(dirPath, zipFolder) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Create folder in ZIP
        const folder = zipFolder.folder(file);
        addFilesToZip(fullPath, folder);
      } else if (stat.isFile() && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)) {
        // Add image file to ZIP
        const fileData = fs.readFileSync(fullPath);
        zipFolder.file(file, fileData);
        console.log(`  ✅ Added: ${path.relative(losBrosPath, fullPath)}`);
      }
    });
  }
  
  // Add all files from LosBros directory
  addFilesToZip(losBrosPath, zip);
  
  // Generate ZIP file
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  
  // Write ZIP file
  const outputPath = path.join(__dirname, 'LosBros_Traits.zip');
  fs.writeFileSync(outputPath, zipBuffer);
  
  console.log(`🎉 ZIP file created: ${outputPath}`);
  console.log(`📦 File size: ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);
}

createLosBrosZip().catch(console.error);

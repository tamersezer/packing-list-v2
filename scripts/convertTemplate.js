const fs = require('fs');
const path = require('path');

// Tam yolu görelim
const templatePath = path.join(__dirname, '../public/templates/PackingListTemplate.xlsx');
console.log('Current directory:', __dirname);
console.log('Looking for template at:', templatePath);

try {
    // Dosya var mı kontrol edelim
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at: ${templatePath}`);
    }

    const template = fs.readFileSync(templatePath);
    console.log('Template file size:', template.length, 'bytes');
    
    const base64 = template.toString('base64');
    console.log('Base64 length:', base64.length);

    const output = `export const template = '${base64}';`;
    const outputPath = path.join(__dirname, '../src/templates/packingListTemplate.ts');
    
    // Output klasörü var mı kontrol edelim
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, output);
    console.log('Template converted and saved to:', outputPath);
} catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1); // Hata durumunda process'i sonlandır
} 
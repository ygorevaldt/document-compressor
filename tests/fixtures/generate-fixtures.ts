import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import AdmZip from 'adm-zip';
import sharp from 'sharp';

export async function generateFixtures(fixturesDir: string = path.join(process.cwd(), 'tests', 'fixtures')) {
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // 1. Create a detailed 800x800 image buffer with SVG patterns to simulate real photo/graphic
  const svg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(255,100,50);stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(50,150,255);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(50,255,100);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#grad1)" />
      <circle cx="400" cy="400" r="300" fill="white" opacity="0.3"/>
      ${Array.from({ length: 40 }, (_, i) => `<rect x="${i * 20}" y="${(i % 10) * 80}" width="50" height="50" fill="rgba(255,255,255,0.2)"/>`).join('')}
    </svg>
  `;
  const imageBuffer = await sharp(Buffer.from(svg))
    .jpeg({ quality: 100 })
    .toBuffer();

  // 2. Minimal PDF
  const minPdfDoc = await PDFDocument.create();
  const page1 = minPdfDoc.addPage([400, 400]);
  page1.drawText('Minimal PDF Document Content', {
    x: 50,
    y: 350,
    size: 16,
    color: rgb(0, 0, 0),
  });
  const minPdfBytes = await minPdfDoc.save();
  fs.writeFileSync(path.join(fixturesDir, 'minimal.pdf'), Buffer.from(minPdfBytes));

  // 3. PDF with embedded Image (large image to compress)
  const imgPdfDoc = await PDFDocument.create();
  const imgPage = imgPdfDoc.addPage([600, 600]);
  const embeddedImage = await imgPdfDoc.embedJpg(imageBuffer);
  imgPage.drawImage(embeddedImage, {
    x: 50,
    y: 100,
    width: 400,
    height: 400,
  });
  imgPage.drawText('Sample Document with High-Res Image', {
    x: 50,
    y: 530,
    size: 20,
    color: rgb(0.1, 0.1, 0.1),
  });
  const imgPdfBytes = await imgPdfDoc.save();
  fs.writeFileSync(path.join(fixturesDir, 'image-sample.pdf'), Buffer.from(imgPdfBytes));

  // 4. DOCX file with embedded image
  const zip = new AdmZip();
  // Add [Content_Types].xml
  zip.addFile(
    '[Content_Types].xml',
    Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
  );

  // Add _rels/.rels
  zip.addFile(
    '_rels/.rels',
    Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
  );

  // Add word/_rels/document.xml.rels
  zip.addFile(
    'word/_rels/document.xml.rels',
    Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpg"/>
</Relationships>`)
  );

  // Add word/document.xml
  zip.addFile(
    'word/document.xml',
    Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>Hello from sample DOCX document with media!</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`)
  );

  // Add word/media/image1.jpg (uncompressed high-res image)
  zip.addFile('word/media/image1.jpg', imageBuffer);
  fs.writeFileSync(path.join(fixturesDir, 'sample.docx'), zip.toBuffer());

  // 5. Corrupted PDF
  fs.writeFileSync(path.join(fixturesDir, 'corrupted.pdf'), Buffer.from('NOT_A_VALID_PDF_HEADER_DATA_123456789'));

  // 6. Empty PDF
  fs.writeFileSync(path.join(fixturesDir, 'empty.pdf'), Buffer.alloc(0));

  // 7. Encrypted PDF fixture
  const minimalPdfWithEncrypt = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /Encrypt 3 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n3 0 obj\n<< /Filter /Standard >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000125 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R /Encrypt 3 0 R >>\nstartxref\n175\n%%EOF'
  );
  fs.writeFileSync(path.join(fixturesDir, 'encrypted.pdf'), minimalPdfWithEncrypt);

  console.log('Test fixtures created successfully in:', fixturesDir);
}

// Execute if run directly
if (require.main === module) {
  generateFixtures().catch(console.error);
}

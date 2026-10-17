const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const mdPath = path.join(__dirname, '../docs/Ministry_Project_Complete_Documentation.md');
const pdfPath = path.join(__dirname, '../docs/Ministry_Project_Complete_Documentation.pdf');
const htmlTempPath = path.join(__dirname, '../docs/temp_doc.html');

console.log('Reading Markdown content from:', mdPath);
const markdown = fs.readFileSync(mdPath, 'utf-8');

// Parse Markdown into HTML
const contentHtml = marked.parse(markdown);

// HTML Template with Executive Document Styling
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WCM Outreach - Complete Ministry Project Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
      @bottom-right {
        content: counter(page);
        font-size: 9pt;
        color: #64748b;
      }
      @bottom-left {
        content: "World Christian Ministry — WCM Outreach Documentation";
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Cover Page Styling */
    .cover-page {
      page-break-after: always;
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px;
      border-left: 6px solid #4f46e5;
    }

    .cover-top {
      margin-top: 40px;
    }

    .cover-tag {
      font-size: 10pt;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #6366f1;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 900;
      line-height: 1.15;
      color: #0f172a;
      margin: 0 0 16px 0;
    }

    .cover-subtitle {
      font-size: 14pt;
      font-weight: 500;
      color: #475569;
      line-height: 1.4;
      margin: 0 0 24px 0;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: #e0e7ff;
      color: #3730a3;
      border-radius: 8px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .cover-meta {
      border-top: 1px solid #e2e8f0;
      padding-top: 24px;
      font-size: 9.5pt;
      color: #64748b;
      line-height: 1.7;
    }

    .cover-meta strong {
      color: #1e293b;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 800;
      page-break-after: avoid;
    }

    h1 {
      font-size: 18pt;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 28pt;
      margin-bottom: 12pt;
      color: #1e1b4b;
    }

    h2 {
      font-size: 14pt;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-top: 22pt;
      margin-bottom: 10pt;
      color: #312e81;
    }

    h3 {
      font-size: 11pt;
      margin-top: 16pt;
      margin-bottom: 8pt;
      color: #4338ca;
    }

    h4 {
      font-size: 10pt;
      margin-top: 12pt;
      margin-bottom: 6pt;
    }

    p {
      margin-top: 0;
      margin-bottom: 10pt;
      text-align: justify;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.05em;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Code Blocks */
    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 10pt 0;
      border: 1px solid #334155;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      color: #4338ca;
      padding: 1px 4px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border: none;
      font-size: 8pt;
    }

    /* Blockquotes */
    blockquote {
      margin: 12pt 0;
      padding: 8px 16px;
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    blockquote p {
      margin: 0;
    }

    /* Lists */
    ul, ol {
      margin-top: 0;
      margin-bottom: 10pt;
      padding-left: 20px;
    }

    li {
      margin-bottom: 3pt;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20pt 0;
    }

    /* Utilities */
    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="cover-tag">Ministry Technical Documentation</div>
      <h1 class="cover-title">WCM Outreach<br/>Reporting System</h1>
      <p class="cover-subtitle">Complete System Architecture, Technical Implementation, API Reference & Operations Manual</p>
      <div class="cover-badge">Version 2.0.0 — Production Ready</div>
    </div>

    <div class="cover-meta">
      <strong>Organization:</strong> World Christian Ministry (WCM)<br/>
      <strong>Document Scope:</strong> End-to-End System Specifications, Database Schemas & Deployment<br/>
      <strong>Publication Date:</strong> October 17, 2026<br/>
      <strong>Classification:</strong> Confidential Ministry Technical & Architecture Record<br/>
      <strong>Repository:</strong> saikiranrayudu02-cell/wcm-outreach
    </div>
  </div>

  <!-- Documentation Body -->
  <div class="doc-body">
    ${contentHtml}
  </div>
</body>
</html>
`;

fs.writeFileSync(htmlTempPath, fullHtml);
console.log('Temporary HTML created at:', htmlTempPath);

console.log('Executing Google Chrome Headless to compile PDF...');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlTempPath}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF generated successfully at:', pdfPath);
  const stats = fs.statSync(pdfPath);
  console.log(`PDF File Size: ${(stats.size / 1024).toFixed(1)} KB`);
  // Clean up temp file
  fs.unlinkSync(htmlTempPath);
  console.log('Cleaned up temporary HTML file.');
} catch (err) {
  console.error('Error generating PDF with Chrome:', err);
  process.exit(1);
}

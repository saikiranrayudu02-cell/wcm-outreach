const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const mdPath = path.join(__dirname, '../docs/Ministry_Project_Feature_Wise_Documentation.md');
const pdfPath = path.join(__dirname, '../docs/Ministry_Project_Feature_Wise_Documentation.pdf');
const htmlTempPath = path.join(__dirname, '../docs/temp_feature_doc.html');

console.log('Reading Feature-Wise Markdown content from:', mdPath);
const markdown = fs.readFileSync(mdPath, 'utf-8');

// Parse Markdown into HTML
const contentHtml = marked.parse(markdown);

// HTML Template with Executive Presentation Styling
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WCM Outreach - Complete Feature-Wise Ministry Application Documentation</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page);
        font-size: 8.5pt;
        color: #64748b;
      }
      @bottom-left {
        content: "World Christian Ministry — WCM Outreach Feature Guide";
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Executive Cover Page */
    .cover-page {
      page-break-after: always;
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 24px;
      border-left: 8px solid #4338ca;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
    }

    .cover-top {
      margin-top: 50px;
    }

    .cover-tag {
      font-size: 10pt;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #6366f1;
      margin-bottom: 14px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 900;
      line-height: 1.15;
      color: #0f172a;
      margin: 0 0 16px 0;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 500;
      color: #475569;
      line-height: 1.4;
      margin: 0 0 24px 0;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      background-color: #e0e7ff;
      color: #3730a3;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border: 1px solid #c7d2fe;
    }

    .cover-meta {
      border-top: 1px solid #cbd5e1;
      padding-top: 24px;
      font-size: 9.5pt;
      color: #64748b;
      line-height: 1.7;
    }

    .cover-meta strong {
      color: #0f172a;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 800;
      page-break-after: avoid;
    }

    h1 {
      font-size: 17pt;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 26pt;
      margin-bottom: 12pt;
      color: #1e1b4b;
    }

    h2 {
      font-size: 13pt;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-top: 20pt;
      margin-bottom: 8pt;
      color: #312e81;
    }

    h3 {
      font-size: 11pt;
      margin-top: 15pt;
      margin-bottom: 6pt;
      color: #4338ca;
    }

    h4 {
      font-size: 9.5pt;
      margin-top: 10pt;
      margin-bottom: 4pt;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    p {
      margin-top: 0;
      margin-bottom: 8pt;
      text-align: justify;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10pt 0;
      font-size: 8pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.05em;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Blockquotes & Presentation Quotes */
    blockquote {
      margin: 10pt 0;
      padding: 8px 14px;
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
      font-size: 8.5pt;
      font-style: italic;
      page-break-inside: avoid;
      border-radius: 0 8px 8px 0;
    }

    blockquote p {
      margin: 0;
    }

    /* Lists */
    ul, ol {
      margin-top: 0;
      margin-bottom: 8pt;
      padding-left: 18px;
    }

    li {
      margin-bottom: 2pt;
    }

    /* Code & Pre */
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8pt;
      background-color: #f1f5f9;
      color: #4338ca;
      padding: 1px 3px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 7.5pt;
      line-height: 1.4;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 8pt 0;
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border: none;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 16pt 0;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-top">
      <div class="cover-tag">Ministry Product & Feature Guide</div>
      <h1 class="cover-title">WCM Outreach<br/>Reporting System</h1>
      <p class="cover-subtitle">Complete Feature-Wise Operations Manual, User Workflows, Screen Guide & Team Lead Presentation Guide</p>
      <div class="cover-badge">Non-Technical Stakeholder Edition — Version 2.0.0</div>
    </div>

    <div class="cover-meta">
      <strong>Ministry Organization:</strong> World Christian Ministry (WCM)<br/>
      <strong>Document Scope:</strong> End-to-End Features, Screen Workflows, Role Permissions & Live Demo Script<br/>
      <strong>Intended Audience:</strong> Team Leads, Ministry Executives, Board Members, Field Coordinators<br/>
      <strong>Date of Preparation:</strong> October 17, 2026<br/>
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

console.log('Executing Google Chrome Headless to compile Feature PDF...');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlTempPath}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Feature PDF generated successfully at:', pdfPath);
  const stats = fs.statSync(pdfPath);
  console.log(`PDF File Size: ${(stats.size / 1024).toFixed(1)} KB`);
  // Clean up temp file
  fs.unlinkSync(htmlTempPath);
  console.log('Cleaned up temporary HTML file.');
} catch (err) {
  console.error('Error generating Feature PDF with Chrome:', err);
  process.exit(1);
}

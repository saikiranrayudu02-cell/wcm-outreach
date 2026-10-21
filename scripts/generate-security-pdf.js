const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const mdPath = path.join(__dirname, '../docs/Ministry_Security_Audit_and_Remediation_Report.md');
const pdfPath = path.join(__dirname, '../docs/Ministry_Security_Audit_and_Remediation_Report.pdf');
const htmlTempPath = path.join(__dirname, '../docs/temp_security_doc.html');

console.log('Reading Markdown content from:', mdPath);
const markdown = fs.readFileSync(mdPath, 'utf-8');

// Parse Markdown into HTML
const contentHtml = marked.parse(markdown);

// HTML Template with Executive Document Styling
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ministry Application — Complete Security Audit & Remediation Report</title>
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
        content: "WCM Ministry Outreach Platform — Security Audit Report";
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

    .cover-page {
      page-break-after: always;
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px;
      border-left: 6px solid #dc2626;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 8px;
    }

    .cover-subtitle {
      font-size: 13pt;
      font-weight: 500;
      color: #dc2626;
      margin-bottom: 24px;
      letter-spacing: 0.5px;
    }

    .cover-meta {
      background: #f8fafc;
      padding: 18px 24px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-size: 9.5pt;
      line-height: 1.8;
      color: #475569;
    }

    .cover-meta strong {
      color: #1e293b;
    }

    h1, h2, h3, h4 {
      color: #0f172a;
      font-weight: 700;
      page-break-after: avoid;
    }

    h1 {
      font-size: 17pt;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 26px;
      margin-bottom: 14px;
      color: #1e1b4b;
    }

    h2 {
      font-size: 13pt;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
      color: #334155;
    }

    h3 {
      font-size: 11pt;
      margin-top: 14px;
      margin-bottom: 6px;
      color: #475569;
    }

    p {
      margin-top: 0;
      margin-bottom: 10px;
      text-align: justify;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background: none;
      padding: 0;
      border: none;
      color: inherit;
    }

    pre {
      background-color: #0f172a;
      color: #f8fafc;
      padding: 12px 14px;
      border-radius: 6px;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 12px 0;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 20px;
    }

    li {
      margin-bottom: 4px;
    }

    .badge-pass {
      display: inline-block;
      padding: 2px 7px;
      font-size: 7.5pt;
      font-weight: 700;
      background: #dcfce7;
      color: #15803d;
      border-radius: 4px;
      border: 1px solid #86efac;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #dc2626; margin-bottom: 12px;">
        CONFIDENTIAL SECURITY AUDIT & REMEDIATION REPORT
      </div>
      <div class="cover-title">WCM Ministry Outreach Platform</div>
      <div class="cover-subtitle">Complete Application Security Audit, Penetration Testing & Remediation</div>
      <p style="font-size: 10.5pt; color: #475569; max-width: 600px; line-height: 1.6;">
        A comprehensive review of authentication, Role-Based Access Control (RBAC), multi-tenant data isolation, Prisma database queries, infrastructure security headers, and regression tests.
      </p>
    </div>

    <div class="cover-meta">
      <div><strong>Platform:</strong> Next.js 15, Better-Auth, Prisma ORM, PostgreSQL (Supabase)</div>
      <div><strong>Security Level:</strong> HIGHLY CONFIDENTIAL</div>
      <div><strong>Audit Date:</strong> October 20, 2026</div>
      <div><strong>Auditor:</strong> Senior Application Security Engineer & DevSecOps Specialist</div>
      <div><strong>Automated Test Status:</strong> 7 / 7 Regression Tests PASSED (100%)</div>
    </div>
  </div>

  <!-- Main Content -->
  <div>
    ${contentHtml}
  </div>

</body>
</html>`;

fs.writeFileSync(htmlTempPath, fullHtml, 'utf-8');
console.log('Temporary HTML document written to:', htmlTempPath);

try {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (!fs.existsSync(chromePath)) {
    throw new Error('Google Chrome binary not found at standard path.');
  }

  console.log('Rendering PDF via Headless Chrome...');
  const cmd = `"${chromePath}" --headless=new --disable-gpu --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${htmlTempPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF rendered successfully to:', pdfPath);

  // Clean up temp HTML
  if (fs.existsSync(htmlTempPath)) {
    fs.unlinkSync(htmlTempPath);
  }
  console.log('Security report generation complete.');
} catch (err) {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
}

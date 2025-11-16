import chalk from 'chalk';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Analyzer } from './analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Reporter {
  constructor() {
    this.reportsDir = join(__dirname, '..', 'reports');
    this.configPath = join(__dirname, '..', 'config.json');
    this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    fs.ensureDirSync(this.reportsDir);
  }

  async generate(options) {
    const analyzer = new Analyzer();
    const analysis = analyzer.performAnalysis(analyzer.loadTrackingData(30));

    if (analysis.overview.totalSessions === 0) {
      console.log(chalk.yellow('No tracking data available for report generation.\n'));
      return;
    }

    const format = options.format || 'html';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = options.output || `report_${timestamp}.${format}`;
    const filepath = filename.startsWith('/') ? filename : join(this.reportsDir, filename);

    let content;
    switch (format.toLowerCase()) {
      case 'html':
        content = this.generateHTML(analysis);
        break;
      case 'json':
        content = JSON.stringify(analysis, null, 2);
        break;
      case 'csv':
        content = this.generateCSV(analysis);
        break;
      default:
        console.log(chalk.yellow(`Unknown format: ${format}. Using HTML.`));
        content = this.generateHTML(analysis);
    }

    fs.writeFileSync(filepath, content);
    console.log(chalk.green(`✅ Report generated: ${filepath}\n`));

    if (format === 'html') {
      console.log(chalk.white(`Open in browser: file://${filepath}`));
    }
  }

  generateHTML(analysis) {
    const brandName = this.config.brand.name;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Platform Presence Report - ${brandName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f5f7fa;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    header .subtitle {
      opacity: 0.9;
      font-size: 1.1em;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
    }
    .card h3 {
      color: #667eea;
      margin-bottom: 15px;
      font-size: 1.2em;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .metric:last-child { border-bottom: none; }
    .metric-label { color: #666; }
    .metric-value { font-weight: bold; font-size: 1.1em; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    .platform-card {
      position: relative;
      overflow: hidden;
    }
    .platform-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2);
    }
    .insights-list {
      list-style: none;
    }
    .insights-list li {
      padding: 12px;
      background: #f8f9ff;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 4px solid #667eea;
    }
    .recommendations-list li {
      border-left-color: #27ae60;
      background: #f0fff4;
    }
    .trend {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 500;
    }
    .trend.improving { background: #d4edda; color: #155724; }
    .trend.declining { background: #f8d7da; color: #721c24; }
    .trend.stable { background: #e2e3e5; color: #383d41; }
    .sentiment-indicator {
      font-size: 1.5em;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9em;
    }
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      header h1 { font-size: 1.8em; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🤖 AI Platform Presence Report</h1>
      <div class="subtitle">
        ${brandName} | Generated: ${new Date().toLocaleDateString()} |
        Sessions: ${analysis.overview.totalSessions}
      </div>
    </header>

    <section class="grid">
      ${Object.entries(analysis.platformMetrics).map(([platform, metrics]) => `
        <div class="card platform-card">
          <h3>${platform.toUpperCase()}</h3>
          <div class="metric">
            <span class="metric-label">Brand Mention Rate</span>
            <span class="metric-value">${(metrics.brandMentionRate * 100).toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${metrics.brandMentionRate * 100}%"></div>
          </div>

          <div class="metric">
            <span class="metric-label">Accuracy Score</span>
            <span class="metric-value">${(metrics.avgAccuracy * 100).toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${metrics.avgAccuracy * 100}%"></div>
          </div>

          <div class="metric">
            <span class="metric-label">Sentiment</span>
            <span class="metric-value">
              ${metrics.avgSentiment.toFixed(3)}
              <span class="sentiment-indicator">
                ${metrics.avgSentiment > 0.1 ? '😊' : metrics.avgSentiment < -0.1 ? '😟' : '😐'}
              </span>
            </span>
          </div>

          <div class="metric">
            <span class="metric-label">Sentiment Trend</span>
            <span class="trend ${metrics.sentimentTrend}">${metrics.sentimentTrend}</span>
          </div>

          <div class="metric">
            <span class="metric-label">Success Rate</span>
            <span class="metric-value">${(metrics.successRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      `).join('')}
    </section>

    ${analysis.insights.length > 0 ? `
    <section class="card">
      <h3>💡 Key Insights</h3>
      <ul class="insights-list">
        ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
      </ul>
    </section>
    ` : ''}

    ${analysis.recommendations.length > 0 ? `
    <section class="card" style="margin-top: 20px;">
      <h3>🎯 Recommendations</h3>
      <ul class="insights-list recommendations-list">
        ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </section>
    ` : ''}

    <footer class="footer">
      <p>Generated by AI Platform Tracker | ${brandName}</p>
      <p>Report covers data from ${new Date(analysis.overview.dateRange.start).toLocaleDateString()} to ${new Date(analysis.overview.dateRange.end).toLocaleDateString()}</p>
    </footer>
  </div>
</body>
</html>`;
  }

  generateCSV(analysis) {
    const rows = ['Platform,Metric,Value'];

    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      rows.push(`${platform},Brand Mention Rate,${(metrics.brandMentionRate * 100).toFixed(2)}%`);
      rows.push(`${platform},Average Sentiment,${metrics.avgSentiment.toFixed(4)}`);
      rows.push(`${platform},Sentiment Trend,${metrics.sentimentTrend}`);
      rows.push(`${platform},Average Accuracy,${(metrics.avgAccuracy * 100).toFixed(2)}%`);
      rows.push(`${platform},Accuracy Trend,${metrics.accuracyTrend}`);
      rows.push(`${platform},Success Rate,${(metrics.successRate * 100).toFixed(2)}%`);
      rows.push(`${platform},Total Sessions,${metrics.totalSessions}`);
      rows.push(`${platform},Total Queries,${metrics.totalQueries}`);
    }

    return rows.join('\n');
  }
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const reporter = new Reporter();
  reporter.generate({ format: 'html' }).catch(console.error);
}

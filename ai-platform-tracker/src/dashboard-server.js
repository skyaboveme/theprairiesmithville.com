import express from 'express';
import chalk from 'chalk';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Analyzer } from './analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startDashboard(port = 3001) {
  const app = express();
  const dataDir = join(__dirname, '..', 'data');
  const configPath = join(__dirname, '..', 'config.json');

  app.use(express.json());

  // Serve dashboard HTML
  app.get('/', (req, res) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.send(generateDashboardHTML(config));
  });

  // API: Get configuration
  app.get('/api/config', (req, res) => {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    res.json(config);
  });

  // API: Get tracking data
  app.get('/api/data', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const analyzer = new Analyzer();
    const data = analyzer.loadTrackingData(days);
    res.json(data);
  });

  // API: Get analysis
  app.get('/api/analysis', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const analyzer = new Analyzer();
    const trackingData = analyzer.loadTrackingData(days);
    if (trackingData.length === 0) {
      res.json({ error: 'No tracking data available' });
      return;
    }
    const analysis = analyzer.performAnalysis(trackingData);
    res.json(analysis);
  });

  // API: Get latest session
  app.get('/api/latest', (req, res) => {
    if (!fs.existsSync(dataDir)) {
      res.json({ error: 'No data available' });
      return;
    }
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
      res.json({ error: 'No tracking sessions found' });
      return;
    }
    const latestFile = files.sort().reverse()[0];
    const data = JSON.parse(fs.readFileSync(join(dataDir, latestFile), 'utf8'));
    res.json(data);
  });

  // API: Get platform stats
  app.get('/api/platforms', (req, res) => {
    const analyzer = new Analyzer();
    const trackingData = analyzer.loadTrackingData(30);
    if (trackingData.length === 0) {
      res.json({});
      return;
    }
    const analysis = analyzer.performAnalysis(trackingData);
    res.json(analysis.platformMetrics);
  });

  app.listen(port, () => {
    console.log(chalk.green(`✅ Dashboard server running at http://localhost:${port}`));
    console.log(chalk.white(`\nOpen your browser to view the dashboard`));
    console.log(chalk.yellow(`Press Ctrl+C to stop the server\n`));
  });
}

function generateDashboardHTML(config) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Platform Tracker Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 24px;
      border-bottom: 1px solid #334155;
    }
    .header h1 {
      color: #60a5fa;
      font-size: 1.8em;
      margin-bottom: 8px;
    }
    .header .brand {
      color: #94a3b8;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }
    .controls {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    button:hover { background: #2563eb; transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button.secondary {
      background: #475569;
    }
    button.secondary:hover { background: #64748b; }
    select {
      background: #1e293b;
      color: #e2e8f0;
      border: 1px solid #475569;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #1e293b;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #334155;
    }
    .card h3 {
      color: #60a5fa;
      margin-bottom: 16px;
      font-size: 1.1em;
    }
    .stat {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #334155;
    }
    .stat:last-child { border-bottom: none; }
    .stat-label { color: #94a3b8; }
    .stat-value { font-weight: 600; color: #f1f5f9; }
    .progress {
      width: 100%;
      height: 6px;
      background: #334155;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 6px;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .trend-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
    }
    .trend-improving { background: #065f46; color: #6ee7b7; }
    .trend-declining { background: #7f1d1d; color: #fca5a5; }
    .trend-stable { background: #475569; color: #cbd5e1; }
    .insights-list {
      list-style: none;
    }
    .insights-list li {
      background: #0f172a;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      border-left: 3px solid #3b82f6;
      font-size: 0.95em;
    }
    .recommendations-list li {
      border-left-color: #10b981;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
    .spinner {
      border: 3px solid #334155;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    .empty-state h2 { margin-bottom: 12px; color: #94a3b8; }
    .chart-container {
      background: #0f172a;
      border-radius: 8px;
      padding: 16px;
      margin-top: 12px;
      min-height: 200px;
    }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 150px;
      padding-top: 20px;
    }
    .bar {
      flex: 1;
      background: linear-gradient(180deg, #3b82f6, #1e40af);
      border-radius: 4px 4px 0 0;
      position: relative;
      min-width: 30px;
      transition: height 0.5s ease;
    }
    .bar-label {
      position: absolute;
      bottom: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75em;
      color: #64748b;
      white-space: nowrap;
    }
    .bar-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75em;
      color: #94a3b8;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 6px;
    }
    .status-active { background: #10b981; }
    .status-inactive { background: #ef4444; }
    footer {
      text-align: center;
      padding: 20px;
      color: #475569;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🤖 AI Platform Tracker Dashboard</h1>
    <div class="brand">Monitoring: <strong>${config.brand.name}</strong></div>
  </div>

  <div class="container">
    <div class="controls">
      <button onclick="refreshData()">🔄 Refresh Data</button>
      <select id="timeRange" onchange="changeTimeRange()">
        <option value="7">Last 7 days</option>
        <option value="30" selected>Last 30 days</option>
        <option value="90">Last 90 days</option>
      </select>
      <button class="secondary" onclick="exportData()">📥 Export</button>
    </div>

    <div id="content">
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    </div>
  </div>

  <footer>
    AI Platform Tracker v1.0.0 | ${config.brand.name}
  </footer>

  <script>
    let currentData = null;

    async function loadDashboard() {
      const days = document.getElementById('timeRange').value;
      try {
        const response = await fetch(\`/api/analysis?days=\${days}\`);
        const data = await response.json();

        if (data.error) {
          showEmptyState();
          return;
        }

        currentData = data;
        renderDashboard(data);
      } catch (error) {
        console.error('Error loading data:', error);
        showError();
      }
    }

    function renderDashboard(analysis) {
      const content = document.getElementById('content');

      content.innerHTML = \`
        <div class="grid">
          \${renderOverviewCard(analysis)}
          \${renderPlatformCards(analysis)}
        </div>

        <div class="grid">
          <div class="card">
            <h3>📈 Brand Mention Rates</h3>
            <div class="chart-container">
              \${renderMentionChart(analysis)}
            </div>
          </div>
          <div class="card">
            <h3>🎯 Accuracy Scores</h3>
            <div class="chart-container">
              \${renderAccuracyChart(analysis)}
            </div>
          </div>
        </div>

        \${renderInsights(analysis)}
        \${renderRecommendations(analysis)}
      \`;
    }

    function renderOverviewCard(analysis) {
      return \`
        <div class="card">
          <h3>📊 Overview</h3>
          <div class="stat">
            <span class="stat-label">Total Sessions</span>
            <span class="stat-value">\${analysis.overview.totalSessions}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Date Range</span>
            <span class="stat-value">
              \${new Date(analysis.overview.dateRange.start).toLocaleDateString()} -
              \${new Date(analysis.overview.dateRange.end).toLocaleDateString()}
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">Platforms Tracked</span>
            <span class="stat-value">\${Object.keys(analysis.platformMetrics).length}</span>
          </div>
        </div>
      \`;
    }

    function renderPlatformCards(analysis) {
      return Object.entries(analysis.platformMetrics).map(([platform, metrics]) => \`
        <div class="card">
          <h3>
            <span class="status-indicator status-active"></span>
            \${platform.toUpperCase()}
          </h3>
          <div class="stat">
            <span class="stat-label">Mention Rate</span>
            <span class="stat-value">\${(metrics.brandMentionRate * 100).toFixed(1)}%</span>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width: \${metrics.brandMentionRate * 100}%"></div>
          </div>

          <div class="stat">
            <span class="stat-label">Accuracy</span>
            <span class="stat-value">\${(metrics.avgAccuracy * 100).toFixed(1)}%</span>
          </div>
          <div class="progress">
            <div class="progress-bar" style="width: \${metrics.avgAccuracy * 100}%"></div>
          </div>

          <div class="stat">
            <span class="stat-label">Sentiment</span>
            <span class="stat-value">
              \${metrics.avgSentiment.toFixed(3)}
              \${metrics.avgSentiment > 0.1 ? '😊' : metrics.avgSentiment < -0.1 ? '😟' : '😐'}
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">Trend</span>
            <span class="trend-badge trend-\${metrics.sentimentTrend}">\${metrics.sentimentTrend}</span>
          </div>
        </div>
      \`).join('');
    }

    function renderMentionChart(analysis) {
      const platforms = Object.entries(analysis.platformMetrics);
      const maxRate = Math.max(...platforms.map(([, m]) => m.brandMentionRate));

      return \`
        <div class="bar-chart">
          \${platforms.map(([platform, metrics]) => {
            const height = (metrics.brandMentionRate / Math.max(maxRate, 0.1)) * 100;
            return \`
              <div class="bar" style="height: \${height}%">
                <span class="bar-value">\${(metrics.brandMentionRate * 100).toFixed(0)}%</span>
                <span class="bar-label">\${platform}</span>
              </div>
            \`;
          }).join('')}
        </div>
      \`;
    }

    function renderAccuracyChart(analysis) {
      const platforms = Object.entries(analysis.platformMetrics);

      return \`
        <div class="bar-chart">
          \${platforms.map(([platform, metrics]) => {
            const height = metrics.avgAccuracy * 100;
            return \`
              <div class="bar" style="height: \${height}%">
                <span class="bar-value">\${(metrics.avgAccuracy * 100).toFixed(0)}%</span>
                <span class="bar-label">\${platform}</span>
              </div>
            \`;
          }).join('')}
        </div>
      \`;
    }

    function renderInsights(analysis) {
      if (!analysis.insights || analysis.insights.length === 0) return '';

      return \`
        <div class="card">
          <h3>💡 Key Insights</h3>
          <ul class="insights-list">
            \${analysis.insights.map(insight => \`<li>\${insight}</li>\`).join('')}
          </ul>
        </div>
      \`;
    }

    function renderRecommendations(analysis) {
      if (!analysis.recommendations || analysis.recommendations.length === 0) return '';

      return \`
        <div class="card" style="margin-top: 20px;">
          <h3>🎯 Recommendations</h3>
          <ul class="insights-list recommendations-list">
            \${analysis.recommendations.map(rec => \`<li>\${rec}</li>\`).join('')}
          </ul>
        </div>
      \`;
    }

    function showEmptyState() {
      document.getElementById('content').innerHTML = \`
        <div class="empty-state">
          <h2>No Tracking Data Available</h2>
          <p>Run your first tracking session to see data here.</p>
          <p style="margin-top: 12px; font-family: monospace;">
            npm run track
          </p>
        </div>
      \`;
    }

    function showError() {
      document.getElementById('content').innerHTML = \`
        <div class="empty-state">
          <h2>Error Loading Data</h2>
          <p>Unable to fetch tracking data. Please try again.</p>
        </div>
      \`;
    }

    function refreshData() {
      document.getElementById('content').innerHTML = \`
        <div class="loading">
          <div class="spinner"></div>
          <p>Refreshing data...</p>
        </div>
      \`;
      loadDashboard();
    }

    function changeTimeRange() {
      refreshData();
    }

    function exportData() {
      if (!currentData) {
        alert('No data available to export');
        return;
      }
      const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`ai-tracker-export-\${new Date().toISOString().split('T')[0]}.json\`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // Initial load
    loadDashboard();

    // Auto-refresh every 5 minutes
    setInterval(loadDashboard, 300000);
  </script>
</body>
</html>`;
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startDashboard(process.env.DASHBOARD_PORT || 3001);
}

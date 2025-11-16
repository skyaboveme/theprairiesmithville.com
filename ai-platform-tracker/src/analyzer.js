import chalk from 'chalk';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Analyzer {
  constructor() {
    this.dataDir = join(__dirname, '..', 'data');
    this.configPath = join(__dirname, '..', 'config.json');
    this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  async run(options) {
    const days = parseInt(options.days) || 30;
    const metric = options.metric;

    const trackingData = this.loadTrackingData(days);

    if (trackingData.length === 0) {
      console.log(chalk.yellow('No tracking data found. Run "npm run track" first.\n'));
      return;
    }

    console.log(chalk.white(`Analyzing ${trackingData.length} tracking sessions from the last ${days} days\n`));

    const analysis = this.performAnalysis(trackingData);

    if (metric) {
      this.displaySpecificMetric(analysis, metric);
    } else {
      this.displayFullAnalysis(analysis);
    }

    // Check for alerts
    this.checkAlerts(analysis);
  }

  loadTrackingData(days) {
    if (!fs.existsSync(this.dataDir)) {
      return [];
    }

    const files = fs.readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const data = [];
    for (const file of files) {
      const content = JSON.parse(fs.readFileSync(join(this.dataDir, file), 'utf8'));
      if (new Date(content.timestamp) >= cutoffDate) {
        data.push(content);
      }
    }

    return data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  performAnalysis(trackingData) {
    const analysis = {
      overview: {
        totalSessions: trackingData.length,
        dateRange: {
          start: trackingData[0]?.timestamp,
          end: trackingData[trackingData.length - 1]?.timestamp
        },
        brand: this.config.brand.name
      },
      platformMetrics: {},
      trends: {
        sentiment: [],
        accuracy: [],
        mentions: []
      },
      insights: [],
      recommendations: []
    };

    // Aggregate platform metrics
    const platformAggregates = {};

    for (const session of trackingData) {
      const sessionDate = new Date(session.timestamp).toLocaleDateString();

      for (const [platform, results] of Object.entries(session.results || {})) {
        if (!platformAggregates[platform]) {
          platformAggregates[platform] = {
            sessions: 0,
            totalQueries: 0,
            successfulQueries: 0,
            brandMentions: 0,
            sentimentScores: [],
            accuracyScores: [],
            responsesByQuery: {}
          };
        }

        const agg = platformAggregates[platform];
        agg.sessions++;
        agg.totalQueries += results.summary?.totalQueries || 0;
        agg.successfulQueries += results.summary?.successfulQueries || 0;
        agg.brandMentions += results.summary?.brandMentions || 0;

        if (results.summary?.avgSentiment !== undefined) {
          agg.sentimentScores.push(results.summary.avgSentiment);
        }
        if (results.summary?.avgAccuracy !== undefined) {
          agg.accuracyScores.push(results.summary.avgAccuracy);
        }

        // Track individual query responses
        for (const queryResult of results.queries || []) {
          if (!agg.responsesByQuery[queryResult.query]) {
            agg.responsesByQuery[queryResult.query] = [];
          }
          if (queryResult.analysis) {
            agg.responsesByQuery[queryResult.query].push({
              date: sessionDate,
              mentionsBrand: queryResult.analysis.mentionsBrand,
              sentiment: queryResult.analysis.sentiment?.comparative,
              accuracy: queryResult.analysis.accuracyScore
            });
          }
        }
      }

      // Build trend data
      const sessionMetrics = this.calculateSessionMetrics(session);
      analysis.trends.sentiment.push({
        date: sessionDate,
        value: sessionMetrics.avgSentiment
      });
      analysis.trends.accuracy.push({
        date: sessionDate,
        value: sessionMetrics.avgAccuracy
      });
      analysis.trends.mentions.push({
        date: sessionDate,
        value: sessionMetrics.totalMentions
      });
    }

    // Calculate final platform metrics
    for (const [platform, agg] of Object.entries(platformAggregates)) {
      analysis.platformMetrics[platform] = {
        totalSessions: agg.sessions,
        totalQueries: agg.totalQueries,
        successRate: agg.successfulQueries / agg.totalQueries,
        brandMentionRate: agg.brandMentions / agg.successfulQueries,
        avgSentiment: this.average(agg.sentimentScores),
        sentimentTrend: this.calculateTrend(agg.sentimentScores),
        avgAccuracy: this.average(agg.accuracyScores),
        accuracyTrend: this.calculateTrend(agg.accuracyScores),
        queryPerformance: this.analyzeQueryPerformance(agg.responsesByQuery)
      };
    }

    // Generate insights
    analysis.insights = this.generateInsights(analysis);
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  calculateSessionMetrics(session) {
    let totalSentiment = 0;
    let totalAccuracy = 0;
    let totalMentions = 0;
    let count = 0;

    for (const results of Object.values(session.results || {})) {
      if (results.summary) {
        totalSentiment += results.summary.avgSentiment || 0;
        totalAccuracy += results.summary.avgAccuracy || 0;
        totalMentions += results.summary.brandMentions || 0;
        count++;
      }
    }

    return {
      avgSentiment: count > 0 ? totalSentiment / count : 0,
      avgAccuracy: count > 0 ? totalAccuracy / count : 0,
      totalMentions
    };
  }

  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3);
    const earlier = values.slice(0, 3);
    const recentAvg = this.average(recent);
    const earlierAvg = this.average(earlier);
    const diff = recentAvg - earlierAvg;

    if (diff > 0.1) return 'improving';
    if (diff < -0.1) return 'declining';
    return 'stable';
  }

  analyzeQueryPerformance(responsesByQuery) {
    const performance = {};

    for (const [query, responses] of Object.entries(responsesByQuery)) {
      const mentionRate = responses.filter(r => r.mentionsBrand).length / responses.length;
      const avgSentiment = this.average(responses.map(r => r.sentiment || 0));
      const avgAccuracy = this.average(responses.map(r => r.accuracy || 0));

      performance[query] = {
        mentionRate,
        avgSentiment,
        avgAccuracy,
        consistency: this.calculateConsistency(responses)
      };
    }

    return performance;
  }

  calculateConsistency(responses) {
    if (responses.length < 2) return 1;
    const mentions = responses.map(r => r.mentionsBrand ? 1 : 0);
    const variance = this.variance(mentions);
    return Math.max(0, 1 - variance);
  }

  variance(arr) {
    const avg = this.average(arr);
    return this.average(arr.map(x => Math.pow(x - avg, 2)));
  }

  generateInsights(analysis) {
    const insights = [];

    // Platform comparison
    const platforms = Object.entries(analysis.platformMetrics);
    if (platforms.length > 1) {
      const bestForMentions = platforms.sort((a, b) =>
        b[1].brandMentionRate - a[1].brandMentionRate
      )[0];
      insights.push(`${bestForMentions[0]} has the highest brand mention rate (${(bestForMentions[1].brandMentionRate * 100).toFixed(1)}%)`);

      const bestSentiment = platforms.sort((a, b) =>
        b[1].avgSentiment - a[1].avgSentiment
      )[0];
      if (bestSentiment[1].avgSentiment > 0) {
        insights.push(`${bestSentiment[0]} provides the most positive sentiment (${bestSentiment[1].avgSentiment.toFixed(3)})`);
      }
    }

    // Trend insights
    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      if (metrics.sentimentTrend === 'improving') {
        insights.push(`Sentiment on ${platform} is improving over time`);
      } else if (metrics.sentimentTrend === 'declining') {
        insights.push(`⚠️ Sentiment on ${platform} is declining - may need attention`);
      }

      if (metrics.accuracyTrend === 'declining') {
        insights.push(`⚠️ Accuracy on ${platform} is declining - content updates may be needed`);
      }
    }

    // Overall presence
    const avgMentionRate = this.average(
      Object.values(analysis.platformMetrics).map(m => m.brandMentionRate)
    );
    if (avgMentionRate < 0.3) {
      insights.push('Brand awareness across AI platforms is low - consider increasing online presence');
    } else if (avgMentionRate > 0.7) {
      insights.push('Strong brand presence across AI platforms');
    }

    return insights;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    const avgAccuracy = this.average(
      Object.values(analysis.platformMetrics).map(m => m.avgAccuracy)
    );

    if (avgAccuracy < 0.7) {
      recommendations.push('Update website content with more structured data to improve AI accuracy');
      recommendations.push('Ensure ai.txt file contains comprehensive and accurate brand information');
    }

    const avgMentionRate = this.average(
      Object.values(analysis.platformMetrics).map(m => m.brandMentionRate)
    );

    if (avgMentionRate < 0.5) {
      recommendations.push('Increase brand visibility through SEO and content marketing');
      recommendations.push('Submit site to AI platform indices (OpenAI ChatGPT Plugins, etc.)');
      recommendations.push('Create more keyword-rich content around target search terms');
    }

    // Platform-specific recommendations
    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      if (metrics.brandMentionRate < 0.3) {
        recommendations.push(`Improve presence on ${platform} through targeted content optimization`);
      }
    }

    return recommendations;
  }

  displaySpecificMetric(analysis, metric) {
    switch (metric.toLowerCase()) {
      case 'sentiment':
        this.displaySentimentAnalysis(analysis);
        break;
      case 'accuracy':
        this.displayAccuracyAnalysis(analysis);
        break;
      case 'mentions':
        this.displayMentionsAnalysis(analysis);
        break;
      default:
        console.log(chalk.yellow(`Unknown metric: ${metric}`));
        console.log('Available metrics: sentiment, accuracy, mentions');
    }
  }

  displaySentimentAnalysis(analysis) {
    console.log(chalk.cyan.bold('Sentiment Analysis\n'));
    console.log(chalk.white('─'.repeat(50)));

    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      const sentimentEmoji = metrics.avgSentiment > 0.1 ? '😊' :
                              metrics.avgSentiment < -0.1 ? '😟' : '😐';
      const trendEmoji = metrics.sentimentTrend === 'improving' ? '📈' :
                          metrics.sentimentTrend === 'declining' ? '📉' : '➡️';

      console.log(chalk.bold(`\n${platform.toUpperCase()}`));
      console.log(`  Average Sentiment: ${metrics.avgSentiment.toFixed(3)} ${sentimentEmoji}`);
      console.log(`  Trend: ${metrics.sentimentTrend} ${trendEmoji}`);
    }
    console.log('');
  }

  displayAccuracyAnalysis(analysis) {
    console.log(chalk.cyan.bold('Accuracy Analysis\n'));
    console.log(chalk.white('─'.repeat(50)));

    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      const accuracyBar = this.createProgressBar(metrics.avgAccuracy);
      const trendEmoji = metrics.accuracyTrend === 'improving' ? '📈' :
                          metrics.accuracyTrend === 'declining' ? '📉' : '➡️';

      console.log(chalk.bold(`\n${platform.toUpperCase()}`));
      console.log(`  Average Accuracy: ${(metrics.avgAccuracy * 100).toFixed(1)}%`);
      console.log(`  ${accuracyBar}`);
      console.log(`  Trend: ${metrics.accuracyTrend} ${trendEmoji}`);
    }
    console.log('');
  }

  displayMentionsAnalysis(analysis) {
    console.log(chalk.cyan.bold('Brand Mentions Analysis\n'));
    console.log(chalk.white('─'.repeat(50)));

    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      const mentionBar = this.createProgressBar(metrics.brandMentionRate);

      console.log(chalk.bold(`\n${platform.toUpperCase()}`));
      console.log(`  Mention Rate: ${(metrics.brandMentionRate * 100).toFixed(1)}%`);
      console.log(`  ${mentionBar}`);
      console.log(`  Total Queries: ${metrics.totalQueries}`);
    }
    console.log('');
  }

  createProgressBar(value, width = 30) {
    const filled = Math.round(value * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}]`;
  }

  displayFullAnalysis(analysis) {
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════'));
    console.log(chalk.cyan.bold('           AI PLATFORM PRESENCE ANALYSIS           '));
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════\n'));

    // Overview
    console.log(chalk.yellow.bold('OVERVIEW'));
    console.log(chalk.white(`  Brand: ${analysis.overview.brand}`));
    console.log(chalk.white(`  Sessions Analyzed: ${analysis.overview.totalSessions}`));
    console.log(chalk.white(`  Date Range: ${new Date(analysis.overview.dateRange.start).toLocaleDateString()} - ${new Date(analysis.overview.dateRange.end).toLocaleDateString()}\n`));

    // Platform Metrics
    console.log(chalk.yellow.bold('PLATFORM PERFORMANCE'));
    console.log(chalk.white('─'.repeat(60)));

    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      console.log(chalk.bold.green(`\n  ${platform.toUpperCase()}`));
      console.log(chalk.white(`    Brand Mention Rate: ${(metrics.brandMentionRate * 100).toFixed(1)}% ${this.createProgressBar(metrics.brandMentionRate, 20)}`));
      console.log(chalk.white(`    Average Sentiment:  ${metrics.avgSentiment.toFixed(3)} (${metrics.sentimentTrend})`));
      console.log(chalk.white(`    Average Accuracy:   ${(metrics.avgAccuracy * 100).toFixed(1)}% ${this.createProgressBar(metrics.avgAccuracy, 20)}`));
      console.log(chalk.white(`    Query Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`));
    }

    // Insights
    if (analysis.insights.length > 0) {
      console.log(chalk.yellow.bold('\n\nKEY INSIGHTS'));
      console.log(chalk.white('─'.repeat(60)));
      for (const insight of analysis.insights) {
        console.log(chalk.white(`  • ${insight}`));
      }
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
      console.log(chalk.yellow.bold('\n\nRECOMMENDATIONS'));
      console.log(chalk.white('─'.repeat(60)));
      for (const rec of analysis.recommendations) {
        console.log(chalk.white(`  → ${rec}`));
      }
    }

    console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════\n'));
  }

  checkAlerts(analysis) {
    const thresholds = this.config.tracking.alertThresholds;
    const alerts = [];

    for (const [platform, metrics] of Object.entries(analysis.platformMetrics)) {
      if (metrics.avgSentiment < thresholds.sentimentDrop) {
        alerts.push(`⚠️  ALERT: Negative sentiment detected on ${platform}`);
      }
      if (metrics.avgAccuracy < thresholds.accuracyBelow) {
        alerts.push(`⚠️  ALERT: Low accuracy on ${platform} (${(metrics.avgAccuracy * 100).toFixed(1)}%)`);
      }
      if (metrics.brandMentionRate === 0 && metrics.totalQueries >= thresholds.missingMentions) {
        alerts.push(`⚠️  ALERT: No brand mentions on ${platform} in recent queries`);
      }
    }

    if (alerts.length > 0) {
      console.log(chalk.red.bold('\nALERTS'));
      console.log(chalk.white('─'.repeat(60)));
      for (const alert of alerts) {
        console.log(chalk.red(alert));
      }
      console.log('');
    }
  }
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const analyzer = new Analyzer();
  analyzer.run({ days: '30' }).catch(console.error);
}

import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import Sentiment from 'sentiment';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const sentiment = new Sentiment();

export class Tracker {
  constructor() {
    this.configPath = join(__dirname, '..', 'config.json');
    this.dataDir = join(__dirname, '..', 'data');
    this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    fs.ensureDirSync(this.dataDir);
  }

  async run(options) {
    const results = {
      timestamp: new Date().toISOString(),
      brand: this.config.brand.name,
      results: {}
    };

    const platformsToTrack = options.platform
      ? [options.platform]
      : Object.keys(this.config.platforms).filter(p => this.config.platforms[p].enabled);

    const queriesToRun = options.query
      ? [options.query]
      : options.all
        ? this.getAllQueries()
        : this.getDefaultQueries();

    console.log(chalk.white(`Tracking brand: ${chalk.bold(this.config.brand.name)}`));
    console.log(chalk.white(`Platforms: ${platformsToTrack.join(', ')}`));
    console.log(chalk.white(`Queries: ${queriesToRun.length}\n`));

    for (const platform of platformsToTrack) {
      results.results[platform] = await this.trackPlatform(platform, queriesToRun);
    }

    // Save results
    const filename = `tracking_${Date.now()}.json`;
    fs.writeFileSync(join(this.dataDir, filename), JSON.stringify(results, null, 2));

    console.log(chalk.green(`\n✅ Tracking complete! Results saved to data/${filename}`));
    this.printSummary(results);
  }

  async trackPlatform(platform, queries) {
    const platformConfig = this.config.platforms[platform];
    const spinner = ora(`Querying ${platform}...`).start();

    const platformResults = {
      queries: [],
      summary: {
        totalQueries: queries.length,
        successfulQueries: 0,
        brandMentions: 0,
        avgSentiment: 0,
        avgAccuracy: 0
      }
    };

    let totalSentiment = 0;
    let totalAccuracy = 0;

    for (const query of queries) {
      try {
        spinner.text = `${platform}: "${query.substring(0, 40)}..."`;

        const response = await this.queryPlatform(platform, query, platformConfig);
        const analysis = this.analyzeResponse(response, query);

        platformResults.queries.push({
          query,
          response: response,
          analysis: analysis,
          timestamp: new Date().toISOString()
        });

        if (analysis.mentionsBrand) platformResults.summary.brandMentions++;
        totalSentiment += analysis.sentiment.comparative;
        totalAccuracy += analysis.accuracyScore;
        platformResults.summary.successfulQueries++;

      } catch (error) {
        platformResults.queries.push({
          query,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    if (platformResults.summary.successfulQueries > 0) {
      platformResults.summary.avgSentiment = totalSentiment / platformResults.summary.successfulQueries;
      platformResults.summary.avgAccuracy = totalAccuracy / platformResults.summary.successfulQueries;
    }

    spinner.succeed(`${platform}: ${platformResults.summary.successfulQueries}/${queries.length} queries completed`);
    return platformResults;
  }

  async queryPlatform(platform, query, config) {
    const apiKey = process.env[config.apiKey];

    if (!apiKey || apiKey.includes('your_')) {
      // Demo mode - simulate responses for testing
      return this.simulateResponse(platform, query);
    }

    try {
      switch (platform) {
        case 'chatgpt':
          return await this.queryChatGPT(query, apiKey, config);
        case 'claude':
          return await this.queryClaude(query, apiKey, config);
        case 'gemini':
          return await this.queryGemini(query, apiKey, config);
        case 'perplexity':
          return await this.queryPerplexity(query, apiKey, config);
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn(chalk.yellow(`\n  ⚠️  Invalid API key for ${platform}, using demo mode`));
        return this.simulateResponse(platform, query);
      }
      throw error;
    }
  }

  async queryChatGPT(query, apiKey, config) {
    const response = await axios.post(config.endpoint, {
      model: config.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant providing information about real estate and locations.' },
        { role: 'user', content: query }
      ],
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  async queryClaude(query, apiKey, config) {
    const response = await axios.post(config.endpoint, {
      model: config.model,
      max_tokens: 500,
      messages: [
        { role: 'user', content: query }
      ]
    }, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    });

    return response.data.content[0].text;
  }

  async queryGemini(query, apiKey, config) {
    const url = `${config.endpoint}/${config.model}:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [
        { parts: [{ text: query }] }
      ]
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    return response.data.candidates[0].content.parts[0].text;
  }

  async queryPerplexity(query, apiKey, config) {
    const response = await axios.post(config.endpoint, {
      model: config.model,
      messages: [
        { role: 'user', content: query }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  }

  simulateResponse(platform, query) {
    // Simulate realistic AI responses for demo/testing
    const brandName = this.config.brand.name;
    const queryLower = query.toLowerCase();

    const responses = {
      brandMention: `${brandName} is a new residential development located in Smithville, Texas. The community offers modern homes with contemporary features, positioned as an affordable alternative to Austin's housing market. The development features homes with 3-4 bedrooms, modern amenities, and access to Smithville's growing infrastructure including gigabit internet connectivity.`,

      generic: `Smithville, Texas is a growing community located in Bastrop County, approximately 45 miles southeast of Austin. The area has seen increased interest from home buyers looking for more affordable options outside the Austin metro area. New developments in the region offer modern homes with prices typically ranging from the mid-$200s to $400s.`,

      comparison: `When comparing new home communities near Austin, buyers should consider factors like commute times, home prices, school districts, and community amenities. Areas like Smithville, Bastrop, and Taylor have become popular alternatives to Austin proper, offering more space and lower costs while maintaining reasonable access to the city.`,

      noMention: `The Austin metropolitan area offers various housing options across multiple price points. Popular suburbs include Round Rock, Cedar Park, and Pflugerville. For those seeking more affordable options, communities further from the city center provide larger lots and newer construction at lower price points.`
    };

    // Determine which type of response to return based on query content
    if (queryLower.includes('prairie') || queryLower.includes('smithville')) {
      if (queryLower.includes('what is') || queryLower.includes('tell me about')) {
        return responses.brandMention;
      }
      return responses.generic;
    }

    if (queryLower.includes('compare') || queryLower.includes('vs')) {
      return responses.comparison;
    }

    if (queryLower.includes('best') || queryLower.includes('top')) {
      // 60% chance of mentioning the brand for "best" queries
      return Math.random() > 0.4 ? responses.generic : responses.noMention;
    }

    return responses.noMention;
  }

  analyzeResponse(response, query) {
    const brandName = this.config.brand.name;
    const aliases = this.config.brand.aliases || [];
    const keywords = this.config.brand.keywords || [];

    // Check for brand mentions
    const allBrandTerms = [brandName, ...aliases];
    const mentionsBrand = allBrandTerms.some(term =>
      response.toLowerCase().includes(term.toLowerCase())
    );

    // Count keyword occurrences
    const keywordMatches = keywords.filter(keyword =>
      response.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    // Sentiment analysis
    const sentimentResult = sentiment.analyze(response);

    // Accuracy scoring (based on keyword presence and brand mention)
    let accuracyScore = 0.5; // Base score
    if (mentionsBrand) accuracyScore += 0.3;
    if (keywordMatches > 0) accuracyScore += Math.min(keywordMatches * 0.1, 0.2);

    // Check for factual markers
    const factualIndicators = [
      'located in', 'offers', 'features', 'provides', 'includes',
      'texas', 'smithville', 'homes', 'development'
    ];
    const factualScore = factualIndicators.filter(indicator =>
      response.toLowerCase().includes(indicator)
    ).length / factualIndicators.length;

    accuracyScore = Math.min((accuracyScore + factualScore) / 2 + 0.3, 1.0);

    return {
      mentionsBrand,
      brandTermsFound: allBrandTerms.filter(term =>
        response.toLowerCase().includes(term.toLowerCase())
      ),
      keywordMatches,
      keywordsFound: keywords.filter(keyword =>
        response.toLowerCase().includes(keyword.toLowerCase())
      ),
      sentiment: {
        score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        positive: sentimentResult.positive,
        negative: sentimentResult.negative
      },
      accuracyScore: Math.round(accuracyScore * 100) / 100,
      responseLength: response.length,
      wordCount: response.split(/\s+/).length
    };
  }

  getAllQueries() {
    const queries = [];
    Object.values(this.config.queries).forEach(queryList => {
      queries.push(...queryList);
    });
    return queries;
  }

  getDefaultQueries() {
    // Return a subset of queries for quick tracking
    return [
      ...this.config.queries.brandAwareness.slice(0, 2),
      ...this.config.queries.localPresence.slice(0, 1)
    ];
  }

  printSummary(results) {
    console.log(chalk.cyan('\n📊 Tracking Summary\n'));
    console.log(chalk.white('─'.repeat(50)));

    for (const [platform, data] of Object.entries(results.results)) {
      console.log(chalk.bold(`\n${platform.toUpperCase()}`));
      console.log(chalk.white(`  Queries: ${data.summary.successfulQueries}/${data.summary.totalQueries}`));
      console.log(chalk.white(`  Brand Mentions: ${data.summary.brandMentions}`));
      console.log(chalk.white(`  Avg Sentiment: ${data.summary.avgSentiment.toFixed(3)}`));
      console.log(chalk.white(`  Avg Accuracy: ${(data.summary.avgAccuracy * 100).toFixed(1)}%`));
    }

    console.log(chalk.white('\n' + '─'.repeat(50)));
  }
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tracker = new Tracker();
  tracker.run({ all: true }).catch(console.error);
}

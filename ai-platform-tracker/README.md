# AI Platform Tracker

Monitor and analyze your brand's presence across major AI platforms like ChatGPT, Claude, Gemini, and Perplexity.

## Features

- **Multi-Platform Tracking**: Query ChatGPT, Claude, Gemini, and Perplexity simultaneously
- **Brand Mention Detection**: Track how often your brand is mentioned in AI responses
- **Sentiment Analysis**: Measure the tone and sentiment of responses about your brand
- **Accuracy Scoring**: Evaluate how accurately AI platforms represent your brand information
- **Trend Analysis**: Monitor changes in presence over time
- **Interactive Dashboard**: Visual web dashboard for real-time insights
- **Automated Reports**: Generate HTML, JSON, or CSV reports
- **Alert System**: Get notified when metrics fall below thresholds
- **Demo Mode**: Test without API keys using simulated responses

## Quick Start

### 1. Install Dependencies

```bash
cd ai-platform-tracker
npm install
```

### 2. Configure Your Brand

Edit `config.json` to customize:
- Your brand name and aliases
- Target keywords to track
- Competitor brands
- Query templates
- Alert thresholds

Or run the setup wizard:
```bash
npm start setup
```

### 3. Add API Keys (Optional)

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Then edit `.env`:
```
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
PERPLEXITY_API_KEY=your_perplexity_key
```

**Note**: Without API keys, the tracker runs in demo mode with simulated responses.

### 4. Run Your First Track

```bash
npm run track
```

### 5. View Results

Start the dashboard:
```bash
npm run dashboard
```

Then open `http://localhost:3001` in your browser.

## Commands

### Main CLI

```bash
npm start [command]
```

Available commands:
- `track` - Run a tracking session
- `analyze` - Analyze collected data
- `report` - Generate reports
- `dashboard` - Start web dashboard
- `setup` - Interactive setup wizard
- `status` - Show current status

### Tracking

```bash
# Track all configured queries
npm run track -- --all

# Track specific platform
npm run track -- --platform chatgpt

# Custom query
npm run track -- --query "What is The Prairie Smithville?"
```

### Analysis

```bash
# Analyze last 30 days (default)
npm run analyze

# Analyze last 90 days
npm run analyze -- --days 90

# Specific metric
npm run analyze -- --metric sentiment
npm run analyze -- --metric accuracy
npm run analyze -- --metric mentions
```

### Reports

```bash
# Generate HTML report
npm run report

# Generate JSON report
npm run report -- --format json

# Generate CSV report
npm run report -- --format csv

# Custom output path
npm run report -- --output /path/to/report.html
```

## Configuration

### Brand Settings

```json
{
  "brand": {
    "name": "Your Brand Name",
    "aliases": ["Brand", "YourBrand", "Your Brand Inc"],
    "domain": "yourbrand.com",
    "keywords": ["your product", "your service", "industry term"]
  }
}
```

### Platform Configuration

Enable/disable platforms and configure API endpoints:

```json
{
  "platforms": {
    "chatgpt": {
      "enabled": true,
      "apiKey": "OPENAI_API_KEY",
      "model": "gpt-4"
    }
  }
}
```

### Query Templates

Customize the queries used for tracking:

```json
{
  "queries": {
    "brandAwareness": [
      "What is [Your Brand]?",
      "Tell me about [Your Brand]"
    ],
    "competitorAnalysis": [
      "Compare [Your Brand] vs [Competitor]"
    ]
  }
}
```

### Alert Thresholds

Configure when to trigger alerts:

```json
{
  "tracking": {
    "alertThresholds": {
      "sentimentDrop": -0.3,
      "accuracyBelow": 0.7,
      "missingMentions": 3
    }
  }
}
```

## Data Storage

Tracking data is stored in the `data/` directory as JSON files:

```
data/
  tracking_1699900000000.json
  tracking_1699903600000.json
  ...
```

Each file contains:
- Timestamp
- Platform results
- Query responses
- Analysis metrics (sentiment, accuracy, brand mentions)

## Dashboard Features

The web dashboard provides:

- **Real-time metrics** for each platform
- **Visual charts** for brand mention rates and accuracy scores
- **Sentiment tracking** with trend indicators
- **Key insights** automatically generated
- **Recommendations** based on analysis
- **Export functionality** for offline analysis
- **Auto-refresh** every 5 minutes

## API Endpoints

The dashboard server exposes these endpoints:

- `GET /api/config` - Current configuration
- `GET /api/data?days=30` - Raw tracking data
- `GET /api/analysis?days=30` - Processed analysis
- `GET /api/latest` - Most recent tracking session
- `GET /api/platforms` - Platform-specific metrics

## Best Practices

1. **Regular Tracking**: Run tracking sessions weekly or monthly for trend analysis
2. **Keyword Optimization**: Update keywords based on insights
3. **Content Updates**: Use recommendations to improve your online presence
4. **Monitor Competitors**: Track competitor mentions for market intelligence
5. **Accuracy Focus**: High accuracy scores indicate good SEO and structured data

## Improving Your AI Presence

Based on tracking results, consider:

1. **Enhance your ai.txt file** with comprehensive, structured information
2. **Add Schema.org markup** to your website
3. **Create FAQ content** that AI platforms can reference
4. **Build authoritative backlinks** to establish credibility
5. **Submit to AI indices** (ChatGPT Plugins, etc.)
6. **Keep information current** and consistent across platforms

## Troubleshooting

### No data showing in dashboard
- Ensure you've run at least one tracking session: `npm run track`
- Check that the data directory exists and contains JSON files

### API errors
- Verify API keys are correct in `.env`
- Check API rate limits haven't been exceeded
- Ensure sufficient API credits

### Sentiment seems off
- Sentiment analysis uses general English patterns
- Consider context - technical content may score neutral

## Project Structure

```
ai-platform-tracker/
├── src/
│   ├── index.js           # Main CLI entry point
│   ├── tracker.js         # Core tracking engine
│   ├── analyzer.js        # Data analysis module
│   ├── reporter.js        # Report generation
│   └── dashboard-server.js # Web dashboard server
├── data/                  # Tracking data storage
├── reports/               # Generated reports
├── config.json            # Configuration file
├── package.json           # Dependencies
├── .env                   # API keys (not in repo)
└── README.md              # This file
```

## License

MIT

## Support

For issues and feature requests, please contact the development team.

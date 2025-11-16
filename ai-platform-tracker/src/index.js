#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { Tracker } from './tracker.js';
import { Analyzer } from './analyzer.js';
import { Reporter } from './reporter.js';
import { startDashboard } from './dashboard-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const program = new Command();

program
  .name('ai-tracker')
  .description(chalk.green('🤖 AI Platform Brand Tracker - Monitor your presence across AI platforms'))
  .version(packageJson.version);

program
  .command('track')
  .description('Run a tracking session across configured AI platforms')
  .option('-p, --platform <platform>', 'Track specific platform (chatgpt, claude, gemini, perplexity)')
  .option('-q, --query <query>', 'Custom query to track')
  .option('--all', 'Track all configured queries')
  .action(async (options) => {
    console.log(chalk.cyan('\n🔍 Starting AI Platform Tracking Session...\n'));
    const tracker = new Tracker();
    await tracker.run(options);
  });

program
  .command('analyze')
  .description('Analyze collected tracking data')
  .option('-d, --days <days>', 'Analyze data from last N days', '30')
  .option('-m, --metric <metric>', 'Specific metric to analyze (sentiment, accuracy, mentions)')
  .action(async (options) => {
    console.log(chalk.cyan('\n📊 Analyzing tracking data...\n'));
    const analyzer = new Analyzer();
    await analyzer.run(options);
  });

program
  .command('report')
  .description('Generate a comprehensive report')
  .option('-f, --format <format>', 'Report format (json, html, csv)', 'html')
  .option('-o, --output <path>', 'Output file path')
  .action(async (options) => {
    console.log(chalk.cyan('\n📝 Generating report...\n'));
    const reporter = new Reporter();
    await reporter.generate(options);
  });

program
  .command('dashboard')
  .description('Start the web dashboard')
  .option('-p, --port <port>', 'Dashboard port', '3001')
  .action(async (options) => {
    console.log(chalk.cyan('\n🖥️  Starting dashboard server...\n'));
    await startDashboard(options.port);
  });

program
  .command('setup')
  .description('Interactive setup wizard')
  .action(async () => {
    console.log(chalk.cyan('\n⚙️  AI Platform Tracker Setup Wizard\n'));
    await runSetupWizard();
  });

program
  .command('status')
  .description('Show current tracking status and statistics')
  .action(async () => {
    console.log(chalk.cyan('\n📈 Current Tracking Status\n'));
    await showStatus();
  });

async function runSetupWizard() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'brandName',
      message: 'What is your brand/company name?',
      default: 'The Prairie Smithville'
    },
    {
      type: 'input',
      name: 'domain',
      message: 'What is your website domain?',
      default: 'theprairiesmithville.com'
    },
    {
      type: 'checkbox',
      name: 'platforms',
      message: 'Which AI platforms do you want to track?',
      choices: [
        { name: 'ChatGPT (OpenAI)', value: 'chatgpt', checked: true },
        { name: 'Claude (Anthropic)', value: 'claude', checked: true },
        { name: 'Gemini (Google)', value: 'gemini', checked: true },
        { name: 'Perplexity', value: 'perplexity', checked: true }
      ]
    },
    {
      type: 'input',
      name: 'keywords',
      message: 'Enter key search terms (comma-separated):',
      default: 'real estate, homes for sale, new development'
    }
  ]);

  const configPath = join(__dirname, '..', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  config.brand.name = answers.brandName;
  config.brand.domain = answers.domain;
  config.brand.keywords = answers.keywords.split(',').map(k => k.trim());

  Object.keys(config.platforms).forEach(platform => {
    config.platforms[platform].enabled = answers.platforms.includes(platform);
  });

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green('\n✅ Configuration saved successfully!\n'));
  console.log(chalk.yellow('Next steps:'));
  console.log('  1. Add your API keys to .env file');
  console.log('  2. Run: npm run track');
  console.log('  3. View results: npm run dashboard\n');
}

async function showStatus() {
  const dataDir = join(__dirname, '..', 'data');
  const configPath = join(__dirname, '..', 'config.json');

  if (!fs.existsSync(dataDir)) {
    console.log(chalk.yellow('No tracking data found. Run "npm run track" to start tracking.\n'));
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

  console.log(chalk.white(`Brand: ${chalk.bold(config.brand.name)}`));
  console.log(chalk.white(`Domain: ${config.brand.domain}`));
  console.log(chalk.white(`Total tracking sessions: ${files.length}`));

  if (files.length > 0) {
    const latestFile = files.sort().reverse()[0];
    const latestData = JSON.parse(fs.readFileSync(join(dataDir, latestFile), 'utf8'));
    console.log(chalk.white(`Last tracked: ${new Date(latestData.timestamp).toLocaleString()}`));
    console.log(chalk.white(`Platforms tracked: ${Object.keys(latestData.results || {}).join(', ')}`));
  }

  const enabledPlatforms = Object.entries(config.platforms)
    .filter(([, cfg]) => cfg.enabled)
    .map(([name]) => name);

  console.log(chalk.white(`\nEnabled platforms: ${enabledPlatforms.join(', ')}`));
  console.log(chalk.white(`Tracking frequency: ${config.tracking.frequency}`));
  console.log('');
}

program.parse();

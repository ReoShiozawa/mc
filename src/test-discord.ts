import { DiscordBot, DiscordBotConfig } from './discord/DiscordBot';
import dotenv from 'dotenv';

// Discord Botのみをテストするモード
dotenv.config();

class DiscordOnlyBot {
  private discordBot: DiscordBot;

  constructor() {
    const dcConfig: DiscordBotConfig = {
      token: process.env.DISCORD_TOKEN || '',
      channelId: process.env.DISCORD_CHANNEL_ID || '',
    };

    if (!dcConfig.token || !dcConfig.channelId) {
      throw new Error('Discord settings are missing in .env file');
    }

    this.discordBot = new DiscordBot(dcConfig);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.discordBot.on('ready', () => {
      console.log('✅ Discord bot ready');
      this.discordBot.sendSystemMessage('テストモード: Discord Bot接続成功！');
    });

    this.discordBot.on('message', (data: { username: string; content: string }) => {
      console.log(`[Discord] ${data.username}: ${data.content}`);
      
      // テスト用の自動応答
      if (data.content.startsWith('!test')) {
        this.discordBot.sendMessage(`✅ Bot is working! Received: ${data.content}`);
      }
      
      if (data.content === '!ping') {
        this.discordBot.sendMessage('🏓 Pong!');
      }
      
      // Minecraftメッセージのシミュレーション
      if (data.content === '!simulate') {
        this.simulateMinecraftEvents();
      }
    });

    this.discordBot.on('error', (error: Error) => {
      console.error('Discord bot error:', error);
    });
  }

  private async simulateMinecraftEvents(): Promise<void> {
    await this.discordBot.sendSystemMessage('Minecraftイベントをシミュレート中...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.discordBot.sendPlayerJoin('TestPlayer');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.discordBot.sendMinecraftChat('TestPlayer', 'Hello from Minecraft!');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.discordBot.sendPlayerLeave('TestPlayer');
  }

  async start(): Promise<void> {
    console.log('🚀 Starting Discord-only test mode...');
    await this.discordBot.connect();
    console.log('✅ Discord bot is running!');
    console.log('\nコマンド:');
    console.log('  !test <message> - テストメッセージ');
    console.log('  !ping - Pong応答');
    console.log('  !simulate - Minecraftイベントのシミュレーション');
  }

  stop(): void {
    console.log('Stopping Discord bot...');
    this.discordBot.disconnect();
  }
}

async function main() {
  const bot = new DiscordOnlyBot();

  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down...');
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down...');
    bot.stop();
    process.exit(0);
  });

  try {
    await bot.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

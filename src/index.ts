import dotenv from 'dotenv';
import { MinecraftBot, MinecraftBotConfig } from './minecraft/MinecraftBot';
import { DiscordBot, DiscordBotConfig } from './discord/DiscordBot';

// 環境変数の読み込み
dotenv.config();

class BridgeBot {
  private minecraftBot: MinecraftBot;
  private discordBot: DiscordBot;
  private playerCache: Map<string, string> = new Map(); // UUID -> Username

  constructor() {
    // Minecraft Bot設定
    const mcConfig: MinecraftBotConfig = {
      host: process.env.MINECRAFT_HOST || 'localhost',
      port: parseInt(process.env.MINECRAFT_PORT || '19132'),
      username: process.env.MINECRAFT_USERNAME || 'DiscordBot',
      version: process.env.MINECRAFT_VERSION,
      offline: process.env.MINECRAFT_OFFLINE !== 'false', // デフォルトはオフラインモード
      authTitle: process.env.MICROSOFT_AUTH_TITLE || '00000000441cc96b', // Minecraftの認証タイトル
      flow: process.env.MICROSOFT_FLOW || 'live', // 認証フロー
    };

    // Discord Bot設定
    const dcConfig: DiscordBotConfig = {
      token: process.env.DISCORD_TOKEN || '',
      channelId: process.env.DISCORD_CHANNEL_ID || '',
    };

    // 設定チェック
    if (!dcConfig.token || !dcConfig.channelId) {
      throw new Error('Discord settings are missing in .env file');
    }

    this.minecraftBot = new MinecraftBot(mcConfig);
    this.discordBot = new DiscordBot(dcConfig);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Minecraft -> Discord
    this.minecraftBot.on('connected', () => {
      console.log('✅ Minecraft bot connected');
      this.discordBot.sendSystemMessage('Minecraft botがサーバーに接続しました');
    });

    this.minecraftBot.on('disconnected', (reason: string) => {
      console.log('❌ Minecraft bot disconnected:', reason);
      this.discordBot.sendSystemMessage(`Minecraft botが切断されました: ${reason}`);
    });

    this.minecraftBot.on('chat', (data: { username: string; message: string }) => {
      // Bot自身のメッセージは無視
      if (data.username === this.minecraftBot['config'].username) {
        return;
      }

      // Discordに転送
      this.discordBot.sendMinecraftChat(data.username, data.message);
    });

    this.minecraftBot.on('playerJoin', (data: { username: string; uuid: string }) => {
      this.playerCache.set(data.uuid, data.username);
      this.discordBot.sendPlayerJoin(data.username);
    });

    this.minecraftBot.on('playerLeave', (data: { uuid: string }) => {
      const username = this.playerCache.get(data.uuid) || 'Unknown';
      this.discordBot.sendPlayerLeave(username);
      this.playerCache.delete(data.uuid);
    });

    // Discord -> Minecraft
    this.discordBot.on('ready', () => {
      console.log('✅ Discord bot ready');
    });

    this.discordBot.on('message', (data: { username: string; content: string }) => {
      // Minecraftに転送
      const message = `[Discord] <${data.username}> ${data.content}`;
      this.minecraftBot.sendChat(message);
    });

    // エラーハンドリング
    this.minecraftBot.on('error', (error: Error) => {
      console.error('Minecraft bot error:', error);
    });

    this.discordBot.on('error', (error: Error) => {
      console.error('Discord bot error:', error);
    });
  }

  async start(): Promise<void> {
    try {
      console.log('🚀 Starting Bridge Bot...');

      // Discord Bot起動
      await this.discordBot.connect();
      console.log('Discord bot started');

      // 少し待ってからMinecraft Bot起動
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Minecraft Bot起動
      await this.minecraftBot.connect();
      console.log('Minecraft bot started');

      console.log('✅ Bridge Bot is running!');
    } catch (error) {
      console.error('Failed to start Bridge Bot:', error);
      throw error;
    }
  }

  stop(): void {
    console.log('Stopping Bridge Bot...');
    this.minecraftBot.disconnect();
    this.discordBot.disconnect();
  }
}

// メイン処理
async function main() {
  const bot = new BridgeBot();

  // シグナルハンドリング
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

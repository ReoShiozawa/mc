import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import { EventEmitter } from 'events';

export interface DiscordBotConfig {
  token: string;
  channelId: string;
}

export class DiscordBot extends EventEmitter {
  private client: Client;
  private config: DiscordBotConfig;
  private targetChannel: TextChannel | null = null;

  constructor(config: DiscordBotConfig) {
    super();
    this.config = config;

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // v15対応: clientReadyイベントを使用
    this.client.once('ready', () => {
      console.log(`Discord bot logged in as ${this.client.user?.tag}`);
      this.setupTargetChannel();
      this.emit('ready');
    });

    this.client.on('messageCreate', async (message) => {
      // Botのメッセージは無視
      if (message.author.bot) return;

      // 指定チャンネル以外は無視
      if (message.channelId !== this.config.channelId) return;

      console.log(`[Discord] ${message.author.username}: ${message.content}`);

      // Minecraftにメッセージを送信
      this.emit('message', {
        username: message.author.username,
        content: message.content,
      });
    });

    this.client.on('error', (error) => {
      console.error('Discord client error:', error);
      this.emit('error', error);
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.login(this.config.token);
    } catch (error) {
      console.error('Failed to login to Discord:', error);
      throw error;
    }
  }

  private async setupTargetChannel(): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(this.config.channelId);
      if (channel && channel.isTextBased()) {
        this.targetChannel = channel as TextChannel;
        console.log(`Target channel set: ${this.targetChannel.name}`);
      } else {
        console.error('Target channel is not a text channel');
      }
    } catch (error) {
      console.error('Failed to fetch target channel:', error);
    }
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.targetChannel) {
      console.error('Target channel not set');
      return;
    }

    try {
      await this.targetChannel.send(content);
    } catch (error) {
      console.error('Failed to send message to Discord:', error);
    }
  }

  async sendMinecraftChat(username: string, message: string): Promise<void> {
    if (!this.targetChannel) {
      console.error('Target channel not set');
      return;
    }

    try {
      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setAuthor({ name: username, iconURL: `https://mc-heads.net/avatar/${username}/32` })
        .setDescription(message)
        .setTimestamp();

      await this.targetChannel.send({ embeds: [embed] });
      console.log(`[Discord Send] ${username}: ${message}`);
    } catch (error) {
      console.error('Failed to send Minecraft chat to Discord:', error);
    }
  }

  async sendPlayerJoin(username: string): Promise<void> {
    if (!this.targetChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setDescription(`**${username}** がサーバーに参加しました`)
        .setTimestamp();

      await this.targetChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send player join to Discord:', error);
    }
  }

  async sendPlayerLeave(username: string): Promise<void> {
    if (!this.targetChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`**${username}** がサーバーから退出しました`)
        .setTimestamp();

      await this.targetChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send player leave to Discord:', error);
    }
  }

  async sendSystemMessage(message: string): Promise<void> {
    if (!this.targetChannel) return;

    try {
      const embed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setDescription(`⚙️ ${message}`)
        .setTimestamp();

      await this.targetChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send system message to Discord:', error);
    }
  }

  disconnect(): void {
    this.client.destroy();
  }

  isConnected(): boolean {
    return this.client.isReady();
  }
}

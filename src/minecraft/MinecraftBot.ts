import * as bedrock from 'bedrock-protocol';
import { EventEmitter } from 'events';

export interface MinecraftBotConfig {
  host: string;
  port: number;
  username: string;
  version?: string;
  offline?: boolean;
  authTitle?: string;  // Microsoft認証用
  flow?: string;       // 認証フロー: 'live' または 'sisu'
}

export class MinecraftBot extends EventEmitter {
  private client: bedrock.Client | null = null;
  private config: MinecraftBotConfig;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;

  constructor(config: MinecraftBotConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || this.client) {
      console.log('Already connected or connecting...');
      return;
    }

    this.isConnecting = true;
    console.log(`Connecting to Minecraft server: ${this.config.host}:${this.config.port}`);

    try {
      const clientOptions: any = {
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        skipPing: true, // Pingをスキップして直接接続
        connectTimeout: 15000, // タイムアウトを15秒に設定
        realms: false, // Realmsではない
      };
      
      // オフラインモードかオンラインモードか
      if (this.config.offline !== false) {
        clientOptions.offline = true;
        console.log('🔓 オフラインモード（認証なし）で接続');
      } else {
        clientOptions.offline = false;
        clientOptions.authTitle = this.config.authTitle || '00000000441cc96b';
        clientOptions.flow = this.config.flow || 'live';
        clientOptions.profilesFolder = './auth_cache';
        console.log('🔐 オンラインモード（Microsoft認証）で接続');
        console.log('   AuthTitle:', clientOptions.authTitle);
        console.log('   Flow:', clientOptions.flow);
        console.log('   Cache:', clientOptions.profilesFolder);
      }
      
      // versionが指定されている場合のみ追加
      if (this.config.version) {
        clientOptions.version = this.config.version;
      }
      
      console.log('Creating Minecraft client with options:', {
        host: clientOptions.host,
        port: clientOptions.port,
        username: clientOptions.username,
        version: clientOptions.version || 'auto-detect',
        offline: clientOptions.offline,
        flow: clientOptions.flow
      });
      
      this.client = bedrock.createClient(clientOptions);

      this.setupEventHandlers();
      this.isConnecting = false;
    } catch (error) {
      console.error('Failed to create Minecraft client:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    // 接続成功
    this.client.on('spawn', () => {
      console.log('✅ Successfully connected to Minecraft server!');
      this.emit('connected');
      
      // /connect コマンドを実行
      setTimeout(() => {
        this.sendCommand('/connect');
      }, 1000);
    });

    // 接続開始
    this.client.on('join', () => {
      console.log('📡 Joining Minecraft server...');
    });

    // ログイン
    this.client.on('login', () => {
      console.log('🔐 Logged in to Minecraft server');
    });

    // テキストメッセージ受信
    this.client.on('text', (packet: any) => {
      if (packet.type === 'chat' || packet.type === 'translation') {
        const message = packet.message || '';
        const sourceName = packet.source_name || packet.sourceName || 'Unknown';
        
        console.log(`[MC Chat] ${sourceName}: ${message}`);
        
        this.emit('chat', {
          username: sourceName,
          message: message,
          type: packet.type
        });
      }
    });

    // プレイヤー参加
    this.client.on('player_list', (packet: any) => {
      if (packet.records && packet.records.records) {
        packet.records.records.forEach((player: any) => {
          if (packet.records.type === 'add') {
            console.log(`[MC] Player joined: ${player.username}`);
            this.emit('playerJoin', {
              username: player.username,
              uuid: player.uuid
            });
          } else if (packet.records.type === 'remove') {
            console.log(`[MC] Player left: ${player.uuid}`);
            this.emit('playerLeave', {
              uuid: player.uuid
            });
          }
        });
      }
    });

    // エラーハンドリング
    this.client.on('error', (error: Error) => {
      const errorMessage = error.message || String(error);
      console.error('❌ Minecraft client error:', errorMessage);
      
      // タイムアウトエラーの場合はより詳細な情報を表示
      if (errorMessage.includes('timed out') || errorMessage.includes('Timeout')) {
        console.error('💡 接続タイムアウト - 以下を確認してください:');
        console.error('   1. サーバーアドレスが正しいか: ' + this.config.host);
        console.error('   2. ポート番号が正しいか: ' + this.config.port);
        console.error('   3. サーバーがオンラインで外部接続を許可しているか');
        console.error('   4. ファイアウォールがポートをブロックしていないか');
      }
      
      this.emit('error', error);
    });

    // 切断
    this.client.on('disconnect', (packet: any) => {
      console.log('Disconnected from Minecraft server:', packet.reason);
      this.emit('disconnected', packet.reason);
      this.client = null;
      this.scheduleReconnect();
    });

    // クローズ
    this.client.on('close', () => {
      console.log('Connection closed');
      this.client = null;
      this.scheduleReconnect();
    });
  }

  sendChat(message: string): void {
    if (!this.client) {
      console.error('Not connected to Minecraft server');
      return;
    }

    try {
      this.client.write('text', {
        type: 'chat',
        needs_translation: false,
        source_name: this.config.username,
        message: message,
        xuid: '',
        platform_chat_id: ''
      });
      console.log(`[MC Send] ${message}`);
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  }

  sendCommand(command: string): void {
    if (!this.client) {
      console.error('Not connected to Minecraft server');
      return;
    }

    try {
      this.client.write('command_request', {
        command: command.startsWith('/') ? command.slice(1) : command,
        origin: {
          type: 'player',
          uuid: '',
          request_id: ''
        },
        internal: false
      });
      console.log(`[MC Command] /${command}`);
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    console.log('Reconnecting in 5 seconds...');
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

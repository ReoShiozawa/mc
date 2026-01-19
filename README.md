# Minecraft BE Bot with Discord Integration

Minecraft Bedrock Edition と Discord を連携させるBotシステムです。MinecraftサーバーのチャットをDiscordに転送し、Discordからのメッセージをマイクラに反映します。

## 機能

- ✅ Minecraft BE サーバーへの自動接続
- ✅ `/connect` コマンドの自動実行
- ✅ Minecraftチャットの取得とDiscordへの転送
- ✅ プレイヤーの入退室通知
- ✅ Discordからのメッセージをマイクラに送信
- ✅ 自動再接続機能
- ✅ Docker対応

## 必要要件

- Node.js 20以上
- Docker & Docker Compose（Docker使用時）
- Discord Bot トークン
- Minecraft BE サーバー

## セットアップ

### 1. Discord Bot の作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. "New Application" をクリックしてアプリケーションを作成
3. "Bot" セクションに移動し、Botを作成
4. "MESSAGE CONTENT INTENT" を有効化
5. Botトークンをコピー
6. OAuth2 URLを生成してBotをサーバーに招待
   - Scopes: `bot`
   - Bot Permissions: `Send Messages`, `Read Messages/View Channels`, `Read Message History`

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして設定を記入：

```bash
cp .env.example .env
```

`.env` ファイルを編集：

```env
# Minecraft Bot Configuration
MINECRAFT_HOST=your-server-address.com
MINECRAFT_PORT=19132
MINECRAFT_USERNAME=DiscordBot
MINECRAFT_VERSION=1.20.50

# Discord Bot Configuration
DISCORD_TOKEN=your-discord-bot-token
DISCORD_CHANNEL_ID=your-channel-id
```

#### 設定項目

- `MINECRAFT_HOST`: 接続するMinecraftサーバーのアドレス
- `MINECRAFT_PORT`: サーバーのポート（デフォルト: 19132）
- `MINECRAFT_USERNAME`: Botのユーザー名
- `MINECRAFT_VERSION`: Minecraftのバージョン
- `DISCORD_TOKEN`: Discord BotのTOKEN
- `DISCORD_CHANNEL_ID`: メッセージを送受信するDiscordチャンネルID

### 3. 実行方法

#### 開発環境での実行

```bash
# 依存関係のインストール
npm install

# TypeScriptのビルド
npm run build

# Botの起動
npm start

# または開発モード
npm run dev
```

#### Docker での実行

```bash
# Dockerイメージのビルドと起動
docker-compose up -d

# ログの確認
docker-compose logs -f

# 停止
docker-compose down
```

## 使い方

1. Botが起動すると自動的にMinecraftサーバーに接続します
2. 接続後、自動的に `/connect` コマンドを実行します
3. Minecraftのチャットが設定したDiscordチャンネルに送信されます
4. Discordチャンネルでメッセージを送信すると、Minecraftに転送されます

## プロジェクト構造

```
mcbot/
├── src/
│   ├── index.ts              # メインエントリーポイント
│   ├── minecraft/
│   │   └── MinecraftBot.ts   # Minecraft Bot実装
│   └── discord/
│       └── DiscordBot.ts     # Discord Bot実装
├── .env.example              # 環境変数のテンプレート
├── .env                      # 環境変数（要作成）
├── Dockerfile                # Dockerイメージ定義
├── docker-compose.yml        # Docker Compose設定
├── package.json              # npm依存関係
└── tsconfig.json             # TypeScript設定
```

## トラブルシューティング

### Minecraftに接続できない

- サーバーアドレスとポートが正しいか確認
- サーバーがオンラインで、外部接続を許可しているか確認
- ファイアウォールの設定を確認

### `sendto failed with code -1` エラー（macOS）

macOSで`sendto failed`エラーが発生する場合、`bedrock-protocol`のUDP送信に問題がある可能性があります。

**回避策:**
1. Discord Botのみモードで実行: `npm run test:discord`
2. Linuxサーバーで実行（DockerまたはVPS推奨）
3. Windows環境で実行

### サーバーバージョンの互換性

`bedrock-protocol`がサポートするバージョンは限定的です。サーバーバージョン `1.21.132` などの最新版には対応していない場合があります。最も近いサポート済みバージョン（例: `1.21.130`）を`.env`に指定してください。

### Discordにメッセージが送信されない

- Discord BotトークンとチャンネルIDが正しいか確認
- Botにチャンネルへのアクセス権限があるか確認
- "MESSAGE CONTENT INTENT" が有効になっているか確認

### 自動再接続について

Minecraftサーバーとの接続が切れた場合、Botは5秒後に自動的に再接続を試みます。

## 技術スタック

- **言語**: TypeScript
- **Minecraft**: [bedrock-protocol](https://github.com/PrismarineJS/bedrock-protocol)
- **Discord**: [discord.js](https://discord.js.org/)
- **コンテナ**: Docker

## ライセンス

MIT

## 注意事項

- このBotはオフラインモード（認証なし）で動作します
- サーバーによっては接続できない場合があります
- `/connect` コマンドはサーバー側で実装されている必要があります

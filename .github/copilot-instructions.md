# Minecraft BE Bot with Discord Integration

## Architecture Overview

This is a **bidirectional bridge bot** connecting Minecraft Bedrock Edition and Discord:
- **BridgeBot** ([src/index.ts](src/index.ts)): Main orchestrator with event-driven architecture using EventEmitter pattern
- **MinecraftBot** ([src/minecraft/MinecraftBot.ts](src/minecraft/MinecraftBot.ts)): bedrock-protocol wrapper with auto-reconnect
- **DiscordBot** ([src/discord/DiscordBot.ts](src/discord/DiscordBot.ts)): discord.js wrapper for embed-based messages

**Data Flow**: MC chat → BridgeBot player cache → Discord embed | Discord message → BridgeBot → MC `/tell @a` command

## Critical Development Workflows

### Running the Bot
```bash
# Development (ts-node, auto-reload needed manually)
npm run dev

# Production build
npm run build && npm start

# Docker (preferred for production)
docker-compose up -d && docker-compose logs -f
```

### Testing Individual Components
```bash
# Test Minecraft connection (ping server without login)
npm run test:connection

# Test Discord only (useful for macOS sendto errors)
npm run test:discord  # Responds to !test, !ping, !simulate commands
```

### Authentication Modes
- **Offline mode** (default): `MINECRAFT_OFFLINE=true` or omit - no Microsoft auth
- **Online mode**: `MINECRAFT_OFFLINE=false` + requires `auth_cache/` for token storage
  - Uses `MICROSOFT_AUTH_TITLE` (default: `00000000441cc96b`)
  - Uses `MICROSOFT_FLOW` (default: `live`, can be `sisu`)

## Project-Specific Conventions

### Event System Pattern
All bots use EventEmitter. BridgeBot acts as central hub:
```typescript
minecraftBot.on('chat', (data) => discordBot.sendMinecraftChat(...));
discordBot.on('message', (data) => minecraftBot.sendChat(`[Discord] <${data.username}> ...`));
```

### Player Tracking
BridgeBot maintains `playerCache: Map<uuid, username>` because MC `player_list` remove events only provide UUID.

### Version Compatibility
`bedrock-protocol` has **limited version support**. Always specify closest supported version:
- Set `MINECRAFT_VERSION=1.21.130` even if server is `1.21.132`
- Omit version for auto-detect (risky with new servers)

### Auto-Reconnect Behavior
MinecraftBot auto-reconnects after 5s on disconnect/close. Uses `isConnecting` flag to prevent concurrent connection attempts.

### macOS UDP Issue
`sendto failed with code -1` is a known bedrock-protocol issue on macOS. Workaround: Use Docker or Linux, or run `npm run test:discord` for Discord-only mode.

## Key Configuration (`.env`)

Required:
```env
DISCORD_TOKEN=         # Discord bot token
DISCORD_CHANNEL_ID=    # Target channel for relay
MINECRAFT_HOST=        # Server address
```

Important defaults:
- `MINECRAFT_PORT=19132` (BE default)
- `MINECRAFT_USERNAME=DiscordBot` (bot's in-game name)
- `MINECRAFT_OFFLINE=true` (set `false` for Microsoft auth)
- Auto-executes `/connect` command 1s after spawn

## Code Modification Guidelines

### Adding New MC Event Handlers
Listen to bedrock-protocol events in `MinecraftBot.setupEventHandlers()`:
```typescript
this.client.on('some_packet', (packet) => {
  this.emit('customEvent', transformedData);
});
```

### Adding New Discord Features
Use discord.js v14 patterns in `DiscordBot`. Example embed template:
```typescript
const embed = new EmbedBuilder()
  .setColor(0x00AE86)  // Teal for MC chat
  .setAuthor({ name: username, iconURL: `https://mc-heads.net/avatar/${username}/32` })
```

### Extending Message Filtering
Currently filters bot messages (`message.author.bot`) and wrong channels. Add filters in `DiscordBot.setupEventHandlers()`.

## Tech Stack Details

- **TypeScript**: ES2020 target, CommonJS modules, strict mode enabled
- **bedrock-protocol**: Handles MCBE UDP packets, version-sensitive
- **discord.js v14**: Requires `GatewayIntentBits.MessageContent` intent
- **Docker**: Alpine-based Node 20 image, logs to `./logs` volume

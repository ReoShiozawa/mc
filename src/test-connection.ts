import * as bedrock from 'bedrock-protocol';

// サーバー情報を確認するツール
async function checkServer(host: string, port: number) {
  console.log(`\n🔍 サーバー情報を確認中: ${host}:${port}\n`);

  try {
    // サーバーにPingを送信
    console.log('📡 Pingを送信中...');
    const pingResult = await bedrock.ping({ host, port });
    
    console.log('✅ サーバーが応答しました！\n');
    console.log('📊 サーバー情報:');
    console.log('   バージョン:', pingResult.version);
    console.log('   サーバー名:', pingResult.motd);
    console.log('   プレイヤー数:', `${pingResult.playersOnline}/${pingResult.playersMax}`);
    console.log('   ゲームモードID:', pingResult.gamemodeId);
    console.log('   レベル名:', pingResult.levelName);
    console.log('\n💡 このサーバーに接続できます！');
    
    return true;
  } catch (error: any) {
    console.error('❌ サーバーへの接続に失敗しました\n');
    console.error('エラー:', error.message);
    console.error('\n可能性のある原因:');
    console.error('   1. サーバーアドレスまたはポートが間違っている');
    console.error('   2. サーバーがオフラインまたはメンテナンス中');
    console.error('   3. サーバーが外部接続を許可していない');
    console.error('   4. ネットワークまたはファイアウォールの問題');
    console.error('   5. サーバーがRealm等の特殊な接続方法を使用している');
    
    return false;
  }
}

// 環境変数から読み込み
const host = process.env.MINECRAFT_HOST || 'localhost';
const port = parseInt(process.env.MINECRAFT_PORT || '19132');

checkServer(host, port).then(success => {
  process.exit(success ? 0 : 1);
});

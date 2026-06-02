require('dotenv').config();
const readline = require('readline');
const axios    = require('axios');
const fs       = require('fs');
const path     = require('path');
const { exec } = require('child_process');

const APP_ID       = process.env.MERCADOLIVRE_APP_ID;
const SECRET       = process.env.MERCADOLIVRE_SECRET;
const REDIRECT_URI = 'https://oauth.pstmn.io/v1/callback';
const ENV_PATH     = path.join(__dirname, '.env');

if (!APP_ID || !SECRET) {
  console.error('\n❌ MERCADOLIVRE_APP_ID e MERCADOLIVRE_SECRET devem estar preenchidos no .env');
  process.exit(1);
}

const authUrl =
  `https://auth.mercadolivre.com.br/authorization` +
  `?response_type=code` +
  `&client_id=${APP_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=offline_access`;

console.log('\n🔐 AUTORIZAÇÃO DO MERCADO LIVRE — AFILIADOS');
console.log('═'.repeat(55));
console.log('\n1. Abra esta URL no navegador:\n');
console.log(`   ${authUrl}\n`);
console.log('2. Faça login com a conta DAIANELAZAROV e clique em "Autorizar"');
console.log('3. Você será redirecionado para oauth.pstmn.io');
console.log('4. Copie o valor do parâmetro "code" da URL e cole aqui\n');
console.log('   Exemplo de URL recebida:');
console.log('   https://oauth.pstmn.io/v1/callback?code=TG-XXXXXX-...\n');
console.log('─'.repeat(55));

exec(`start "" "${authUrl}"`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Cole o código aqui → ', async (input) => {
  rl.close();

  // Aceita tanto o código direto quanto a URL inteira
  let code = input.trim();
  try {
    const url = new URL(code);
    code = url.searchParams.get('code') || code;
  } catch (_) {}

  if (!code) {
    console.error('\n❌ Nenhum código informado. Tente novamente.');
    process.exit(1);
  }

  console.log('\n⏳ Trocando código por tokens...');

  try {
    const { data } = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     APP_ID,
        client_secret: SECRET,
        code,
        redirect_uri:  REDIRECT_URI,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      }
    );

    const { access_token, refresh_token, expires_in } = data;

    salvarTokensNoEnv(access_token, refresh_token);

    console.log('\n✅ Tokens salvos no .env com sucesso!');
    console.log(`   Access token:  ${access_token.substring(0, 40)}...`);
    console.log(`   Refresh token: ${refresh_token.substring(0, 40)}...`);
    console.log(`   Válido por:    ${Math.round(expires_in / 3600)}h (renovação automática ativa)`);
    console.log('\n🚀 Pronto! Execute o bot com:\n');
    console.log('   npm start\n');

  } catch (err) {
    const msg  = err.response?.data?.message || err.response?.data?.error || err.message;
    const detail = err.response?.data ? JSON.stringify(err.response.data) : '';
    console.error(`\n❌ Erro ao trocar código por token: ${msg}`);
    if (detail) console.error(`   Detalhe: ${detail}`);
    process.exit(1);
  }
});

function salvarTokensNoEnv(accessToken, refreshToken) {
  let env = fs.readFileSync(ENV_PATH, 'utf-8');

  env = env.replace(/^MERCADOLIVRE_TOKEN=.*$/m, `MERCADOLIVRE_TOKEN=${accessToken}`);

  if (/^MERCADOLIVRE_REFRESH_TOKEN=.*$/m.test(env)) {
    env = env.replace(/^MERCADOLIVRE_REFRESH_TOKEN=.*$/m, `MERCADOLIVRE_REFRESH_TOKEN=${refreshToken}`);
  } else {
    env = env.replace(
      /^MERCADOLIVRE_TOKEN=.*$/m,
      `MERCADOLIVRE_TOKEN=${accessToken}\nMERCADOLIVRE_REFRESH_TOKEN=${refreshToken}`
    );
  }

  fs.writeFileSync(ENV_PATH, env, 'utf-8');
}

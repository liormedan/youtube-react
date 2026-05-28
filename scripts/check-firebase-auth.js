const fs = require('fs');
const crypto = require('crypto');
const https = require('https');
const path = require('path');

const DEFAULT_EMAIL = 'liormedan1@gmail.com';

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return env;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      env[key] = value.replace(/^["']|["']$/g, '');
      return env;
    }, {});
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (response) => {
      let responseBody = '';
      response.on('data', chunk => {
        responseBody += chunk;
      });
      response.on('end', () => {
        let data = {};
        try {
          data = responseBody ? JSON.parse(responseBody) : {};
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${responseBody}`));
          return;
        }

        if (response.statusCode >= 400) {
          const message = data.error && data.error.message ? data.error.message : responseBody;
          reject(new Error(`Firebase Auth request failed (${response.statusCode}): ${message}`));
          return;
        }

        resolve(data);
      });
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  const createTempAccount = args.includes('--create-temp-account');
  const checkGoogle = args.includes('--google');
  const email = args.find(arg => !arg.startsWith('--')) || DEFAULT_EMAIL;
  const env = readEnvFile(path.join(process.cwd(), '.env.local'));
  const apiKey = env.REACT_APP_FIREBASE_API_KEY;
  const projectId = env.REACT_APP_FIREBASE_PROJECT_ID;
  const authDomain = env.REACT_APP_FIREBASE_AUTH_DOMAIN;
  const password = process.env.TEST_FIREBASE_PASSWORD;

  const missing = [
    ['REACT_APP_FIREBASE_API_KEY', apiKey],
    ['REACT_APP_FIREBASE_PROJECT_ID', projectId],
    ['REACT_APP_FIREBASE_AUTH_DOMAIN', authDomain],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required Firebase env vars: ${missing.join(', ')}`);
  }

  console.log(`Firebase project: ${projectId}`);
  console.log(`Auth domain: ${authDomain}`);
  console.log(`Checking sign-in methods for: ${email}`);

  const createAuthUriUrl = `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`;
  const methods = await postJson(createAuthUriUrl, {
    identifier: email,
    continueUri: 'http://localhost:3000',
  });

  console.log(`Registered account: ${methods.registered ? 'yes' : 'no'}`);
  console.log(`Sign-in methods: ${(methods.signinMethods || []).join(', ') || 'none returned'}`);
  console.log(`Providers: ${(methods.allProviders || []).join(', ') || 'none returned'}`);

  if (checkGoogle) {
    console.log('Checking Google provider auth URI for http://localhost:3000');
    const googleAuthUri = await postJson(createAuthUriUrl, {
      providerId: 'google.com',
      continueUri: 'http://localhost:3000',
    });

    console.log(`Google provider authUri: ${googleAuthUri.authUri ? 'ok' : 'missing'}`);
    console.log(`Google registered: ${googleAuthUri.registered ? 'yes' : 'no'}`);
    console.log(`Google provider id: ${googleAuthUri.providerId || 'none returned'}`);
  }

  if (createTempAccount) {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      throw new Error(`Invalid email address for temp account: ${email}`);
    }

    const testEmail = `${localPart}+codex-auth-test-${Date.now()}@${domain}`;
    const testPassword = `${crypto.randomBytes(12).toString('base64')}aA1!`;
    const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    const deleteUrl = `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`;

    console.log(`Creating temporary account: ${testEmail}`);
    const signUp = await postJson(signUpUrl, {
      email: testEmail,
      password: testPassword,
      returnSecureToken: true,
    });

    console.log(`Temporary signup: ok`);
    console.log(`Temporary uid: ${signUp.localId}`);

    await postJson(deleteUrl, {
      idToken: signUp.idToken,
    });

    console.log(`Temporary account deleted: ok`);
  }

  if (!password) {
    console.log('Password sign-in skipped. Set TEST_FIREBASE_PASSWORD to verify a real email/password login.');
    return;
  }

  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const signIn = await postJson(signInUrl, {
    email,
    password,
    returnSecureToken: true,
  });

  console.log(`Password sign-in: ok`);
  console.log(`User uid: ${signIn.localId}`);
  console.log(`Email verified: ${signIn.emailVerified ? 'yes' : 'no'}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

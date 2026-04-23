/**
 * Miele Washing Machine Telegram Notifier
 * 
 * Monitors your Miele washing machine via the 3rd Party API
 * and sends notifications to Telegram when:
 * - Wash cycle completes
 * - Door opens/closes
 * - Errors/faults occur
 */

import 'dotenv/config';
import { MieleClient } from './miele-client.js';
import { TelegramNotifier } from './telegram-notifier.js';
import { StateMonitor } from './state-monitor.js';

// Configuration from environment variables
const config = {
  miele: {
    clientId: process.env.MIELE_CLIENT_ID,
    clientSecret: process.env.MIELE_CLIENT_SECRET,
    username: process.env.MIELE_USERNAME,
    password: process.env.MIELE_PASSWORD,
    vg: process.env.MIELE_VG || 'en-US', // Locale/country code
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  pollInterval: parseInt(process.env.POLL_INTERVAL_MS) || 30000, // 30 seconds default
};

// Validate configuration
function validateConfig() {
  const missing = [];
  
  if (!config.miele.clientId) missing.push('MIELE_CLIENT_ID');
  if (!config.miele.clientSecret) missing.push('MIELE_CLIENT_SECRET');
  if (!config.miele.username) missing.push('MIELE_USERNAME');
  if (!config.miele.password) missing.push('MIELE_PASSWORD');
  if (!config.telegram.botToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!config.telegram.chatId) missing.push('TELEGRAM_CHAT_ID');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease check your .env file.');
    process.exit(1);
  }
}

async function main() {
  console.log('🧺 Miele Washing Machine Telegram Notifier');
  console.log('==========================================\n');
  
  validateConfig();
  
  // Initialize components
  const telegram = new TelegramNotifier(config.telegram.botToken, config.telegram.chatId);
  const miele = new MieleClient(config.miele);
  const monitor = new StateMonitor();
  
  // Set up notification handlers
  monitor.on('cycleComplete', async (device) => {
    const message = `✅ *Wash Cycle Complete!*\n\n` +
      `🧺 ${device.name || 'Washing Machine'}\n` +
      `📋 Program: ${device.program || 'Unknown'}\n` +
      `⏱️ Time: ${new Date().toLocaleTimeString()}`;
    await telegram.send(message);
  });
  
  monitor.on('doorOpened', async (device) => {
    const message = `🚪 *Door Opened*\n\n` +
      `🧺 ${device.name || 'Washing Machine'}\n` +
      `⏱️ Time: ${new Date().toLocaleTimeString()}`;
    await telegram.send(message);
  });
  
  monitor.on('doorClosed', async (device) => {
    const message = `🔒 *Door Closed*\n\n` +
      `🧺 ${device.name || 'Washing Machine'}\n` +
      `⏱️ Time: ${new Date().toLocaleTimeString()}`;
    await telegram.send(message);
  });
  
  monitor.on('error', async (device) => {
    const message = `⚠️ *Error Alert!*\n\n` +
      `🧺 ${device.name || 'Washing Machine'}\n` +
      `❌ A fault has been detected\n` +
      `⏱️ Time: ${new Date().toLocaleTimeString()}\n\n` +
      `Please check your washing machine.`;
    await telegram.send(message);
  });
  
  monitor.on('errorCleared', async (device) => {
    const message = `✅ *Error Cleared*\n\n` +
      `🧺 ${device.name || 'Washing Machine'}\n` +
      `The previous error has been resolved.\n` +
      `⏱️ Time: ${new Date().toLocaleTimeString()}`;
    await telegram.send(message);
  });
  
  // Authenticate with Miele API
  console.log('🔐 Authenticating with Miele API...');
  try {
    await miele.authenticate();
    console.log('✅ Authentication successful!\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }
  
  // Get devices and find washing machine
  console.log('🔍 Discovering devices...');
  let devices;
  try {
    devices = await miele.getDevices();
    const deviceList = Object.entries(devices);
    
    if (deviceList.length === 0) {
      console.error('❌ No devices found in your Miele account.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${deviceList.length} device(s):\n`);
    deviceList.forEach(([id, device]) => {
      const type = device.ident?.type?.value_localized || 'Unknown';
      const name = device.ident?.deviceName || id;
      console.log(`   📱 ${name} (${type}) - ID: ${id}`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Failed to get devices:', error.message);
    process.exit(1);
  }
  
  // Send startup notification
  await telegram.send('🚀 *Miele Notifier Started*\n\nI will notify you about your washing machine status.');
  
  // Start polling
  console.log(`⏰ Starting monitoring (polling every ${config.pollInterval / 1000}s)...\n`);
  
  async function poll() {
    try {
      const currentDevices = await miele.getDevices();
      
      for (const [deviceId, device] of Object.entries(currentDevices)) {
        // Only monitor washing machines (type value_raw = 1)
        const deviceType = device.ident?.type?.value_raw;
        if (deviceType !== 1 && deviceType !== 2) { // 1 = Washing Machine, 2 = Tumble Dryer
          continue;
        }
        
        const deviceInfo = {
          id: deviceId,
          name: device.ident?.deviceName || device.ident?.type?.value_localized || 'Washing Machine',
          program: device.state?.ProgramID?.value_localized || 'Unknown',
          status: device.state?.status?.value_raw,
          statusText: device.state?.status?.value_localized,
          signalDoor: device.state?.signalDoor,
          signalFailure: device.state?.signalFailure,
        };
        
        monitor.update(deviceId, deviceInfo);
      }
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔄 Token expired, re-authenticating...');
        try {
          await miele.authenticate();
          console.log('✅ Re-authentication successful');
        } catch (authError) {
          console.error('❌ Re-authentication failed:', authError.message);
        }
      } else {
        console.error('⚠️ Polling error:', error.message);
      }
    }
  }
  
  // Initial poll
  await poll();
  
  // Set up polling interval
  setInterval(poll, config.pollInterval);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down...');
    await telegram.send('🔴 *Miele Notifier Stopped*\n\nI will no longer send notifications.');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n\n👋 Shutting down...');
    await telegram.send('🔴 *Miele Notifier Stopped*\n\nI will no longer send notifications.');
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

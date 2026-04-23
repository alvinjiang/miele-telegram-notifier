/**
 * Test Telegram Bot Connection
 * 
 * Run this to verify your Telegram bot token and chat ID are working
 */

import 'dotenv/config';
import { TelegramNotifier } from '../src/telegram-notifier.js';

async function main() {
  console.log('🧪 Testing Telegram Bot Connection\n');
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env file');
    process.exit(1);
  }
  
  console.log(`Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`Chat ID: ${chatId}\n`);
  
  const telegram = new TelegramNotifier(botToken, chatId);
  
  try {
    // Test bot connection
    console.log('1. Testing bot connection...');
    const botInfo = await telegram.testConnection();
    console.log(`   ✅ Bot name: ${botInfo.first_name}`);
    console.log(`   ✅ Bot username: @${botInfo.username}\n`);
    
    // Send test message
    console.log('2. Sending test message...');
    await telegram.send('🧪 *Test Message*\n\nIf you see this, your Miele Telegram Notifier is configured correctly!');
    console.log('   ✅ Message sent successfully!\n');
    
    console.log('✅ All tests passed! Your Telegram configuration is working.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure the bot token is correct (from @BotFather)');
    console.error('2. Make sure the bot is added to your group');
    console.error('3. Make sure the chat ID is correct (use @userinfobot in your group)');
    console.error('4. For groups, the chat ID should be a negative number');
    process.exit(1);
  }
}

main();

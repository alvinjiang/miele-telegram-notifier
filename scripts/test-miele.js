/**
 * Test Miele API Connection
 * 
 * Run this to verify your Miele API credentials are working
 */

import 'dotenv/config';
import { MieleClient, MieleStatus } from '../src/miele-client.js';

async function main() {
  console.log('🧪 Testing Miele API Connection\n');
  
  const config = {
    clientId: process.env.MIELE_CLIENT_ID,
    clientSecret: process.env.MIELE_CLIENT_SECRET,
    username: process.env.MIELE_USERNAME,
    password: process.env.MIELE_PASSWORD,
    vg: process.env.MIELE_VG || 'en-US',
  };
  
  // Check for missing credentials
  const missing = [];
  if (!config.clientId) missing.push('MIELE_CLIENT_ID');
  if (!config.clientSecret) missing.push('MIELE_CLIENT_SECRET');
  if (!config.username) missing.push('MIELE_USERNAME');
  if (!config.password) missing.push('MIELE_PASSWORD');
  
  if (missing.length > 0) {
    console.error('❌ Missing credentials in .env file:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }
  
  console.log(`Client ID: ${config.clientId.substring(0, 8)}...`);
  console.log(`Username: ${config.username}`);
  console.log(`Locale: ${config.vg}\n`);
  
  const miele = new MieleClient(config);
  
  try {
    // Test authentication
    console.log('1. Testing authentication...');
    await miele.authenticate();
    console.log('   ✅ Authentication successful!\n');
    
    // Get devices
    console.log('2. Fetching devices...');
    const devices = await miele.getDevices();
    const deviceList = Object.entries(devices);
    
    if (deviceList.length === 0) {
      console.log('   ⚠️ No devices found in your account');
    } else {
      console.log(`   ✅ Found ${deviceList.length} device(s):\n`);
      
      for (const [id, device] of deviceList) {
        const type = device.ident?.type?.value_localized || 'Unknown';
        const techType = device.ident?.deviceIdentLabel?.techType || '';
        const name = device.ident?.deviceName || 'Unnamed';
        const status = device.state?.status?.value_localized || 'Unknown';
        const statusRaw = device.state?.status?.value_raw;
        
        console.log(`   📱 Device: ${name || type}`);
        console.log(`      Type: ${type} (${techType})`);
        console.log(`      ID: ${id}`);
        console.log(`      Status: ${status} (code: ${statusRaw})`);
        console.log(`      Door Signal: ${device.state?.signalDoor ?? 'N/A'}`);
        console.log(`      Failure Signal: ${device.state?.signalFailure ?? 'N/A'}`);
        
        if (device.state?.ProgramID?.value_localized) {
          console.log(`      Program: ${device.state.ProgramID.value_localized}`);
        }
        
        if (device.state?.remainingTime) {
          const [hours, minutes] = device.state.remainingTime;
          if (hours >= 0 && minutes >= 0) {
            console.log(`      Remaining Time: ${hours}h ${minutes}m`);
          }
        }
        
        console.log('');
      }
    }
    
    console.log('✅ All tests passed! Your Miele configuration is working.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure your Client ID and Secret are from https://developer.miele.com');
    console.error('2. Your email should be lowercase (Miele is case-sensitive)');
    console.error('3. Password should not contain special characters');
    console.error('4. Make sure MIELE_VG matches your account region (e.g., en-US, de-DE)');
    console.error('5. Your appliances must be connected in the Miele app');
    process.exit(1);
  }
}

main();

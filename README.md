# Miele Washing Machine Telegram Notifier 🧺

Get Telegram notifications when your Miele washing machine:
- ✅ Completes a wash cycle
- 🚪 Door opens or closes
- ⚠️ Has an error or fault

## Prerequisites

- Ubuntu home server (or any Linux system)
- Node.js 18 or higher
- A Miele washing machine connected to the Miele app
- Miele 3rd Party API credentials
- A Telegram bot and group

## Quick Start

### 1. Clone or Download

```bash
# Create directory and copy files
mkdir -p ~/miele-telegram-notifier
cd ~/miele-telegram-notifier
# Copy all the source files here
```

### 2. Install Node.js (if not installed)

```bash
# Using NodeSource repository (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18 or higher
npm --version
```

### 3. Get Your API Credentials

#### Miele API Credentials

1. Go to [Miele Developer Portal](https://developer.miele.com/get-involved)
2. Sign up / Log in with your Miele account email (the same one you use in the Miele app)
3. Create a new application to get your **Client ID** and **Client Secret**
4. Note: Your email must be **lowercase** and your password should **not contain special characters**

#### Telegram Bot Setup

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts to create your bot
3. Copy the **Bot Token** (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### Get Your Group Chat ID

1. Create a Telegram group (or use an existing one)
2. Add your new bot to the group
3. Add [@userinfobot](https://t.me/userinfobot) to the group temporarily
4. It will display the **Chat ID** (looks like: `-1001234567890`)
5. You can remove @userinfobot after noting the ID

### 4. Configure the Application

```bash
cd ~/miele-telegram-notifier

# Copy the example config
cp .env.example .env

# Edit with your credentials
nano .env
```

Fill in your `.env` file:

```env
# Miele API Credentials
MIELE_CLIENT_ID=your_actual_client_id
MIELE_CLIENT_SECRET=your_actual_client_secret
MIELE_USERNAME=your_miele_email@example.com
MIELE_PASSWORD=your_miele_password
MIELE_VG=en-US

# Telegram Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890

# Polling interval (30 seconds)
POLL_INTERVAL_MS=30000
```

**Country Codes (MIELE_VG):**
| Country | Code |
|---------|------|
| USA | en-US |
| UK | en-GB |
| Germany | de-DE |
| France | fr-FR |
| Netherlands | nl-NL |
| Belgium | nl-BE or fr-BE |
| Austria | de-AT |
| Switzerland | de-CH |
| Australia | en-AU |

### 5. Install Dependencies

```bash
npm install
```

### 6. Test Your Configuration

Test Telegram connection:
```bash
npm run test-telegram
```

Test Miele API connection:
```bash
npm run test-miele
```

### 7. Run the Application

```bash
npm start
```

You should see output like:
```
🧺 Miele Washing Machine Telegram Notifier
==========================================

🔐 Authenticating with Miele API...
✅ Authentication successful!

🔍 Discovering devices...
✅ Found 1 device(s):

   📱 Washing Machine (W1) - ID: 000123456789

⏰ Starting monitoring (polling every 30s)...
```

## Running as a System Service

To run the notifier automatically on boot:

### 1. Edit the Service File

```bash
# Replace YOUR_USERNAME with your actual username
nano miele-notifier.service
```

### 2. Install the Service

```bash
# Copy service file
sudo cp miele-notifier.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable miele-notifier

# Start the service
sudo systemctl start miele-notifier
```

### 3. Manage the Service

```bash
# Check status
sudo systemctl status miele-notifier

# View logs
sudo journalctl -u miele-notifier -f

# Restart service
sudo systemctl restart miele-notifier

# Stop service
sudo systemctl stop miele-notifier
```

## Notification Types

| Event | Message | When |
|-------|---------|------|
| Cycle Complete | ✅ Wash Cycle Complete! | When status changes from Running to Program Ended |
| Door Opened | 🚪 Door Opened | When door sensor detects open |
| Door Closed | 🔒 Door Closed | When door sensor detects closed |
| Error | ⚠️ Error Alert! | When fault signal is detected |
| Error Cleared | ✅ Error Cleared | When fault signal clears |

## Troubleshooting

### "Authentication failed"
- Ensure your email is lowercase in the `.env` file
- Check that your password doesn't contain special characters
- Verify your Client ID and Secret are correct
- Make sure `MIELE_VG` matches your account region

### "No devices found"
- Make sure your washing machine is connected in the Miele app
- The machine must be WiFi-enabled (Miele@home compatible)
- Wait a few minutes after setting up in the app

### "Telegram message not received"
- Verify the bot is added to your group
- Check the chat ID is correct (should be negative for groups)
- Make sure the bot has permission to send messages

### "Token expired"
The app automatically refreshes tokens, but if issues persist:
- Restart the service: `sudo systemctl restart miele-notifier`

## File Structure

```
miele-telegram-notifier/
├── src/
│   ├── index.js           # Main application
│   ├── miele-client.js    # Miele API client
│   ├── telegram-notifier.js # Telegram bot client
│   └── state-monitor.js   # State change detection
├── scripts/
│   ├── test-telegram.js   # Telegram test script
│   └── test-miele.js      # Miele API test script
├── .env                   # Your configuration (create from .env.example)
├── .env.example           # Example configuration
├── package.json           # Node.js dependencies
├── miele-notifier.service # Systemd service file
└── README.md              # This file
```

## Support

- Miele API Documentation: https://developer.miele.com/docs
- Telegram Bot API: https://core.telegram.org/bots/api

## 🤖 AI & Model Architecture
AI was used in coding this App.

- **Primary LLM/Model:** Anthropic Claude Opus 4.5
- **Usage:** Used for generating functions and large portions of logic as described by human
- **Documentation Method:** README AI generated and human-edited

## License

Apache 2.0 License

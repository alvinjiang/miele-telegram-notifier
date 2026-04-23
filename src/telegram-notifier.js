/**
 * Telegram Bot Notifier
 * 
 * Sends notifications to a Telegram group/chat
 */

export class TelegramNotifier {
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.apiUrl = `https://api.telegram.org/bot${botToken}`;
  }
  
  /**
   * Send a message to the configured chat
   * @param {string} message - Message text (supports Markdown)
   * @param {object} options - Additional options
   */
  async send(message, options = {}) {
    const url = `${this.apiUrl}/sendMessage`;
    
    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_notification: options.silent || false,
      ...options,
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Telegram API error:', errorData);
        throw new Error(`Telegram API error: ${errorData.description || response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegram error: ${data.description}`);
      }
      
      console.log(`📤 Telegram: Message sent`);
      return data;
    } catch (error) {
      console.error('Failed to send Telegram message:', error.message);
      throw error;
    }
  }
  
  /**
   * Send a photo with optional caption
   */
  async sendPhoto(photoUrl, caption = '') {
    const url = `${this.apiUrl}/sendPhoto`;
    
    const payload = {
      chat_id: this.chatId,
      photo: photoUrl,
      caption: caption,
      parse_mode: 'Markdown',
    };
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Telegram error: ${data.description}`);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to send Telegram photo:', error.message);
      throw error;
    }
  }
  
  /**
   * Test the bot connection
   */
  async testConnection() {
    const url = `${this.apiUrl}/getMe`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Bot verification failed: ${data.description}`);
      }
      
      console.log(`✅ Telegram bot connected: @${data.result.username}`);
      return data.result;
    } catch (error) {
      console.error('Telegram bot connection test failed:', error.message);
      throw error;
    }
  }
}

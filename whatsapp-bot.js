const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');

// Initialize WhatsApp client
const client = new Client();

// Generate QR code for WhatsApp Web authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Please scan the QR code with WhatsApp');
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

// Handle incoming messages
client.on('message', async (message) => {
    if (message.body.startsWith('!')) {
        return; // Ignore messages starting with ! to prevent loops
    }

    try {
        // Use the same AI API as the web version
        const apiUrl = message.body.startsWith('/image') 
            ? 'https://backend.buildpicoapps.com/aero/run/image-generation-api?pk=v1-Z0FBQUFBQm5HUEtMSjJkakVjcF9IQ0M0VFhRQ0FmSnNDSHNYTlJSblE0UXo1Q3RBcjFPcl9YYy1OZUhteDZWekxHdWRLM1M1alNZTkJMWEhNOWd4S1NPSDBTWC12M0U2UGc9PQ=='
            : 'https://backend.buildpicoapps.com/aero/run/llm-api?pk=v1-Z0FBQUFBQm5HUEtMSjJkakVjcF9IQ0M0VFhRQ0FmSnNDSHNYTlJSblE0UXo1Q3RBcjFPcl9YYy1OZUhteDZWekxHdWRLM1M1alNZTkJMWEhNOWd4S1NPSDBTWC12M0U2UGc9PQ==';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message.body })
        });

        const data = await response.json();
        
        if (data.status === 'success') {
            // Reply with AI response
            await message.reply(data.text);
        } else {
            await message.reply('Sorry, I encountered an error. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        await message.reply('Sorry, I encountered an error. Please try again.');
    }
});

// Start the client
client.initialize();
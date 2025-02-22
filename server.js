const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fetch = require('node-fetch');
const qrcode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));
app.use(express.json());

// Store client instance
let whatsappClient = null;
let isClientReady = false;

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize WhatsApp client with session support
function initializeWhatsAppClient() {
    whatsappClient = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        }
    });

    // QR Code event
    whatsappClient.on('qr', async (qr) => {
        try {
            // Generate QR code as data URL
            const qrDataURL = await qrcode.toDataURL(qr);
            io.emit('qr', qrDataURL);
            console.log('QR Code generated and sent to client');
        } catch (err) {
            console.error('QR Code generation error:', err);
            io.emit('error', 'Failed to generate QR code');
        }
    });

    // Ready event
    whatsappClient.on('ready', () => {
        console.log('WhatsApp client is ready');
        isClientReady = true;
        io.emit('whatsappReady');
    });

    // Authentication successful
    whatsappClient.on('authenticated', (session) => {
        console.log('WhatsApp authenticated');
        io.emit('authenticated');
    });

    // Authentication failure
    whatsappClient.on('auth_failure', (err) => {
        console.error('WhatsApp authentication failed:', err);
        isClientReady = false;
        io.emit('authFailed', 'WhatsApp authentication failed');
    });

    // Disconnected
    whatsappClient.on('disconnected', (reason) => {
        console.log('WhatsApp disconnected:', reason);
        isClientReady = false;
        io.emit('disconnected', reason);
        // Attempt to reconnect
        initializeWhatsAppClient();
    });

    // Handle incoming messages
    whatsappClient.on('message', async (message) => {
        if (message.body.startsWith('!')) return;

        try {
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
                await message.reply(data.text);
                io.emit('messageSent', { 
                    from: message.from, 
                    message: message.body, 
                    response: data.text 
                });
            } else {
                throw new Error('API response was not successful');
            }
        } catch (error) {
            console.error('Message handling error:', error);
            await message.reply('Sorry, I encountered an error. Please try again.');
            io.emit('error', 'Failed to process message');
        }
    });

    // Initialize the client
    whatsappClient.initialize()
        .catch(err => {
            console.error('WhatsApp initialization error:', err);
            io.emit('error', 'Failed to initialize WhatsApp client');
        });
}

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('Web client connected');

    // If WhatsApp client is already ready, notify the frontend
    if (isClientReady) {
        socket.emit('whatsappReady');
    }

    // Initialize WhatsApp client if not already initialized
    if (!whatsappClient) {
        initializeWhatsAppClient();
    }

    socket.on('disconnect', () => {
        console.log('Web client disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
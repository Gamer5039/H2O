const express = require('express');
const { chromium } = require('playwright');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Serve static files
app.use(express.static('public'));
app.use(express.json());

let browser = null;
let page = null;
let isInitializing = false;

async function initWhatsApp() {
    if (isInitializing) return;
    isInitializing = true;

    try {
        console.log('Launching browser...');
        browser = await chromium.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        
        console.log('Creating new page...');
        page = await browser.newPage();
        
        console.log('Navigating to WhatsApp Web...');
        await page.goto('https://web.whatsapp.com/');
        
        // Wait for QR code canvas and get its data URL
        console.log('Waiting for QR code...');
        const qrCanvas = await page.waitForSelector('canvas');
        const qrDataUrl = await qrCanvas.evaluate(canvas => canvas.toDataURL());
        
        console.log('Emitting QR code...');
        io.emit('qr', qrDataUrl);
        
        // Wait for WhatsApp to be ready
        console.log('Waiting for WhatsApp to be ready...');
        await page.waitForSelector('div[data-testid="chat-list"]');
        
        console.log('WhatsApp is ready!');
        io.emit('whatsappReady');
        
        // Set up message monitoring
        await page.evaluate(() => {
            window.onNewMessage = async (message) => {
                // Send message to server
                window.postMessage({
                    type: 'newMessage',
                    message: message
                }, '*');
            };

            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        const messages = document.querySelectorAll('div[data-testid="msg-container"]');
                        const lastMessage = messages[messages.length - 1];
                        if (lastMessage) {
                            window.onNewMessage(lastMessage.textContent);
                        }
                    }
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });

        // Handle incoming messages
        page.on('domcontentloaded', async () => {
            await page.evaluate(() => {
                window.addEventListener('message', async (event) => {
                    if (event.data.type === 'newMessage') {
                        const message = event.data.message;
                        if (!message.startsWith('!')) {
                            try {
                                const apiUrl = message.startsWith('/image') 
                                    ? 'https://backend.buildpicoapps.com/aero/run/image-generation-api?pk=v1-Z0FBQUFBQm5HUEtMSjJkakVjcF9IQ0M0VFhRQ0FmSnNDSHNYTlJSblE0UXo1Q3RBcjFPcl9YYy1OZUhteDZWekxHdWRLM1M1alNZTkJMWEhNOWd4S1NPSDBTWC12M0U2UGc9PQ=='
                                    : 'https://backend.buildpicoapps.com/aero/run/llm-api?pk=v1-Z0FBQUFBQm5HUEtMSjJkakVjcF9IQ0M0VFhRQ0FmSnNDSHNYTlJSblE0UXo1Q3RBcjFPcl9YYy1OZUhteDZWekxHdWRLM1M1alNZTkJMWEhNOWd4S1NPSDBTWC12M0U2UGc9PQ==';

                                const response = await fetch(apiUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ prompt: message })
                                });

                                const data = await response.json();
                                
                                if (data.status === 'success') {
                                    const replyButton = document.querySelector('span[data-testid="reply-button"]');
                                    if (replyButton) replyButton.click();
                                    
                                    const input = document.querySelector('div[contenteditable="true"]');
                                    if (input) {
                                        input.textContent = data.text;
                                        const sendButton = document.querySelector('span[data-testid="send"]');
                                        if (sendButton) sendButton.click();
                                    }
                                }
                            } catch (error) {
                                console.error('Error handling message:', error);
                            }
                        }
                    }
                });
            });
        });

    } catch (error) {
        console.error('WhatsApp initialization error:', error);
        io.emit('error', 'Failed to initialize WhatsApp. Please refresh the page.');
    } finally {
        isInitializing = false;
    }
}

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('Client connected');
    
    if (!browser && !isInitializing) {
        initWhatsApp().catch(error => {
            console.error('Error during WhatsApp initialization:', error);
            socket.emit('error', 'Failed to initialize WhatsApp. Please try again.');
        });
    }
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Error handling for browser crashes
setInterval(async () => {
    if (browser && !page) {
        console.log('Restarting browser due to crash...');
        try {
            await browser.close();
        } catch (e) {
            console.error('Error closing browser:', e);
        }
        browser = null;
        initWhatsApp().catch(console.error);
    }
}, 30000);

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
    if (browser) {
        try {
            await browser.close();
        } catch (e) {
            console.error('Error closing browser:', e);
        }
    }
    process.exit(0);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

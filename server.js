const express = require('express');
const { chromium } = require('playwright');
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

let browser = null;
let page = null;

async function initWhatsApp() {
    try {
        // Launch browser
        browser = await chromium.launch({
            args: ['--no-sandbox']
        });
        
        // Create page
        page = await browser.newPage();
        
        // Go to WhatsApp Web
        await page.goto('https://web.whatsapp.com/');
        
        // Wait for QR code element
        const qrElement = await page.waitForSelector('canvas');
        const qrData = await qrElement.evaluate((el) => el.toDataURL());
        
        // Emit QR code to all connected clients
        io.emit('qr', qrData);
        
        // Wait for WhatsApp to be ready
        await page.waitForSelector('div[data-testid="chat-list"]');
        
        // WhatsApp is ready
        io.emit('whatsappReady');
        
        // Listen for messages
        await page.evaluate(() => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        const messages = document.querySelectorAll('div[data-testid="msg-container"]');
                        const lastMessage = messages[messages.length - 1];
                        if (lastMessage) {
                            window.postMessage({
                                type: 'newMessage',
                                text: lastMessage.textContent
                            }, '*');
                        }
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
        
        // Handle messages
        page.on('domcontentloaded', async () => {
            await page.evaluate(() => {
                window.addEventListener('message', async (event) => {
                    if (event.data.type === 'newMessage') {
                        const message = event.data.text;
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
                                    // Find and click reply button
                                    const replyButton = document.querySelector('span[data-testid="reply-button"]');
                                    if (replyButton) replyButton.click();
                                    
                                    // Type and send message
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
        io.emit('error', 'Failed to initialize WhatsApp');
    }
}

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('Client connected');
    
    // Initialize WhatsApp if not already initialized
    if (!browser) {
        initWhatsApp().catch(console.error);
    }
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

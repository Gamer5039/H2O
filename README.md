# WhatsApp AI Bot with QR Code Login

A WhatsApp bot that automatically responds to messages using AI, featuring QR code login and web interface.

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fwhatsapp-ai-bot)

## Deployment Steps

1. First, install dependencies locally and test:
```bash
npm install
npm run build
npm start
```

2. Install Vercel CLI:
```bash
npm install -g vercel
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy with special Playwright configuration:
```bash
vercel deploy --build-env PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright
```

5. Once deployed, set it to production:
```bash
vercel --prod
```

## Environment Variables

Make sure these are set in your Vercel project settings:

- `PLAYWRIGHT_BROWSERS_PATH`: `/tmp/playwright`
- `NODE_ENV`: `production`

## Important: Browser Setup

After deployment, go to your Vercel project settings:

1. Go to Settings > General
2. Under "Build & Development Settings":
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Install Command: `npm install && npx playwright install chromium --with-deps`

## Using the Bot

1. Open your deployed Vercel URL
2. Wait for the QR code to appear (might take a few seconds)
3. Open WhatsApp on your phone
4. Go to Settings > WhatsApp Web
5. Scan the QR code shown on the webpage
6. When you see "WhatsApp Connected!", the bot is ready

## Features

- QR code login through web interface
- Real-time connection status
- Automatic AI responses to messages
- Image generation with `/image` command
- Persistent connection monitoring
- Auto-reconnect capability

## Troubleshooting

### QR Code Not Showing
1. Clear your browser cache
2. Try a different browser
3. Make sure your Vercel deployment is complete
4. Check Vercel logs for any errors

### Connection Issues
1. If the connection drops:
   - Refresh the page
   - Wait for new QR code
   - Scan again with WhatsApp

### Bot Not Responding
1. Check if the webpage shows "Connected"
2. Try refreshing and rescanning
3. Check Vercel logs for errors

## Technical Notes

- Uses Playwright for WhatsApp Web automation
- Socket.IO for real-time updates
- Runs on Vercel's serverless infrastructure
- Chromium browser installed during deployment
- WebSocket support enabled

## Limitations

1. Serverless timeout may require periodic reconnection
2. Keep the browser tab open for continuous operation
3. May need occasional QR code rescanning
4. Best performance on desktop browsers

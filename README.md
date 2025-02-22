# WhatsApp AI Bot with QR Login

A WhatsApp bot that uses QR code login and responds to messages using AI.

## Features

- QR code-based WhatsApp Web login
- Automatic responses using AI
- Real-time chat status
- Support for text and image generation
- Works on Vercel

## Deployment to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy with special configuration for Playwright:
```bash
vercel --build-env PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright
```

4. Create production deployment:
```bash
vercel --prod
```

## Important Notes

1. The QR code will appear on your deployed website
2. Scan it with WhatsApp on your phone:
   - Open WhatsApp
   - Go to Menu or Settings
   - Select WhatsApp Web
   - Point your phone camera at the QR code

3. Keep the browser tab open to maintain the connection

4. If the connection is lost:
   - Refresh the page
   - A new QR code will appear
   - Scan it again with WhatsApp

## Usage

1. After scanning the QR code, the bot is active
2. Anyone sending messages to your WhatsApp will get AI responses
3. For image generation, start message with `/image`
4. Regular messages get AI-generated text responses

## Troubleshooting

1. If QR code doesn't appear:
   - Refresh the page
   - Check if Vercel deployment is complete
   - Verify Playwright installation

2. If connection drops:
   - This is normal for serverless deployments
   - Simply refresh and rescan QR code

3. If bot stops responding:
   - Check if the tab is still open
   - Refresh and reconnect if needed

## Technical Details

- Uses Playwright for WhatsApp Web automation
- Socket.IO for real-time updates
- Express.js for server
- Vercel for deployment
- Special configuration for serverless environment

## Limitations

1. Connection may reset periodically due to serverless nature
2. Requires keeping the browser tab open
3. May need occasional QR code rescanning
4. Works best on desktop browsers

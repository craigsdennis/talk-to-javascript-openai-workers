# Client Side Tool Calling with the OpenAI WebRTC Realtime API

This project is a [Cloudflare Workers](https://developers.cloudflare.com) app using [Hono](https://honojs.dev) to relay the [OpenAI Realtime API](https://platform.openai.com/docs/api-reference/realtime) over WebRTC. The main files are just [static assets](https://developers.cloudflare.com/workers/static-assets/).

[<img src="https://img.youtube.com/vi/TcOytsfva0o/0.jpg">](https://youtu.be/TcOytsfva0o "Client Side Tool Calling with the OpenAI WebRTC Realtime API")


## Develop

Copy [.dev.vars.example](./.dev.vars.example) to `.dev.vars` and fill out your OpenAI API Key.

Install your dependencies

```bash
npm install
```

Run local server

```bash
npm run dev
```

## Deploy

Upload your secrets

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put REPLICATE_API_TOKEN
```

```bash
npm run deploy
```

The hand is a [HiWonder AI Hand](https://www.hiwonder.com/products/aihand?variant=41022039654487). AI and I reverse-engineered the mobile app to make it work over Bluetooth, see [the code in hand.js](./public/hand.js)

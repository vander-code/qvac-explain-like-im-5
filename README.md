# Explain It Like I'm 5 (QVAC)

Type any complicated topic and get an explanation a 5-year-old would understand. Follow up with
**Even simpler**, **Give me an example**, or **Why?**, just like a curious kid would.

All AI runs **on your own computer** using [QVAC](https://github.com/tetherto/qvac), Tether's open-source
AI SDK. No API key, no cloud service, and what you type never leaves your machine.

![screenshot](screenshot.png)

## SDK version

`@qvac/sdk` **0.19.0** (declared in `package.json`)

Functions used: `loadModel` and `completion`, with the `LLAMA_3_2_1B_INST_Q4_0` model.

## Install

You need [Node.js](https://nodejs.org) (current LTS) and about 1 GB of free disk space for the model.

```bash
git clone https://github.com/YOUR-USERNAME/qvac-eli5.git
cd qvac-eli5
npm install
```

## Run

```bash
npm start
```

Then open **http://localhost:3001** in your browser.

The first start downloads the model, which can take a few minutes. After that it loads from your disk.
Wait for the green "AI model ready" message, then type a topic and press **Explain**.

## How it works

- `server.js` loads the model with `loadModel`, then calls `completion` and streams the tokens to the browser.
- `public/index.html` is the whole interface (plain HTML, CSS and JavaScript, no build step).
- The explaining style is a short `SYSTEM_PROMPT` in `server.js`. Change "5-year-old" to any audience you like.

## License

MIT

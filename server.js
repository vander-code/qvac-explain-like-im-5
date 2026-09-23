// Explain It Like I'm 5 - a tiny local web server that runs AI on YOUR machine with QVAC.
// No API key, no cloud. Open http://localhost:3001 after starting.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadModel, completion, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

const PORT = 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The "personality". Change these rules to change how it explains.
const SYSTEM_PROMPT = `You explain things to a curious 5-year-old.
Rules:
1. Use very short sentences and very simple words. No jargon.
2. Compare the idea to something a child knows: toys, food, animals, playgrounds, bedtime.
3. Maximum 60 words. No lists, no headings.
4. Be warm and playful. You may use one emoji.
5. If the child asks for something simpler, a real-life example, or asks "why?", answer that using the same simple style.`;

// ---- Step 1: load the AI model (downloads the first time, then it's cached) ----
let modelId = null;
const status = { ready: false, message: "Starting...", percent: null, error: null };

async function startModel() {
  try {
    status.message = "Loading the AI model (first run downloads it, please wait)...";
    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: "llm",
      onProgress: (p) => {
        const value = typeof p === "number" ? p : p?.percentage;
        if (typeof value === "number") status.percent = Math.round(value);
      },
    });
    status.ready = true;
    status.message = "Model ready";
    console.log("Model loaded. Open http://localhost:" + PORT);
  } catch (err) {
    status.error = String(err?.message || err);
    console.error("Could not load model:", err);
  }
}

// ---- Step 2: a small web server ----
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    const html = await readFile(path.join(__dirname, "public", "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  if (req.method === "GET" && req.url === "/api/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(status));
  }

  // The page sends the conversation, we stream back the explanation
  if (req.method === "POST" && req.url === "/api/explain") {
    if (!status.ready) {
      res.writeHead(503);
      return res.end("Model is not ready yet.");
    }
    try {
      const { messages } = JSON.parse(await readBody(req));
      const history = [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-10)];

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });

      // This is the QVAC call that runs the AI on-device
      const run = completion({ modelId, history, stream: true });
      for await (const token of run.tokenStream) {
        res.write(token);
      }
      return res.end();
    } catch (err) {
      console.error(err);
      if (!res.headersSent) res.writeHead(500);
      return res.end("\n[Something went wrong: " + (err?.message || err) + "]");
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => console.log("Server running at http://localhost:" + PORT));
startModel();

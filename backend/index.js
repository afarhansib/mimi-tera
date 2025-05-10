const { spawn } = require('child_process');
const readline = require('readline');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_PATH = '../../../bedrock_server.exe';
const SCREENSHOT_DIR = './screenshots';
const RAW_DIR = path.join(SCREENSHOT_DIR, 'raw');
const CROPPED_DIR = path.join(SCREENSHOT_DIR, 'cropped');

const TILE_WIDTH = 180;
const TILE_HEIGHT = 180;
const TILE_ROWS = 6;
const TILE_COLS = 9;
const CROP_START_X = 1110; // <-- Adjust based on your screenshot
const CROP_START_Y = 172;

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(CROPPED_DIR)) fs.mkdirSync(CROPPED_DIR, { recursive: true });

let page = 0;
let itemNames = [];
let capturing = false;
let runOnce = false;

// Start Minecraft Bedrock server
const server = spawn(SERVER_PATH);
const rl = readline.createInterface({ input: server.stdout });

console.log('🟢 Server starting, waiting to send first command...');

rl.on('line', async (line) => {
  console.log('[Server]', line);

  // Track item logs
  const itemMatch = line.match(/item_slot:(\d+):(minecraft:[\w_]+)/);
  if (itemMatch) {
    const slot = parseInt(itemMatch[1]);
    const id = itemMatch[2];
    itemNames[slot] = id;
    capturing = true;
    return;
  }

  // Page completion detected
  const nextMatch = line.match(/__next__ page:(\d+)/);
  if (nextMatch) {
    const pageNum = parseInt(nextMatch[1]);

    if (!capturing) {
      console.log(`✅ All items processed. No items found on page ${pageNum}.`);
      return;
    }

    console.log(`✔ Page ${pageNum} complete. Taking screenshot...`);

    const rawPath = path.join(RAW_DIR, `page-${pageNum}.png`);
    const img = await screenshot({ format: 'png' });
    fs.writeFileSync(rawPath, img);
    console.log(`📸 Saved screenshot to ${rawPath}`);

    const image = sharp(rawPath);
    const { width, height } = await image.metadata();
    console.log(`📷 Screenshot dimensions: ${width}x${height}`);
    const crops = [];

    for (let row = 0; row < TILE_ROWS; row++) {
      for (let col = 0; col < TILE_COLS; col++) {
        const index = row * TILE_COLS + col;
        const id = itemNames[index] ?? `page${pageNum}-slot${index}`;
        const safeName = id.replace('minecraft:', '').replace(/[^a-z0-9_]/gi, '_');
        const outPath = path.join(CROPPED_DIR, `${safeName}.png`);

        const left = CROP_START_X + col * TILE_WIDTH;
        const top = CROP_START_Y + row * TILE_HEIGHT;

        console.log(`🔍 Attempting crop for ${safeName}: left=${left}, top=${top}, width=${TILE_WIDTH}, height=${TILE_HEIGHT}`);

        // Validate crop area
        if (left + TILE_WIDTH <= width && top + TILE_HEIGHT <= height) {
          crops.push({ outPath, left, top, width: TILE_WIDTH, height: TILE_HEIGHT });
        } else {
          console.warn(`⚠️ Skipping crop for ${outPath}: Out of bounds (left: ${left}, top: ${top})`);
        }
      }
    }

    // Process crops sequentially
    for (const crop of crops) {
      try {
        // console.log(JSON.stringify(crop, null, 2));
        // Create new sharp instance for each crop
        const cropImage = sharp(rawPath);
        // Check pixel data for the crop area
        const { data, info } = await cropImage
          .extract({
            left: crop.left,
            top: crop.top,
            width: crop.width,
            height: crop.height,
          })
          .raw()
          .toBuffer({ resolveWithObject: true });
        // console.log(`🔎 Pixel data for ${crop.outPath}: ${info.width}x${info.height}, size=${data.length} bytes`);

        // Perform the actual crop and save
        await sharp(rawPath)
          .extract({
            left: crop.left,
            top: crop.top,
            width: crop.width,
            height: crop.height,
          })
          .png() // Explicitly ensure PNG output
          .toFile(crop.outPath);
        console.log(`🖼️ Cropped: ${crop.outPath}`);
      } catch (err) {
        console.error(`❌ Error cropping ${crop.outPath}: ${err.message}`);
      }
    }

    if (runOnce) {
      console.log('⏹️ Done with single page run.');
      return;
    }

    // Prepare next
    itemNames = [];
    capturing = false;
    page++;
    console.log(`➡️ Requesting next page (${page})...`);
    server.stdin.write(`scriptevent mimi:tera page:${page}\n`);
  }
});

// Listen for user manual "start" in terminal
const userInput = readline.createInterface({ input: process.stdin, output: process.stdout });

userInput.on('line', (input) => {
  const cmd = input.trim().toLowerCase();
  if (cmd === 'start') {
    console.log('▶ Manual start received. Sending page 0...');
    runOnce = false;
    page = 0;
    server.stdin.write(`scriptevent mimi:tera page:0\n`);
  }
  if (cmd === 'once') {
    console.log('▶ Running one page only...');
    runOnce = true;
    page = 0;
    server.stdin.write(`scriptevent mimi:tera page:0\n`);
  }
});
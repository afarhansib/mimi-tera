# Minecraft Bedrock Item Texture Extractor

This project automates the extraction of item textures from Minecraft Bedrock Edition by running a local Bedrock server, capturing screenshots of item inventories, and cropping individual item icons into PNG files.

## Prerequisites

- **Node.js** (v23.8.0 or later)
- **Minecraft Bedrock Server** (place `bedrock_server.exe` in the appropriate directory)
- **Windows** (for `screenshot-desktop` compatibility)
- **Dependencies**:
  - `sharp` (for image processing)
  - `screenshot-desktop` (for capturing screenshots)
  - `child_process`, `readline`, `fs`, `path` (Node.js built-in modules)

Install dependencies:
```bash
npm install sharp screenshot-desktop
```

## Setup

1. **Place Bedrock Server**:
   - Ensure `bedrock_server.exe` is located at `../../../bedrock_server.exe` relative to the script or update `SERVER_PATH` in `index.js`.

2. **Directory Structure**:
   - The script creates:
     - `screenshots/raw/` for raw screenshots
     - `screenshots/cropped/` for cropped item textures
   - Ensure write permissions for the `screenshots/` directory.

3. **Configure Crop Parameters**:
   - In `index.js`, adjust if needed:
     - `CROP_START_X`, `CROP_START_Y`: Starting coordinates of the item grid
     - `TILE_WIDTH`, `TILE_HEIGHT`: Size of each item icon (default: 180x180)
     - `TILE_ROWS`, `TILE_COLS`: Grid size (default: 6x9)

## Usage

1. **Start the Script**:
   ```bash
   node index.js
   ```

2. **Run Commands**:
   - Type `start` in the terminal to process all item pages sequentially.
   - Type `once` to process only the first page (54 items).

3. **Output**:
   - Raw screenshots are saved in `screenshots/raw/page-<pageNum>.png`.
   - Cropped item textures are saved in `screenshots/cropped/<itemName>.png` (e.g., `acacia_boat.png`).

## How It Works

- **Server Interaction**: The script spawns a Minecraft Bedrock server and sends `scriptevent mimi:tera page:<pageNum>` commands to display item inventories.
- **Screenshot Capture**: Uses `screenshot-desktop` to capture the screen when a page is complete.
- **Image Processing**: Uses `sharp` to crop the screenshot into a 6x9 grid of 180x180 pixel item icons, named based on item IDs (e.g., `minecraft:acacia_boat`).
- **Error Handling**: Logs out-of-bounds crops and processing errors, ensuring robust operation.

## Notes

- **Resolution**: The script assumes a 3840x2160 screenshot. Adjust crop parameters if using a different resolution.
- **Transparency**: Cropped PNGs preserve transparency for item icons.
- **Performance**: Crops are processed sequentially to avoid resource contention.

## Troubleshooting

- **Crop Errors**: If `extract_area: bad extract area` occurs, verify `CROP_START_X`, `CROP_START_Y`, and screenshot dimensions.
- **Artifacts**: Ensure the screenshot capture is clean; check display scaling or Minecraft GUI settings.
- **Dependencies**: Update `sharp` (`npm install sharp@latest`) if image processing fails.

## Acknowledgments

- This project was developed with assistance from **ChatGPT** and **Grok AI** for debugging and optimization.

## License

This project is **Unlicensed**. You are free to use and modify it, but no formal license is provided.
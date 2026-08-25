# Pixel Art Generator

Phase A provides the core, browser-local image engine for turning an uploaded image into an exact pixel grid and a sharp pixel-art preview.

## Architecture

The project intentionally uses only vanilla HTML, CSS, and JavaScript:

- `index.html` contains the accessible upload, width controls, source preview, generated canvas, and pattern information.
- `styles.css` supplies a responsive two-panel desktop layout, a stacked mobile layout, and unsmoothed canvas presentation.
- `script.js` validates and decodes images, calculates the grid, retains its exact RGBA data in memory, and renders the preview.

No build process, framework, server, or third-party dependency is required.

## Phase A features

- Uploads PNG, JPG/JPEG, and WEBP images. The UI calls the limit **50 MB**; the enforced limit is `50 * 1024 * 1024` bytes (**52,428,800 bytes / 50 MiB**).
- Rejects unsupported, oversized, and undecodable files with readable live status messages.
- Shows the proportional original image preview.
- Generates automatically at the default width of **30 pixels**.
- Provides synchronized range and number controls for widths from **5–150 pixels**. Decimals round to the nearest whole number, values outside the range clamp to its nearest endpoint, and blank or invalid values fall back to the current valid width.
- Calculates height as `Math.max(1, Math.round(originalHeight * targetWidth / originalWidth))`.
- Stores the generated grid's exact width, height, and RGBA pixel data for later phases.
- Reports exact pattern dimensions and `width × height` total pixels.
- Enlarges the generated canvas with browser smoothing disabled.
- Cleans up temporary object URLs when they are replaced, fail to decode, become stale, or the page unloads.

## Privacy

Images are decoded and processed exclusively in the browser. They are not uploaded or stored. Only the current source image and generated grid are retained in browser memory; they are replaced when a new valid image is loaded or a new pattern is generated.

## Run locally

Open `index.html` directly in a modern browser, or serve the directory with any static file server, for example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Phase A verification

Phase A was checked with `node --check script.js` and `git diff --check`. Target-width cases `5, 10, 20, 30, 50, 100, 150` were verified against the approved proportional-height formula and `width * height` total calculation. The implementation also covers synchronized controls, safe invalid-width resolution, supported-file and 50 MB validation, decode failure recovery, source preview display, automatic first generation, retained grid data, and an unsmoothed preview.

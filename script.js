(() => {
  "use strict";

  const MIN_WIDTH = 5;
  const MAX_WIDTH = 150;
  const DEFAULT_WIDTH = 30;
  const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;
  const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
  const ACCEPTED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

  const upload = document.querySelector("#image-upload");
  const status = document.querySelector("#status");
  const generator = document.querySelector("#generator");
  const originalPreview = document.querySelector("#original-preview");
  const widthRange = document.querySelector("#width-range");
  const widthNumber = document.querySelector("#width-number");
  const widthOutput = document.querySelector("#width-output");
  const previewCanvas = document.querySelector("#pattern-canvas");
  const patternSize = document.querySelector("#pattern-size");
  const totalPixels = document.querySelector("#total-pixels");
  const processingCanvas = document.createElement("canvas");

  let sourceImage = null;
  let sourceUrl = null;
  let currentWidth = DEFAULT_WIDTH;
  let generationTimer = 0;
  let pixelGrid = null;
  let uploadSequence = 0;

  function setStatus(message, state) {
    status.textContent = message;
    status.className = `status is-${state}`;
  }

  function fileIsSupported(file) {
    const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
    return ACCEPTED_TYPES.has(file.type.toLowerCase()) || (!file.type && ACCEPTED_EXTENSIONS.has(extension));
  }

  function resolveWidth(value, fallback = currentWidth) {
    if (value === "" || value === null || value === undefined) return fallback;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(numeric)));
  }

  function syncWidth(width) {
    currentWidth = width;
    widthRange.value = String(width);
    widthNumber.value = String(width);
    widthOutput.value = String(width);
    widthOutput.textContent = String(width);
  }

  function calculateHeight(originalWidth, originalHeight, targetWidth) {
    return Math.max(1, Math.round(originalHeight * targetWidth / originalWidth));
  }

  function generatePattern() {
    if (!sourceImage) return;
    setStatus("Generating pattern...", "processing");

    window.requestAnimationFrame(() => {
      const targetHeight = calculateHeight(sourceImage.naturalWidth, sourceImage.naturalHeight, currentWidth);
      processingCanvas.width = currentWidth;
      processingCanvas.height = targetHeight;
      const processingContext = processingCanvas.getContext("2d", { willReadFrequently: true });
      processingContext.imageSmoothingEnabled = true;
      processingContext.clearRect(0, 0, currentWidth, targetHeight);
      processingContext.drawImage(sourceImage, 0, 0, currentWidth, targetHeight);
      const imageData = processingContext.getImageData(0, 0, currentWidth, targetHeight);

      pixelGrid = { width: currentWidth, height: targetHeight, data: new Uint8ClampedArray(imageData.data) };
      previewCanvas.width = pixelGrid.width;
      previewCanvas.height = pixelGrid.height;
      const previewContext = previewCanvas.getContext("2d");
      previewContext.imageSmoothingEnabled = false;
      previewContext.putImageData(imageData, 0, 0);

      patternSize.textContent = `${pixelGrid.width} × ${pixelGrid.height}`;
      totalPixels.textContent = (pixelGrid.width * pixelGrid.height).toLocaleString();
      setStatus("Pattern generated successfully.", "loaded");
    });
  }

  function scheduleGeneration() {
    window.clearTimeout(generationTimer);
    generationTimer = window.setTimeout(generatePattern, 60);
  }

  function applyWidth(value, regenerate = true) {
    const resolved = resolveWidth(value);
    const changed = resolved !== currentWidth;
    syncWidth(resolved);
    if (sourceImage && regenerate && changed) scheduleGeneration();
  }

  function decodeImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth && image.naturalHeight ? resolve(image) : reject(new Error("empty image"));
      image.onerror = () => reject(new Error("decode failed"));
      image.src = url;
    });
  }

  async function handleUpload() {
    const requestSequence = ++uploadSequence;
    const file = upload.files && upload.files[0];
    if (!file) {
      setStatus("Please choose an image file.", "error");
      return;
    }
    if (!fileIsSupported(file)) {
      setStatus("Unsupported file type. Choose a PNG, JPG/JPEG, or WEBP image.", "error");
      upload.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setStatus("That image is larger than the 50 MB upload limit.", "error");
      upload.value = "";
      return;
    }

    setStatus("Loading image...", "processing");
    const candidateUrl = URL.createObjectURL(file);
    try {
      const candidateImage = await decodeImage(candidateUrl);
      if (requestSequence !== uploadSequence) {
        URL.revokeObjectURL(candidateUrl);
        return;
      }
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      sourceUrl = candidateUrl;
      sourceImage = candidateImage;
      originalPreview.src = sourceUrl;
      originalPreview.alt = `Original uploaded image: ${file.name}`;
      generator.hidden = false;
      syncWidth(DEFAULT_WIDTH);
      generatePattern();
    } catch (error) {
      URL.revokeObjectURL(candidateUrl);
      if (requestSequence !== uploadSequence) return;
      setStatus("This image could not be read. Please try another file.", "error");
      upload.value = "";
      if (!sourceImage) {
        generator.hidden = true;
        originalPreview.removeAttribute("src");
        pixelGrid = null;
      }
    }
  }

  upload.addEventListener("change", handleUpload);
  widthRange.addEventListener("input", (event) => applyWidth(event.target.value));
  widthNumber.addEventListener("input", (event) => {
    if (event.target.value !== "") applyWidth(event.target.value);
  });
  widthNumber.addEventListener("change", (event) => applyWidth(event.target.value));
  widthNumber.addEventListener("blur", (event) => applyWidth(event.target.value));
  window.addEventListener("beforeunload", () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
  });

  syncWidth(DEFAULT_WIDTH);

  window.pixelArtEngine = Object.freeze({
    calculateHeight,
    resolveWidth,
    getPixelGrid: () => pixelGrid,
    constants: Object.freeze({ MIN_WIDTH, MAX_WIDTH, DEFAULT_WIDTH, MAX_UPLOAD_SIZE })
  });
})();

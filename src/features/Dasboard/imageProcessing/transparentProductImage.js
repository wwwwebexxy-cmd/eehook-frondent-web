const DEFAULT_BACKGROUND_THRESHOLD = 245;
const DEFAULT_COLOR_TOLERANCE = 35;

function isLightBackgroundPixel(data, index, threshold, tolerance) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightest = Math.max(red, green, blue);
    const darkest = Math.min(red, green, blue);

    return brightest >= threshold && brightest - darkest <= tolerance;
}

/**
 * Removes only light pixels connected to the image edge. Product highlights
 * inside the subject are preserved because they are not connected to the edge.
 * The input is mutated so it can be used directly with ImageData.
 */
export function removeLightBackgroundFromPixels(
    data,
    width,
    height,
    { threshold = DEFAULT_BACKGROUND_THRESHOLD, tolerance = DEFAULT_COLOR_TOLERANCE } = {},
) {
    if (!data?.length || width <= 0 || height <= 0) return data;

    const visited = new Uint8Array(width * height);
    const queue = [];
    const enqueue = (x, y) => {
        const pixel = y * width + x;
        if (visited[pixel]) return;
        visited[pixel] = 1;
        queue.push(pixel);
    };

    for (let x = 0; x < width; x += 1) {
        enqueue(x, 0);
        enqueue(x, height - 1);
    }
    for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y);
        enqueue(width - 1, y);
    }

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
        const pixel = queue[cursor];
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const dataIndex = pixel * 4;

        if (!isLightBackgroundPixel(data, dataIndex, threshold, tolerance)) continue;
        data[dataIndex + 3] = 0;

        if (x > 0) enqueue(x - 1, y);
        if (x < width - 1) enqueue(x + 1, y);
        if (y > 0) enqueue(x, y - 1);
        if (y < height - 1) enqueue(x, y + 1);
    }

    return data;
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not read the selected image."));
        };
        image.src = objectUrl;
    });
}

/**
 * Converts a product image to a transparent PNG without sending it to a
 * third-party service. If processing is not supported, the original file is
 * returned so upload remains available.
 */
export async function makeProductImageTransparent(file) {
    if (!(file instanceof File) || !file.type.startsWith("image/")) return file;

    const image = await loadImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    removeLightBackgroundFromPixels(imageData.data, imageData.width, imageData.height);
    context.putImageData(imageData, 0, 0);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "product-image";
    return new File([blob], `${baseName}.png`, { type: "image/png", lastModified: Date.now() });
}

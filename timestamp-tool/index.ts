const path = require('node:path');
const Jimp = require('jimp');
const exif = require('fast-exif');
import { readdir } from 'node:fs/promises';

const BASE_PATH = `F:/Pictures - 2022-08-05/2022-08-09/4k Timelapse`;
const FONT_SIZE_PX = 72;
const TEXT_PADDING_PX = 32;
const FONT_FILE_PATH = `F:/Pictures - 2022-08-05/2022-08-09/4k Timelapse/myi5rkI3nykZ8YGD5cVVUKry.ttf.fnt`;
const OVERLAY_PNG_PATH = `F:/Pictures - 2022-08-05/2022-08-09/4k Timelapse/overlay.png`;
const OVERLAY_HEIGHT_PX = 142;

const getFormattedDateString = (d: Date) => {
    let year = d.getUTCFullYear();
    let month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    let dt = d.getUTCDate().toString().padStart(2, "0");

    return `${year}-${month}-${dt}`;
}

const getFormattedTimeStringNoSecs = (d: Date) => {
    let hour24 = d.getUTCHours().toString().padStart(2, "0");
    let min = d.getUTCMinutes().toString().padStart(2, "0");

    return `${hour24}:${min}`;
}

const addTimestamp = async (filename: string, jimpFont: any, textBackgroundOverlay: any) => {
    const filePath = path.join(BASE_PATH, filename);

    const currentImageExif = await exif.read(filePath);
    // Dates are formatted in camera's local time but encoded
    // as if they are UTC.
    const d = new Date(currentImageExif.exif["DateTimeOriginal"]);
    const timeString = `${getFormattedDateString(d)} ${getFormattedTimeStringNoSecs(d)}`;
    process.stdout.write(`${timeString}...`);

    const currentImage = await Jimp.read(filePath);
    currentImage.composite(textBackgroundOverlay, 0, currentImage.bitmap.height - OVERLAY_HEIGHT_PX);
    currentImage.print(jimpFont, TEXT_PADDING_PX, currentImage.bitmap.height - TEXT_PADDING_PX - FONT_SIZE_PX, timeString);
    await (currentImage.quality(90)).writeAsync(filePath);

}

const start = async () => {
    const font = await Jimp.loadFont(FONT_FILE_PATH);
    const overlay = await Jimp.read(OVERLAY_PNG_PATH);


    try {
        const files = await readdir(BASE_PATH);

        let totalFrames = 0;
        for (const file of files) {
            if (path.extname(file) !== ".jpg") {
                continue;
            }
            totalFrames++;
        }

        let framesProcessed = 0;
        let startTime = Date.now();

        for (const file of files) {
            if (path.extname(file) !== ".jpg") {
                continue;
            }

            process.stdout.write(`Processing \`${file}\`...`);
            await addTimestamp(file, font, overlay);
            framesProcessed++;

            const elapsedTime = Date.now() - startTime;
            const totalEstimatedTimeMs = 1 / ((framesProcessed / totalFrames) / elapsedTime);
            const totalRemainingTimeMs = totalEstimatedTimeMs - elapsedTime;

            process.stdout.write(`done. (${framesProcessed}/${totalFrames} total) (${Math.round(framesProcessed / totalFrames * 100)}%) ~${Math.round(totalRemainingTimeMs / 1000)}s remaining...\n`);

        }
    } catch (err) {
        console.error(err);
    }
}

start();

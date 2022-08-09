const path = require('node:path');
const Jimp = require('jimp');

const BASE_PATH = `F:/Pictures - 2022-08-05/2022-08-07/Timelapse/4k Timelapse`;

// TODO: Read Exif data of input images.
// Determine nominal interval.
// Determine anomalous intervals.
// Automatically determine correct number of tweening frames (i.e. auto-fill `IMAGES_TO_PROCESS`).
// Upon user input, auto-rename all files in `BASE_PATH`

// [
//     Start image filename (no `.jpg`) (inclusive),
//     end image filename (no `.jpg`) (inclusive),
//     actual interval, seconds
// ]
// Do not include very last filename.
const NOMINAL_INTERVAL_S = 4;
const IMAGES_TO_PROCESS = [
    // [6301, 6301, 8],
    // [6303, 6341, 8],
    // [6342, 6353, 12],
    // [6354, 6360, 16],
    // [6361, 6365, 20],
    // [6366, 6368, 24],
    // [6369, 6371, 28],
    // [6372, 6373, 32],
    // [6374, 6397, 36],
    [6398, 6398, 60],
    [6399, 6399, 48],
    // [6400, 6683, 12],
];

const easeInOutSin = (x: number) => {
    return -(Math.cos(Math.PI * x) - 1) / 2;
}

const easeInSin = (x: number) => {
    return 1 - Math.cos((x * Math.PI) / 2);
}

const easeOutSin = (x: number) => {
    return Math.sin((x * Math.PI) / 2);
}

const easeInOutQuad = (x: number) => {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

const easeInOutQuart = (x: number) => {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

const start = async () => {
    let totalTweeningFrames = 0;
    for (const currentSet of IMAGES_TO_PROCESS) {
        totalTweeningFrames += ((currentSet[1] - currentSet[0]) + 1) * (Math.round(currentSet[2] / NOMINAL_INTERVAL_S) - 1);
    }

    let tweeningFramesProcessed = 0;
    let startTime = Date.now();

    for (const currentSet of IMAGES_TO_PROCESS) {
        let currentImageNumber = currentSet[0];
        const lastImageNumber = currentSet[1];
        const numInsertionFrames = Math.round(currentSet[2] / NOMINAL_INTERVAL_S) - 1;
    
        while (currentImageNumber <= lastImageNumber) {
            const currentImageFilename = `${currentImageNumber.toString()}.jpg`;
            const nextImageFilename = `${(currentImageNumber + 1).toString()}.jpg`;
            console.log(`Blending \`${currentImageFilename}\` and \`${nextImageFilename}\` with ${numInsertionFrames} tweening frame${numInsertionFrames === 1 ? "" : "s"}...`);
    
            const currentImagePath = path.join(BASE_PATH, currentImageFilename);
            const nextImagePath = path.join(BASE_PATH, nextImageFilename);
        
            const currentImage = await Jimp.read(currentImagePath);
            const nextImage = await Jimp.read(nextImagePath);
    
            const incrementor = 1 / (numInsertionFrames + 1);
            let currentBlendOpacity = incrementor;
    
            let currentInsertionFrame = 1;
            while (currentInsertionFrame <= numInsertionFrames) {
                process.stdout.write(`Blend Opacity: ${Math.round(currentBlendOpacity * 100)}%...`);
                
                let currentComposite = currentImage.composite(nextImage, 0, 0, {
                    mode: Jimp.BLEND_SOURCE_OVER,
                    opacitySource: currentBlendOpacity,
                    opacityDest: 1.0
                }).quality(90);
                
                const currentCompositeOutputPath = path.join(BASE_PATH, `${currentImageNumber.toString()}_${currentInsertionFrame.toString().padStart(numInsertionFrames.toString().length, "0")}.jpg`);
                
                await currentComposite.writeAsync(currentCompositeOutputPath);
                tweeningFramesProcessed++;

                process.stdout.write(`done. (${tweeningFramesProcessed}/${totalTweeningFrames} total) (${Math.round(tweeningFramesProcessed / totalTweeningFrames * 100)}%)\n`);
                
                currentBlendOpacity += incrementor;
                currentInsertionFrame++;
            }

            const elapsedTime = Date.now() - startTime;
            const totalEstimatedTimeMs = 1 / ((tweeningFramesProcessed / totalTweeningFrames) / elapsedTime);
            const totalRemainingTimeMs = totalEstimatedTimeMs - elapsedTime;

            console.log(`Processed \`${currentImageFilename}\`! ${Math.round(totalRemainingTimeMs / 1000)}s remaining...\n`);
    
            currentImageNumber++;
        }
    }
}

start();

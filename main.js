let cacheBlockSize = 8; // 8 entries = 32 bytes
let maxBlocks = 64;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let rows = 65;
let cols = 65;

const BORDER_SIZE = 2;
const CELL_SIZE = 8;
const OUTER_CELL_SIZE = CELL_SIZE + BORDER_SIZE;

function setCanvasDim() {
    canvas.width = cols * OUTER_CELL_SIZE + BORDER_SIZE;
    canvas.height = rows * OUTER_CELL_SIZE + BORDER_SIZE;
}

function clearBorders() {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = BORDER_SIZE;
    ctx.beginPath();
    for (let i = BORDER_SIZE / 2; i < canvas.width; i += OUTER_CELL_SIZE) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }
    for (let i = BORDER_SIZE / 2; i < canvas.height; i += OUTER_CELL_SIZE) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
    }
    ctx.stroke();
}

function initCanvas() {
    setCanvasDim();
    ctx.fillStyle = "#888";
    ctx.fillRect(0, 0, canvas.width, OUTER_CELL_SIZE);
    ctx.fillRect(0, 0, OUTER_CELL_SIZE, canvas.height);
    clearBorders();
}

let cacheQueue = [];

function drawCache() {
    clearBorders();
    ctx.strokeStyle = "#f00";
    for (let i of cacheQueue) {
        let blocks = cacheBlockSize;
        let currentSegment = Math.min(blocks, cols - i % cols);
        while (blocks > 0) {
            ctx.strokeRect(toX(i) + BORDER_SIZE / 2,
                toY(i) + BORDER_SIZE / 2,
                currentSegment * OUTER_CELL_SIZE,
                OUTER_CELL_SIZE);
            blocks -= currentSegment;
            i += currentSegment;
            currentSegment = Math.min(blocks, cols - i % cols);
        }
    }
}

function loadCache(i) {
    i -= i % cacheBlockSize;
    const queueIndex = cacheQueue.findIndex(x => x == i);
    cacheQueue.push(i);
    if (queueIndex >= 0) {
        cacheQueue.splice(queueIndex, 1);
        return 0;
    }
    if (cacheQueue.length >= maxBlocks)
        cacheQueue.shift();
    return 1;
}

function toX(i) {
    return i % cols * OUTER_CELL_SIZE;
}

function toY(i) {
    return Math.floor(i / cols) * OUTER_CELL_SIZE;
}

initCanvas();

let animationState = false;
const timerLabel = document.getElementById("timer");
const missesLabel = document.getElementById("misses");
const speedup = document.getElementById("speedup");
function animate(f) {
    const missColors = ["#0f0", "#8f0", "#ff0", "#f80", "#f00"];
    let i = cols + 1;
    let t = 0;
    let misses = 0;
    function drawFrame() {
        if (!animationState || i < 0) {
            pauseAnimation();
            return;
        }

        const cacheDelay = loadCache(i)
            + loadCache(i - 1)
            + loadCache(i - cols)
            + loadCache(i - cols - 1);
        misses += cacheDelay;

        drawCache();
        ctx.fillStyle = missColors[cacheDelay];
        ctx.fillRect(toX(i) + BORDER_SIZE,
            toY(i) + BORDER_SIZE,
            CELL_SIZE,
            CELL_SIZE);

        if (cacheDelay == 0) {
            t++;
            requestAnimationFrame(drawFrame);
        } else {
            t += 10 * cacheDelay;
            if (speedup.checked)
                requestAnimationFrame(drawFrame);
            else
                setTimeout(() => requestAnimationFrame(drawFrame), 100 * cacheDelay);
        }

        timerLabel.textContent = t;
        missesLabel.textContent = misses;
        i = f(i);
    }

    initCanvas();
    cacheQueue = [];
    requestAnimationFrame(drawFrame);
}

function rowMajorOrder(i) {
    i++;
    if (i % cols == 0)
        i++;
    if (i < rows * cols)
        return i
    else
        return -1;
}

function colMajorOrder(i) {
    let r = Math.floor(i / cols);
    let c = i % cols;
    r++;
    if (r >= rows) {
        r = 1;
        c++;
    }
    if (c < cols)
        return r * cols + c;
    else
        return -1;
}

function antiDiag(i) {
    let r = Math.floor(i / cols);
    let c = i % cols;
    r++;
    c--;
    if (c <= 0) {
        c = r;
        r = 1;
    } else if (r >= rows) {
        c += rows;
        r = 1;
    }

    if (c >= cols) {
        r += c - cols + 1;
        c = cols - 1;
    }

    i = r * cols + c;
    if (i < rows * cols)
        return i;
    else
        return -1;
}

// Form js

const form = document.getElementById("parameters");
const rowsInput = document.getElementById("rows");
const colsInput = document.getElementById("cols");
const blockSizeInput = document.getElementById("block-size");
const cacheSizeInput = document.getElementById("cache-size");
const orderSelection = document.getElementById("order-selection");
const play = document.getElementById("play");
const orderFunctions = [rowMajorOrder, colMajorOrder, antiDiag];

function setInputValues() {
    blockSizeInput.value = cacheBlockSize * 4;
    cacheSizeInput.value = maxBlocks * cacheBlockSize * 4;
    rowsInput.value = rows;
    colsInput.value = cols;
}

setInputValues();

form.addEventListener("submit", function (e) {
    pauseAnimation();
    cacheBlockSize = Math.max(Math.round(parseInt(blockSizeInput.value) / 4), 1);
    maxBlocks = Math.max(Math.round(parseInt(cacheSizeInput.value) / (cacheBlockSize * 4)), 1);
    rows = Math.max(parseInt(rowsInput.value), 1);
    cols = Math.max(parseInt(colsInput.value), 1);
    setInputValues();
    initCanvas();
    e.preventDefault();
});

function playAnimation() {
    animationState = true;
    animate(orderFunctions[orderSelection.selectedIndex]);
    play.textContent = "Pause";
}

function pauseAnimation() {
    animationState = false;
    play.textContent = "Play";
}

play.addEventListener("click", function () {
    if (animationState)
        pauseAnimation();
    else
        playAnimation();
});

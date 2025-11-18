const fs = require('fs');
const { createCanvas } = require('canvas');

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Create rounded rectangle background with gradient
const cornerRadius = 115; // Rounded corners like macOS icons

// Draw rounded rectangle background with pink gradient
const gradient = ctx.createLinearGradient(0, 0, 0, size);
gradient.addColorStop(0, '#FF8DB3');  // Lighter pink at top
gradient.addColorStop(1, '#FF6B9D');  // Darker pink at bottom

ctx.fillStyle = gradient;
ctx.beginPath();
ctx.moveTo(cornerRadius, 0);
ctx.lineTo(size - cornerRadius, 0);
ctx.quadraticCurveTo(size, 0, size, cornerRadius);
ctx.lineTo(size, size - cornerRadius);
ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
ctx.lineTo(cornerRadius, size);
ctx.quadraticCurveTo(0, size, 0, size - cornerRadius);
ctx.lineTo(0, cornerRadius);
ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
ctx.closePath();
ctx.fill();

// Add subtle inner shadow for depth
ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
ctx.shadowBlur = 20;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 10;

// Draw white heart in center
ctx.fillStyle = '#FFFFFF'; // White heart
ctx.beginPath();

// Heart shape using bezier curves
const x = size / 2;
const width = 280 * 1.15;  // Slightly smaller to fit nicely in background
const height = 280 * 1.15;

// Center the heart vertically
const y = (size - height) / 2 + 40;

const topCurveHeight = height * 0.3;

ctx.moveTo(x, y + topCurveHeight);

// Top left curve
ctx.bezierCurveTo(
    x, y,
    x - width / 2, y,
    x - width / 2, y + topCurveHeight
);

// Bottom left curve
ctx.bezierCurveTo(
    x - width / 2, y + (height + topCurveHeight) / 2,
    x, y + (height + topCurveHeight) / 2,
    x, y + height
);

// Bottom right curve
ctx.bezierCurveTo(
    x, y + (height + topCurveHeight) / 2,
    x + width / 2, y + (height + topCurveHeight) / 2,
    x + width / 2, y + topCurveHeight
);

// Top right curve
ctx.bezierCurveTo(
    x + width / 2, y,
    x, y,
    x, y + topCurveHeight
);

ctx.closePath();
ctx.fill();

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./icon.png', buffer);

console.log('Pink background with white heart icon generated: icon.png');

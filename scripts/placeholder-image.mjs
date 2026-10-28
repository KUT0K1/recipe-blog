// Generates a neutral placeholder cover image until real photos are added.
// Usage: node scripts/placeholder-image.mjs <recipe-id> [hue]
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const [id, hue = "30"] = process.argv.slice(2);
if (!id) {
  console.error("Usage: node scripts/placeholder-image.mjs <recipe-id> [hue]");
  process.exit(1);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1067" viewBox="0 0 1600 1067">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 45% 88%)"/>
      <stop offset="1" stop-color="hsl(${hue} 40% 76%)"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1067" fill="url(#bg)"/>
  <g fill="none" stroke="hsl(${hue} 30% 45%)" stroke-width="18" stroke-linecap="round" opacity="0.55">
    <circle cx="800" cy="533" r="230"/>
    <circle cx="800" cy="533" r="160"/>
    <path d="M470 330v140a45 45 0 0 0 45 45v220M470 330v120M515 330v120M560 330v140a45 45 0 0 1-45 45"/>
    <path d="M1110 330c-55 30-70 120-70 200h70v205"/>
  </g>
</svg>`;

const dir = `src/assets/recipes/${id}`;
mkdirSync(dir, { recursive: true });
await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(`${dir}/cover.webp`);
console.log(`Wrote ${dir}/cover.webp`);

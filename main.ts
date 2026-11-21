// main.ts — The Passport Page of a Country That Isn't There.
//
// Writes the Aurelia passport spread (entry.png, bundled beside this file)
// to the output directory as /output/entry.png. The image itself is a
// fixed asset composed for this entry; this program only validates it
// against the competition gate (whole PNG, <= 1 MiB, <= 1024 x 1024 px)
// and copies it out. Node 22, standard library only, no network.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MAX_BYTES = 1_048_576;
const MAX_DIMENSION = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function fail(message: string): never {
  console.error(`entry: ${message}`);
  process.exit(1);
}

function readPngDimensions(png: Buffer): { width: number; height: number } {
  if (png.length < 24 || !png.subarray(0, 8).equals(PNG_MAGIC)) {
    fail("entry.png is not a PNG file");
  }
  const chunk = png.toString("ascii", 12, 16);
  if (chunk !== "IHDR") {
    fail("entry.png has no IHDR chunk");
  }
  if (png.readUInt32BE(8) !== 13) {
    fail("entry.png has a malformed IHDR chunk");
  }
  // A whole PNG ends with an IEND chunk; a truncated file has none.
  const tail = png.subarray(png.length - 12);
  if (tail.toString("ascii", 4, 8) !== "IEND") {
    fail("entry.png is truncated (no IEND chunk)");
  }
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

function main(): void {
  const botDir = resolve(process.env.MAKEFUN_BOT_DIR ?? ".");
  const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
  const source = join(botDir, "entry.png");

  if (!existsSync(source)) {
    fail(`missing bundled image: ${source}`);
  }
  const png = readFileSync(source);
  if (png.length > MAX_BYTES) {
    fail(`entry.png is ${png.length} bytes, over the ${MAX_BYTES} byte cap`);
  }
  const { width, height } = readPngDimensions(png);
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    fail(`entry.png is ${width}x${height}, over the ${MAX_DIMENSION}px cap`);
  }

  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, "entry.png");
  writeFileSync(target, png);
  console.log(
    `entry: wrote ${target} (${width}x${height}, ${png.length} bytes)`,
  );
}

main();

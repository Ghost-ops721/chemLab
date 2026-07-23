import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const OUT_DIR = "../final";
mkdirSync(OUT_DIR, { recursive: true });

const compositions = [
  "01-HeroIntro",
  "02-FeatureDemo",
  "03-ReactionMoment",
  "04-Gamification",
  "05-SignupCTA",
];

for (const id of compositions) {
  const out = `${OUT_DIR}/remotion-${id}.mp4`;
  console.log(`\n=== Rendering ${id} -> ${out} ===`);
  execSync(
    `npx remotion render src/index.ts ${id} ${out} --codec=h264`,
    { stdio: "inherit" }
  );
}

console.log("\nAll renders complete.");

import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const fraunces = loadFraunces("normal", {
  weights: ["500", "600", "700"],
});
const dmSans = loadDMSans("normal", {
  weights: ["400", "500", "700"],
});
const jetbrainsMono = loadJetBrainsMono("normal", {
  weights: ["400", "500", "700"],
});

export const fontDisplay = fraunces.fontFamily;
export const fontSans = dmSans.fontFamily;
export const fontMono = jetbrainsMono.fontFamily;

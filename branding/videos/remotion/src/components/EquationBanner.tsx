import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";
import { fontMono } from "./Fonts";

export const EquationBanner: React.FC<{
  text: string;
  startFrame?: number;
  fontSize?: number;
}> = ({ text, startFrame = 0, fontSize = 44 }) => {
  const frame = useCurrentFrame() - startFrame;
  const charsToShow = Math.max(
    0,
    Math.floor(interpolate(frame, [0, text.length * 1.6], [0, text.length], {
      extrapolateRight: "clamp",
      extrapolateLeft: "clamp",
    }))
  );
  const visible = text.slice(0, charsToShow);
  const caretOpacity = frame < text.length * 1.6 ? (Math.floor(frame / 8) % 2 === 0 ? 1 : 0) : 0;

  return (
    <div
      style={{
        fontFamily: fontMono,
        fontSize,
        fontWeight: 600,
        color: colors.foam,
        background: colors.ink,
        padding: "22px 40px",
        borderRadius: 14,
        display: "inline-flex",
        alignItems: "center",
        letterSpacing: 0.5,
        boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
      }}
    >
      {visible}
      <span style={{ opacity: caretOpacity, color: colors.glass }}>|</span>
    </div>
  );
};

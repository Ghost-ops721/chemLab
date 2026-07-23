import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { colors } from "../theme";
import { fontSans } from "./Fonts";

export const LogoReveal: React.FC<{
  startFrame?: number;
  tagline?: string;
  width?: number;
  logoSrc?: string;
  taglineFontSize?: number;
}> = ({
  startFrame = 0,
  tagline,
  width = 560,
  logoSrc = "logo-lockup.png",
  taglineFontSize = 26,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const scale = spring({
    frame: local,
    fps,
    config: { damping: 14, mass: 0.6 },
  });
  const opacity = Math.min(1, Math.max(0, local / 12));
  const taglineOpacity = Math.min(1, Math.max(0, (local - 14) / 14));
  const taglineY = 20 - Math.min(1, Math.max(0, (local - 14) / 14)) * 20;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        opacity,
        transform: `scale(${0.7 + scale * 0.3})`,
      }}
    >
      <Img src={staticFile(logoSrc)} style={{ width }} />
      {tagline ? (
        <div
          style={{
            fontFamily: fontSans,
            fontSize: taglineFontSize,
            color: colors.muted,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: 0.3,
            textAlign: "center",
            maxWidth: width + 40,
            padding: "0 24px",
          }}
        >
          {tagline}
        </div>
      ) : null}
    </div>
  );
};

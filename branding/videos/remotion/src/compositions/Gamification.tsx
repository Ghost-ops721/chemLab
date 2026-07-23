import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontSans } from "../components/Fonts";
import { DeskBackground } from "../components/DeskBackground";
import { Bubbles } from "../components/Bubbles";
import { LogoReveal } from "../components/LogoReveal";

const XPBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barProgress = interpolate(frame, [10, 70], [0, 0.72], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const xp = Math.round(interpolate(frame, [10, 70], [0, 90], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  }));
  const questOpacity = interpolate(frame, [4, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <DeskBackground>
      <Bubbles rise={300} />
      <AbsoluteFill style={{ padding: 80, justifyContent: "flex-start", gap: 24 }}>
        <div
          style={{
            fontFamily: fontSans,
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: colors.glass,
            opacity: questOpacity,
          }}
        >
          Free-play quest
        </div>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 44,
            fontWeight: 600,
            color: colors.foam,
            opacity: questOpacity,
          }}
        >
          Try to produce a gas
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 20 }}>
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: 40,
              fontWeight: 700,
              color: colors.amber,
            }}
          >
            LV 1
          </div>
          <div
            style={{
              width: 480,
              height: 16,
              borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${barProgress * 100}%`,
                height: "100%",
                background: colors.teal,
                borderRadius: 8,
              }}
            />
          </div>
          <div style={{ fontFamily: fontSans, fontSize: 28, color: colors.foam }}>
            {xp} XP
          </div>
        </div>
      </AbsoluteFill>
    </DeskBackground>
  );
};

const RewardBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
  const cardOpacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: colors.wash, alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          background: colors.panel,
          borderRadius: 28,
          padding: "54px 70px",
          textAlign: "center",
          opacity: cardOpacity,
          transform: `scale(${0.7 + cardScale * 0.3})`,
          boxShadow: "0 40px 90px rgba(20,36,31,0.25)",
        }}
      >
        <div
          style={{
            fontFamily: fontSans,
            fontSize: 20,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: colors.teal,
            marginBottom: 14,
          }}
        >
          First Discovery
        </div>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 56,
            fontWeight: 600,
            color: colors.ink,
          }}
        >
          First Precipitate
        </div>
        <div
          style={{
            fontFamily: fontSans,
            fontSize: 24,
            color: colors.muted,
            marginTop: 14,
          }}
        >
          +25 XP earned
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Gamification: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={220}>
        <XPBeat />
      </Sequence>
      <Sequence from={220} durationInFrames={220}>
        <RewardBeat />
      </Sequence>
      <Sequence from={440} durationInFrames={160}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${colors.panel}, ${colors.wash} 75%)`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoReveal tagline="Earn every discovery." width={600} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

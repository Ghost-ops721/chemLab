import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontSans } from "../components/Fonts";
import { InkBackground } from "../components/DeskBackground";
import { Bubbles } from "../components/Bubbles";
import { EquationBanner } from "../components/EquationBanner";
import { LogoReveal } from "../components/LogoReveal";

const EquationBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const kicker = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  return (
    <InkBackground>
      <Bubbles rise={520} color={colors.glass} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 34,
        }}
      >
        <div
          style={{
            fontFamily: fontSans,
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: colors.glass,
            opacity: kicker,
          }}
        >
          Acid meets base
        </div>
        <EquationBanner text="HCl + NaOH → NaCl + H2O" fontSize={52} />
      </AbsoluteFill>
    </InkBackground>
  );
};

const ExplainBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 18], [16, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        background: colors.wash,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 26,
        padding: 120,
      }}
    >
      <div
        style={{
          fontFamily: fontDisplay,
          fontWeight: 600,
          fontSize: 52,
          color: colors.ink,
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        What happened
      </div>
      <div
        style={{
          fontFamily: fontSans,
          fontSize: 28,
          color: colors.muted,
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.5,
        }}
      >
        An acid and a base reacted to form a salt and water — the H+ from the
        acid combined with OH- from the base to make H2O. Plain-language
        chemistry, explained the moment it happens.
      </div>
    </AbsoluteFill>
  );
};

export const ReactionMoment: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={180}>
        <EquationBeat />
      </Sequence>
      <Sequence from={180} durationInFrames={200}>
        <ExplainBeat />
      </Sequence>
      <Sequence from={380} durationInFrames={160}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${colors.panel}, ${colors.wash} 75%)`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoReveal tagline="Real reactions. Zero safety goggles." width={600} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

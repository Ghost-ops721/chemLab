import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontSans } from "../components/Fonts";
import { WashBackground } from "../components/DeskBackground";
import { ScreenshotPan } from "../components/ScreenshotPan";
import { LogoReveal } from "../components/LogoReveal";

const TAGLINES = [
  "Chemistry you can actually touch.",
  "Real reactions. Zero safety goggles.",
  "Pour it. Stir it. See it react.",
];

const TaglineCycle: React.FC = () => {
  const frame = useCurrentFrame();
  const per = 60;
  const index = Math.min(TAGLINES.length - 1, Math.floor(frame / per));
  const local = frame - index * per;
  const opacity = interpolate(local, [0, 12, per - 14, per], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <WashBackground>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "180px 56px",
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 600,
            fontSize: 58,
            lineHeight: 1.15,
            color: colors.ink,
            opacity,
            maxWidth: 920,
            textAlign: "center",
          }}
        >
          {TAGLINES[index]}
        </div>
      </AbsoluteFill>
    </WashBackground>
  );
};

const BrandCardBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 13, mass: 0.6 } });
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: colors.wash }}>
      <AbsoluteFill style={{ padding: 0, opacity: 0.45 }}>
        <ScreenshotPan
          src={staticFile("02-signup-modal.png")}
          durationInFrames={150}
          zoomFrom={1.2}
          zoomTo={1.35}
          panY={-40}
          borderRadius={0}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "160px 48px",
        }}
      >
        <div
          style={{
            background: colors.panel,
            borderRadius: 28,
            padding: "48px 40px",
            width: "100%",
            maxWidth: 860,
            opacity,
            transform: `scale(${0.75 + scale * 0.25})`,
            boxShadow: "0 40px 90px rgba(20,36,31,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 22,
            }}
          >
            <Img
              src={staticFile("logo-abstract-mark.png")}
              style={{ width: 72, height: 72, objectFit: "contain" }}
            />
            <div
              style={{
                fontFamily: fontSans,
                fontSize: 18,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: colors.teal,
              }}
            >
              Chem Lab
            </div>
          </div>
          <div
            style={{
              fontFamily: fontDisplay,
              fontSize: 48,
              fontWeight: 700,
              color: colors.ink,
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            Save your discoveries
          </div>
          <div
            style={{
              fontFamily: fontSans,
              fontSize: 26,
              color: colors.muted,
              marginBottom: 36,
              lineHeight: 1.4,
            }}
          >
            Sign up to mix, react, and earn XP — free.
          </div>
          <div
            style={{
              background: colors.teal,
              color: colors.foam,
              fontFamily: fontSans,
              fontWeight: 700,
              fontSize: 28,
              textAlign: "center",
              padding: "22px 0",
              borderRadius: 14,
            }}
          >
            Sign up free
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SignupCTA: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={180}>
        <TaglineCycle />
      </Sequence>
      <Sequence from={180} durationInFrames={150}>
        <BrandCardBeat />
      </Sequence>
      <Sequence from={330} durationInFrames={150}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 35%, ${colors.panel}, ${colors.wash} 70%)`,
            alignItems: "center",
            justifyContent: "center",
            padding: "160px 48px",
          }}
        >
          <LogoReveal
            logoSrc="logo-abstract-mark.png"
            tagline="Start your first reaction today."
            width={520}
            taglineFontSize={30}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

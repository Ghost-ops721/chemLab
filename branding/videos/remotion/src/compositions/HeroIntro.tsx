import React from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontSans } from "../components/Fonts";
import { DeskBackground } from "../components/DeskBackground";
import { Bubbles } from "../components/Bubbles";
import { ScreenshotPan } from "../components/ScreenshotPan";
import { LogoReveal } from "../components/LogoReveal";

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [0, 20], [24, 0], {
    extrapolateRight: "clamp",
  });
  const subOpacity = interpolate(frame, [16, 36], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <DeskBackground>
      <Bubbles bottom={0} rise={620} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontWeight: 600,
            fontSize: 108,
            color: colors.foam,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            letterSpacing: -1,
          }}
        >
          Chem Lab
        </div>
        <div
          style={{
            fontFamily: fontSans,
            fontSize: 32,
            color: colors.glass,
            opacity: subOpacity,
            maxWidth: 900,
            textAlign: "center",
          }}
        >
          Pour, stir, heat, shake — the desk reacts to every move.
        </div>
      </AbsoluteFill>
    </DeskBackground>
  );
};

const ScreenshotBeat: React.FC<{ src: string; caption: string }> = ({
  src,
  caption,
}) => {
  const frame = useCurrentFrame();
  const captionOpacity = interpolate(frame, [10, 26], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: colors.wash }}>
      <AbsoluteFill style={{ padding: 60 }}>
        <ScreenshotPan
          src={src}
          durationInFrames={210}
          zoomFrom={1.02}
          zoomTo={1.14}
          panY={-30}
          borderRadius={22}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ alignItems: "flex-start", justifyContent: "flex-end", padding: 70 }}
      >
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 46,
            fontWeight: 600,
            color: colors.ink,
            background: "rgba(242,247,244,0.92)",
            padding: "18px 30px",
            borderRadius: 16,
            opacity: captionOpacity,
            maxWidth: 820,
            boxShadow: "0 20px 40px rgba(20,36,31,0.18)",
          }}
        >
          {caption}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${colors.panel}, ${colors.wash} 75%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LogoReveal tagline="The desk reacts to every move." width={620} />
    </AbsoluteFill>
  );
};

export const HeroIntro: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={90}>
        <TitleCard />
      </Sequence>
      <Sequence from={90} durationInFrames={210}>
        <ScreenshotBeat
          src={staticFile("01-desk-hero.png")}
          caption="Real chemistry you can touch."
        />
      </Sequence>
      <Sequence from={300} durationInFrames={150}>
        <ScreenshotBeat
          src={staticFile("03-reaction-equation.png")}
          caption="Every reaction, balanced and explained."
        />
      </Sequence>
      <Sequence from={450} durationInFrames={150}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};

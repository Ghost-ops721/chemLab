import React from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontSans, fontMono } from "../components/Fonts";
import { DeskBackground } from "../components/DeskBackground";
import { Bubbles } from "../components/Bubbles";
import { Vessel } from "../components/Vessel";
import { ScreenshotPan } from "../components/ScreenshotPan";
import { LogoReveal } from "../components/LogoReveal";

const StepLabel: React.FC<{ n: number; text: string }> = ({ n, text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const x = interpolate(frame, [0, 14], [-20, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: colors.teal,
          color: colors.foam,
          fontFamily: fontSans,
          fontWeight: 700,
          fontSize: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </div>
      <div style={{ fontFamily: fontSans, fontSize: 30, color: colors.foam }}>
        {text}
      </div>
    </div>
  );
};

const StepOne: React.FC = () => {
  const frame = useCurrentFrame();
  const vesselY = interpolate(frame, [0, 20], [-40, 0], {
    extrapolateRight: "clamp",
  });
  const vesselOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <DeskBackground>
      <AbsoluteFill style={{ padding: 70, justifyContent: "flex-start" }}>
        <StepLabel n={1} text="Place a beaker on the desk" />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            opacity: vesselOpacity,
            transform: `translateY(${vesselY}px)`,
          }}
        >
          <Vessel width={260} fillLevel={0} />
        </div>
      </AbsoluteFill>
    </DeskBackground>
  );
};

const StepTwo: React.FC = () => {
  const frame = useCurrentFrame();
  const fillLevel = interpolate(frame, [10, 60], [0, 0.6], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <DeskBackground>
      <Bubbles rise={340} />
      <AbsoluteFill style={{ padding: 70, justifyContent: "flex-start" }}>
        <StepLabel n={2} text="Drop reactants in — watch the stream" />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Vessel width={260} fillLevel={fillLevel} fillColor={colors.glass} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 90 }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 30,
            color: colors.foam,
            opacity: labelOpacity,
            background: "rgba(20,36,31,0.55)",
            padding: "10px 22px",
            borderRadius: 10,
          }}
        >
          HCl + NaOH
        </div>
      </AbsoluteFill>
    </DeskBackground>
  );
};

const StepThree: React.FC = () => {
  const frame = useCurrentFrame();
  const wobble = frame > 6 && frame < 46;
  const color = interpolate(frame, [46, 70], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });
  const fillColor = color > 0.5 ? colors.foam : colors.glass;
  const labelOpacity = interpolate(frame, [54, 74], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <DeskBackground>
      <Bubbles rise={360} />
      <AbsoluteFill style={{ padding: 70, justifyContent: "flex-start" }}>
        <StepLabel n={3} text="Stir · Heat · Shake · Mix" />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <Vessel width={260} fillLevel={0.6} fillColor={fillColor} wobble={wobble} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 90 }}
      >
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 34,
            fontWeight: 600,
            color: colors.foam,
            opacity: labelOpacity,
            background: colors.ink,
            padding: "14px 26px",
            borderRadius: 12,
          }}
        >
          HCl + NaOH → NaCl + H2O
        </div>
      </AbsoluteFill>
    </DeskBackground>
  );
};

const ProofBeat: React.FC = () => {
  const frame = useCurrentFrame();
  const captionOpacity = interpolate(frame, [10, 26], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: colors.wash }}>
      <AbsoluteFill style={{ padding: 60 }}>
        <ScreenshotPan
          src={staticFile("03-reaction-equation.png")}
          durationInFrames={150}
          zoomFrom={1.0}
          zoomTo={1.1}
          borderRadius={22}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "flex-start", padding: 70 }}>
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 44,
            fontWeight: 600,
            color: colors.ink,
            background: "rgba(242,247,244,0.92)",
            padding: "16px 26px",
            borderRadius: 16,
            opacity: captionOpacity,
            maxWidth: 760,
          }}
        >
          A real balanced equation — every time.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const FeatureDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={80}>
        <StepOne />
      </Sequence>
      <Sequence from={80} durationInFrames={100}>
        <StepTwo />
      </Sequence>
      <Sequence from={180} durationInFrames={110}>
        <StepThree />
      </Sequence>
      <Sequence from={290} durationInFrames={150}>
        <ProofBeat />
      </Sequence>
      <Sequence from={440} durationInFrames={160}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${colors.panel}, ${colors.wash} 75%)`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LogoReveal tagline="Pour it. Stir it. See it react." width={600} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

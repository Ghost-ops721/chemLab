import React from "react";
import { AbsoluteFill } from "remotion";
import { colors } from "../theme";

export const DeskBackground: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 18% 8%, rgba(255,240,210,0.14), transparent 42%),
          radial-gradient(ellipse at 85% 95%, rgba(0,0,0,0.32), transparent 55%),
          linear-gradient(165deg, ${colors.deskLight} 0%, ${colors.desk} 42%, ${colors.deskDark} 100%)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const WashBackground: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 70% 15%, ${colors.panel}, ${colors.wash} 70%)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const InkBackground: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 0%, #1c332c, ${colors.ink} 65%)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

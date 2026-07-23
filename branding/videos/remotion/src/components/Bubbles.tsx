import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { colors } from "../theme";

type BubbleSpec = {
  x: number;
  delay: number;
  duration: number;
  size: number;
  color?: string;
};

const DEFAULT_BUBBLES: BubbleSpec[] = [
  { x: 12, delay: 0, duration: 46, size: 10 },
  { x: 28, delay: 10, duration: 52, size: 7 },
  { x: 46, delay: 4, duration: 40, size: 12 },
  { x: 62, delay: 18, duration: 48, size: 8 },
  { x: 78, delay: 8, duration: 44, size: 9 },
  { x: 90, delay: 24, duration: 50, size: 6 },
  { x: 20, delay: 30, duration: 42, size: 8 },
  { x: 55, delay: 36, duration: 46, size: 11 },
];

export const Bubbles: React.FC<{
  bubbles?: BubbleSpec[];
  bottom?: number;
  rise?: number;
  color?: string;
}> = ({ bubbles = DEFAULT_BUBBLES, bottom = 0, rise = 420, color }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {bubbles.map((b, i) => {
        const local = ((frame - b.delay) % b.duration + b.duration) % b.duration;
        const progress = local / b.duration;
        const y = interpolate(progress, [0, 1], [0, -rise]);
        const opacity = interpolate(
          progress,
          [0, 0.08, 0.85, 1],
          [0, 0.85, 0.5, 0]
        );
        const scale = interpolate(progress, [0, 1], [1, 0.5]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              bottom,
              width: b.size,
              height: b.size,
              borderRadius: "50%",
              background: color ?? colors.foam,
              opacity,
              transform: `translateY(${y}px) scale(${scale})`,
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
            }}
          />
        );
      })}
    </>
  );
};

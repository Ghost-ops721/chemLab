import React from "react";
import { Img, useCurrentFrame, interpolate } from "remotion";

export const ScreenshotPan: React.FC<{
  src: string;
  durationInFrames: number;
  zoomFrom?: number;
  zoomTo?: number;
  panX?: number;
  panY?: number;
  borderRadius?: number;
}> = ({
  src,
  durationInFrames,
  zoomFrom = 1.0,
  zoomTo = 1.12,
  panX = 0,
  panY = 0,
  borderRadius = 0,
}) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [zoomFrom, zoomTo], {
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, [0, durationInFrames], [0, panX], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, durationInFrames], [0, panY], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius,
        boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
      }}
    >
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        }}
      />
    </div>
  );
};

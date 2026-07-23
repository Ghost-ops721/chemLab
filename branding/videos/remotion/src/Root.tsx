import React from "react";
import { Composition } from "remotion";
import { HeroIntro } from "./compositions/HeroIntro";
import { FeatureDemo } from "./compositions/FeatureDemo";
import { ReactionMoment } from "./compositions/ReactionMoment";
import { Gamification } from "./compositions/Gamification";
import { SignupCTA } from "./compositions/SignupCTA";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="01-HeroIntro"
        component={HeroIntro}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="02-FeatureDemo"
        component={FeatureDemo}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="03-ReactionMoment"
        component={ReactionMoment}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="04-Gamification"
        component={Gamification}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="05-SignupCTA"
        component={SignupCTA}
        durationInFrames={480}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

import { useMemo } from "react";
import { BeatmapEntry, Platform, PlatformGenerator, PlatformType } from "../../engine/PlatformGenerator";

const PLATFORM_COLORS: Record<PlatformType, string> = {
  [PlatformType.GROUND]: "#4a2080",
  [PlatformType.GAP]:    "#1a0533",
  [PlatformType.THE_ONE]: "#e040fb",
};

const PLATFORM_EMISSIVE: Record<PlatformType, string> = {
  [PlatformType.GROUND]: "#2a1050",
  [PlatformType.GAP]:    "#000000",
  [PlatformType.THE_ONE]: "#c020d0",
};

interface Props {
  beatmap: BeatmapEntry[];
}

export function Platforms({ beatmap }: Props) {
  const platforms = useMemo(() => {
    const gen = PlatformGenerator.create({ beatmap });
    return gen.generate();
  }, [beatmap]);

  return (
    <group>
      {platforms
        .filter((p: Platform) => p.type !== PlatformType.GAP)
        .map((p: Platform) => (
          <mesh
            key={`${p.beatNumber}-${p.type}`}
            position={[p.x, p.y, 0]}
          >
            <boxGeometry args={[p.width, p.height, 1.5]} />
            <meshStandardMaterial
              color={PLATFORM_COLORS[p.type]}
              emissive={PLATFORM_EMISSIVE[p.type]}
              emissiveIntensity={p.type === PlatformType.THE_ONE ? 0.8 : 0.2}
            />
          </mesh>
        ))}
    </group>
  );
}

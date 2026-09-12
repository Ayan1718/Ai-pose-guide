/**
 * Dynamic Doodle / Outline Generator
 * Ref: PoseFit_Dynamic_Doodle_Skia_Prompt.pdf
 *
 * Renders a hand-drawn, sketch-style skeleton on a Skia canvas — used both for
 * the semi-transparent target-pose guide and the color-coded live user skeleton.
 * Purely visual: receives screen-space points + colors, does no calculation.
 */

import React from 'react';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { ScreenPoint, SKELETON_CONNECTIONS } from '../modules/poseOverlayMath';

type Props = {
  points: Record<string, ScreenPoint>;
  colorFor?: (jointA: string, jointB: string) => string; // per-segment color, defaults to white guide
  opacity?: number;
  strokeWidth?: number;
};

/** Step 2-3: build a slightly-curved "doodle" path between two points instead of a straight line */
function buildDoodleSegmentPath(a: ScreenPoint, b: ScreenPoint) {
  const path = Skia.Path.Make();
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  // small perpendicular offset for an organic, hand-drawn curve
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = Math.min(6, len * 0.08);
  const perpX = (-dy / len) * offset;
  const perpY = (dx / len) * offset;

  path.moveTo(a.x, a.y);
  path.cubicTo(midX + perpX, midY + perpY, midX + perpX, midY + perpY, b.x, b.y);
  return path;
}

export default function DoodleSkeleton({ points, colorFor, opacity = 0.55, strokeWidth = 5 }: Props) {
  return (
    <Canvas style={{ flex: 1 }}>
      <Group opacity={opacity}>
        {SKELETON_CONNECTIONS.map(([jointA, jointB]) => {
          const a = points[jointA];
          const b = points[jointB];
          if (!a || !b) return null;
          const path = buildDoodleSegmentPath(a, b);
          const color = colorFor ? colorFor(jointA, jointB) : '#ffffff';
          return (
            <Path
              key={`${jointA}-${jointB}`}
              path={path}
              color={color}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          );
        })}
      </Group>
    </Canvas>
  );
}

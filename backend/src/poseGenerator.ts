/**
 * Pose Generator (Backend)
 * Ref: PoseFit_Backend_SceneAnalyzer_PoseGenerator_Prompt.pdf — Module 2
 *
 * Fetches matching pose templates from the local library for the given
 * ranked pose categories. The AI-generation fallback (Hugging Face/ControlNet)
 * is intentionally left as a TODO — the default path should always be the
 * free local library.
 */

import fs from 'fs';
import path from 'path';

type PoseTemplate = {
  id: string;
  name: string;
  category: string;
  keypointAngles: Record<string, number>;
};

let poseLibraryCache: PoseTemplate[] | null = null;

function loadLibrary(): PoseTemplate[] {
  if (poseLibraryCache) return poseLibraryCache;
  const libraryPath = path.join(__dirname, '../../src/assets/poses/poseLibrary.json');
  const raw = fs.readFileSync(libraryPath, 'utf-8');
  poseLibraryCache = JSON.parse(raw);
  return poseLibraryCache!;
}

export function getPosesForCategories(categories: string[], limit = 8): PoseTemplate[] {
  const library = loadLibrary();
  const matches = library.filter((p) => categories.includes(p.category));

  if (matches.length > 0) return matches.slice(0, limit);

  // TODO (optional, advanced): if no template matches, fall back to an AI
  // image generation API (Hugging Face/Replicate + ControlNet) to generate a
  // new pose outline. Not implemented in this prototype — keep the free
  // local-library path as the default.
  return library.slice(0, limit);
}

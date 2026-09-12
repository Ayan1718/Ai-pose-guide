/**
 * Scene Analyzer (Backend)
 * Ref: PoseFit_Backend_SceneAnalyzer_PoseGenerator_Prompt.pdf — Module 1
 *
 * Calls Google Cloud Vision API to detect scene attributes, maps the raw
 * response into a simplified internal category label, and caches results
 * by a simple image-content hash to avoid repeat API calls.
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

type CacheEntry = { category: string; confidence: number };
const cache = new Map<string, CacheEntry>();

function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Step 3: map raw Vision API labels into a simplified internal category.
 * This is intentionally simple — expand this mapping table as you add more
 * pose categories to the library.
 */
function mapLabelsToCategory(labels: string[]): string {
  const lower = labels.map((l) => l.toLowerCase());

  const has = (...keywords: string[]) => keywords.some((k) => lower.some((l) => l.includes(k)));

  if (has('beach', 'sea', 'ocean', 'sand', 'coast')) return 'beach-sunset';
  if (has('building', 'skyline', 'rooftop', 'city', 'skyscraper')) return 'rooftop-daylight';
  if (has('room', 'indoor', 'furniture', 'wall', 'interior')) return 'indoor-plain';
  if (has('tree', 'park', 'garden', 'nature', 'forest')) return 'outdoor-nature';
  if (has('street', 'road', 'sidewalk')) return 'street-urban';

  return 'general-outdoor'; // fallback category
}

export async function analyzeSceneImage(imageBuffer: Buffer): Promise<CacheEntry> {
  const hash = hashBuffer(imageBuffer);

  // Step 4: cache by image hash
  const cached = cache.get(hash);
  if (cached) return cached;

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    // No key configured yet — return a safe fallback so the rest of the app
    // pipeline is still testable end-to-end.
    const fallback = { category: 'general-outdoor', confidence: 0.3 };
    cache.set(hash, fallback);
    return fallback;
  }

  const base64Image = imageBuffer.toString('base64');
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'LABEL_DETECTION', maxResults: 10 }],
          },
        ],
      }),
    }
  );

  const data: any = await response.json();
  const labels: string[] =
    data.responses?.[0]?.labelAnnotations?.map((a: any) => a.description) ?? [];
  const topConfidence: number = data.responses?.[0]?.labelAnnotations?.[0]?.score ?? 0.5;

  const category = mapLabelsToCategory(labels);
  const result = { category, confidence: topConfidence };

  cache.set(hash, result);
  return result;
}

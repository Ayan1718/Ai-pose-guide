/**
 * AI Scene Selector (Backend)
 * Ref: PoseFit_AI_Scene_Selector_Prompt.pdf
 *
 * Rule-based mapping from scene category to ranked pose categories. Kept as
 * a simple config object so it's easy to expand without touching logic code.
 * (Step 4, optional AI-assisted ranking, is intentionally NOT implemented
 * here yet — add it later only if this rule-based version proves insufficient.)
 */

const SCENE_TO_POSE_CATEGORIES: Record<string, string[]> = {
  'rooftop-daylight': ['rooftop-daylight', 'diagonal-arm', 'full-body-standing'],
  'beach-sunset': ['beach-sunset', 'full-body-jump', 'walking-candid'],
  'indoor-plain': ['indoor-plain', 'sitting-casual', 'half-body-expressive'],
  'outdoor-nature': ['outdoor-nature', 'full-body-standing', 'walking-candid'],
  'street-urban': ['street-urban', 'walking-candid', 'diagonal-arm'],
  'general-outdoor': ['full-body-standing', 'diagonal-arm'],
};

export function selectPoseCategories(sceneCategory: string): string[] {
  return SCENE_TO_POSE_CATEGORIES[sceneCategory] ?? SCENE_TO_POSE_CATEGORIES['general-outdoor'];
}

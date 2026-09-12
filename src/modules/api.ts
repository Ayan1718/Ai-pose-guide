/**
 * Backend API calls
 * Ref: PoseFit_Backend_SceneAnalyzer_PoseGenerator_Prompt.pdf
 */

const BASE_URL = 'http://localhost:4000'; // point this at your deployed backend later

export type SceneAnalysisResult = {
  category: string;
  confidence: number;
};

export async function analyzeScene(imageUri: string): Promise<SceneAnalysisResult> {
  const formData = new FormData();
  formData.append('image', { uri: imageUri, name: 'background.jpg', type: 'image/jpeg' } as any);

  const res = await fetch(`${BASE_URL}/analyze-scene`, {
    method: 'POST',
    body: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!res.ok) throw new Error('Scene analysis failed');
  return res.json();
}

export async function suggestPoses(category: string) {
  const res = await fetch(`${BASE_URL}/suggest-poses?category=${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error('Pose suggestion failed');
  return res.json();
}

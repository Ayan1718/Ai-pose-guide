/**
 * PoseFit Backend Server
 * Ref: PoseFit_Backend_SceneAnalyzer_PoseGenerator_Prompt.pdf,
 *      PoseFit_AI_Scene_Selector_Prompt.pdf
 *
 * Two endpoints:
 *   POST /analyze-scene       -> Scene Analyzer
 *   GET  /suggest-poses       -> AI Scene Selector + Pose Generator
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';

import { analyzeSceneImage } from './sceneAnalyzer';
import { selectPoseCategories } from './sceneSelector';
import { getPosesForCategories } from './poseGenerator';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.post('/analyze-scene', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const result = await analyzeSceneImage(req.file.buffer);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scene analysis failed' });
  }
});

app.get('/suggest-poses', (req, res) => {
  const category = String(req.query.category || 'general-outdoor');
  const rankedCategories = selectPoseCategories(category);
  const poses = getPosesForCategories(rankedCategories);
  res.json({ category, rankedCategories, poses });
});

app.listen(PORT, () => {
  console.log(`PoseFit backend running on http://localhost:${PORT}`);
});

# PoseFit — Complete Prototype Codebase

Ye ek starting-point codebase hai jo humare saare prompts (Architecture, Backend,
Camera, Kinematics Engine, AR Overlay/Skia, Capture Logic, Voice/TTS) ko ek jagah
combine karta hai. Isko as-is run karne se pehle dependencies install karni padengi
aur API keys daalni padengi — is README mein sab steps hain.

## Folder Structure

```
posefit-app/
├── App.tsx                      # Entry point, navigation setup
├── package.json                 # React Native dependencies
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx           # Background upload/capture
│   │   ├── PoseGalleryScreen.tsx    # Suggested poses list
│   │   ├── CameraScreen.tsx         # Live camera + AR overlay + matching
│   │   └── ResultScreen.tsx         # Save / Retake / Share
│   ├── modules/
│   │   ├── kinematicsEngine.ts      # Angle calculation + match % logic
│   │   ├── poseOverlayMath.ts       # Coordinate transform, mirroring, smoothing
│   │   ├── captureLogic.ts          # Threshold detection, countdown, capture
│   │   ├── audioDirector.ts         # TTS voice coaching, debounced
│   │   └── api.ts                   # Calls to backend (scene analysis, poses)
│   ├── components/
│   │   └── DoodleSkeleton.tsx       # Skia canvas doodle-style overlay renderer
│   └── assets/poses/
│       └── poseLibrary.json         # Pre-built pose templates (sample data)
└── backend/
    ├── package.json
    └── src/
        ├── server.ts                # Express app entry
        ├── sceneAnalyzer.ts         # Calls Google Vision API, caches result
        ├── sceneSelector.ts         # Rule-based scene -> pose category mapping
        └── poseGenerator.ts         # Fetches matching templates from library
```

## Setup Steps

1. **Frontend (React Native)**
   ```
   cd posefit-app
   npm install
   npx pod-install ios   # iOS only
   ```
   Key dependencies (already in package.json):
   - react-native-vision-camera
   - @shopify/react-native-skia
   - react-native-reanimated
   - react-native-tts
   - react-native-mediapipe (or platform-specific MediaPipe bridge — see note below)

2. **MediaPipe Integration (manual step — not pure npm install)**
   Pose detection needs a native frame-processor plugin for MediaPipe Pose on both
   iOS and Android. This prototype includes a placeholder (`src/modules/poseTracking.ts`)
   that you connect to your native module — follow the detailed steps in
   `PoseFit_Skeleton_Tracking_RN_Prompt.pdf` (from our earlier docs) to wire this up.

3. **Backend**
   ```
   cd backend
   npm install
   cp .env.example .env    # add your GOOGLE_VISION_API_KEY here
   npm run dev
   ```

4. **API Keys needed**
   - `GOOGLE_VISION_API_KEY` — for Scene Analyzer (free tier ~1000 req/month)
   - (Optional) `HUGGINGFACE_API_KEY` — only if you enable the fallback AI pose
     generation path (not required for the core prototype)

## What's Real vs What's Stubbed

- ✅ Full working logic: Kinematics Engine (angle math), Capture Logic (state
  machine), Audio Director (debounce logic), Overlay Math (coordinate transform),
  Scene Selector (rule-based mapping), Pose Generator (library lookup)
- 🔧 Needs your API key: Scene Analyzer (Google Vision call)
- 🔧 Needs native wiring (platform-specific, can't be pure JS): live MediaPipe
  keypoint stream — this prototype has a mock keypoint generator so you can test
  the rest of the pipeline without a real camera first

## Suggested Build Order (matches PoseFit_Master_Roadmap.pdf)

1. Run backend, test `/analyze-scene` and `/suggest-poses` with Postman/curl
2. Run frontend with the mock keypoint stream — verify Kinematics Engine +
   Overlay + Capture Logic work end-to-end without a real camera
3. Swap the mock keypoint stream for the real MediaPipe native bridge
4. Add Voice coaching, test on a real device
5. Polish UI, test on low-end + high-end phones

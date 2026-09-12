/**
 * Camera Screen — Steps 6-11 of the app flow.
 * Ref: PoseFit_Camera_AR_UI_Prompt.pdf
 *
 * Integrates: Local Camera & Pose (mocked for now) -> Kinematics Engine ->
 * AR Overlay Math -> Doodle Skeleton (Skia) -> Capture Logic -> Audio Director.
 * This is the file to swap the mock keypoint stream for a real one once the
 * native MediaPipe bridge is wired up (see PoseFit_Skeleton_Tracking_RN_Prompt.pdf).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import { useMockPoseStream } from '../modules/poseTracking';
import { calculateMatch, resetSmoothing, MatchResult } from '../modules/kinematicsEngine';
import { transformKeypoints, colorForScore, ScreenPoint } from '../modules/poseOverlayMath';
import { CaptureController, CaptureState } from '../modules/captureLogic';
import { AudioDirector } from '../modules/audioDirector';
import DoodleSkeleton from '../components/DoodleSkeleton';

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function CameraScreen({ route, navigation }: Props) {
  const { pose } = route.params;

  // --- Local Camera & Pose (mocked — replace with real MediaPipe stream later) ---
  const liveKeypoints = useMockPoseStream(20);

  // --- Kinematics Engine ---
  const [match, setMatch] = useState<MatchResult>({
    overallMatchPercentage: 0,
    perJointScores: {},
    worstJointName: null,
    isMatched: false,
  });

  useEffect(() => {
    resetSmoothing();
  }, [pose.id]);

  useEffect(() => {
    if (Object.keys(liveKeypoints).length === 0) return;
    const result = calculateMatch(liveKeypoints, pose.keypointAngles);
    setMatch(result);
  }, [liveKeypoints, pose]);

  // --- AR Overlay Math ---
  const transformConfig = {
    screenWidth: SCREEN_W,
    screenHeight: SCREEN_H,
    cameraPreviewWidth: SCREEN_W,
    cameraPreviewHeight: SCREEN_H,
    isFrontCamera: true,
  };
  const liveScreenPoints: Record<string, ScreenPoint> = useMemo(
    () => transformKeypoints(liveKeypoints, transformConfig),
    [liveKeypoints]
  );

  // --- Capture Logic ---
  const [captureState, setCaptureState] = useState<CaptureState>({ status: 'tracking' });
  const captureControllerRef = useRef<CaptureController | null>(null);
  const audioDirectorRef = useRef<AudioDirector | null>(null);

  if (!captureControllerRef.current) {
    captureControllerRef.current = new CaptureController('manual', () => {
      // TODO: call the real high-res capture function from the camera module
      navigation.navigate('Result', { photoUri: 'file:///mock/captured.jpg' });
    });
  }
  if (!audioDirectorRef.current) {
    audioDirectorRef.current = new AudioDirector(true);
  }

  useEffect(() => {
    const controller = captureControllerRef.current!;
    const unsubscribe = controller.subscribe((state) => {
      setCaptureState(state);
      audioDirectorRef.current?.onCaptureStateChange(state);
    });
    audioDirectorRef.current?.announceStart();
    return unsubscribe;
  }, []);

  useEffect(() => {
    captureControllerRef.current?.onMatchUpdate(match.isMatched);
    audioDirectorRef.current?.onMatchUpdate(match.overallMatchPercentage, match.worstJointName);
  }, [match]);

  return (
    <View style={styles.container}>
      {/* Camera preview placeholder — replace with <Camera> from react-native-vision-camera */}
      <View style={styles.cameraPlaceholder} />

      {/* Target pose guide overlay (semi-transparent, white) */}
      {/* In the real app, target pose points come from pre-transformed static screen coords */}

      {/* Live user skeleton, color-coded by match score */}
      <DoodleSkeleton
        points={liveScreenPoints}
        colorFor={() => colorForScore(match.overallMatchPercentage)}
      />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.topBarText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.matchText}>{match.overallMatchPercentage}%</Text>
      </View>

      <View style={styles.guidanceBar}>
        <Text style={styles.guidanceText}>
          {match.worstJointName ? `Adjust: ${match.worstJointName.replace('_', ' ')}` : 'Get into position'}
        </Text>
      </View>

      <View style={styles.bottomBar}>
        {captureState.status === 'countdown' && (
          <Text style={styles.countdownText}>{captureState.secondsLeft}</Text>
        )}
        <TouchableOpacity
          style={[
            styles.captureButton,
            captureState.status !== 'ready_to_capture' && styles.captureButtonDisabled,
          ]}
          disabled={captureState.status !== 'ready_to_capture'}
          onPress={() => captureControllerRef.current?.capture()}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#222' },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarText: { color: '#fff', fontSize: 16 },
  matchText: { color: '#3ddc73', fontSize: 20, fontWeight: '700' },
  guidanceBar: { position: 'absolute', bottom: 140, left: 0, right: 0, alignItems: 'center' },
  guidanceText: { color: '#fff', fontSize: 14, backgroundColor: '#00000088', padding: 8, borderRadius: 8 },
  bottomBar: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  countdownText: { color: '#fff', fontSize: 48, fontWeight: '700', marginBottom: 12 },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: { borderColor: '#666' },
  captureButtonInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
});

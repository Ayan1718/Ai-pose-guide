import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import PoseGalleryScreen from './src/screens/PoseGalleryScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultScreen from './src/screens/ResultScreen';

export type RootStackParamList = {
  Home: undefined;
  PoseGallery: { backgroundImageUri: string; sceneCategory: string };
  Camera: { pose: PoseTemplate };
  Result: { photoUri: string };
};

export type PoseTemplate = {
  id: string;
  name: string;
  category: string;
  keypointAngles: Record<string, number>;
  skeletonAssetPath: string;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PoseGallery" component={PoseGalleryScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Home Screen — Step 1 of the app flow.
 * User picks/captures a background photo, we send it to the backend Scene
 * Analyzer, then navigate to the Pose Gallery with the detected category.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { analyzeScene } from '../modules/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Placeholder — wire up react-native-image-picker or the camera here
  const pickImage = async () => {
    // In the real app: launch image picker, set the returned uri
    const mockUri = 'file:///mock/background.jpg';
    setImageUri(mockUri);
  };

  const continueToGallery = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const result = await analyzeScene(imageUri);
      navigation.navigate('PoseGallery', {
        backgroundImageUri: imageUri,
        sceneCategory: result.category,
      });
    } catch (e) {
      Alert.alert('Scene analysis failed', 'Backend na chal raha ho toh pehle use start karo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PoseFit</Text>
      <Text style={styles.subtitle}>Apna background photo choose karo</Text>

      <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <Text style={styles.uploadText}>+ Photo Upload / Capture</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !imageUri && styles.buttonDisabled]}
        onPress={continueToGallery}
        disabled={!imageUri || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '700', color: '#1a3c6e', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  uploadBox: {
    height: 260,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1a3c6e',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  uploadText: { color: '#1a3c6e', fontSize: 16 },
  preview: { width: '100%', height: '100%' },
  button: { backgroundColor: '#1a3c6e', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

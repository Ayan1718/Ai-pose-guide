/**
 * Pose Gallery Screen — Steps 3-5 of the app flow.
 * Shows poses matching the detected scene category (from AI Scene Selector +
 * Pose Generator on the backend). User taps one to start the live camera flow.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, PoseTemplate } from '../../App';
import { suggestPoses } from '../modules/api';
import poseLibrary from '../assets/poses/poseLibrary.json';

type Props = NativeStackScreenProps<RootStackParamList, 'PoseGallery'>;

export default function PoseGalleryScreen({ route, navigation }: Props) {
  const { sceneCategory } = route.params;
  const [poses, setPoses] = useState<PoseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await suggestPoses(sceneCategory);
        setPoses(result.poses ?? []);
      } catch {
        // Backend not running yet — fall back to local library filtered by category
        const fallback = (poseLibrary as any[]).filter((p) => p.category === sceneCategory);
        setPoses(fallback.length > 0 ? fallback : (poseLibrary as any[]));
      } finally {
        setLoading(false);
      }
    })();
  }, [sceneCategory]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a3c6e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suggested Poses</Text>
      <Text style={styles.subtitle}>Scene: {sceneCategory}</Text>
      <FlatList
        data={poses}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Camera', { pose: item })}>
            <Text style={styles.cardText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a3c6e' },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  card: {
    flex: 1,
    margin: 6,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f2f5fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  cardText: { color: '#1a3c6e', fontWeight: '600', textAlign: 'center' },
});

/**
 * Result Screen — Step 12 of the app flow.
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { photoUri } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Retake</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => {}}>
          <Text style={[styles.buttonText, styles.primaryText]}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => {}}>
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { flex: 1, width: '100%' },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#111',
  },
  button: { padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#fff', minWidth: 90, alignItems: 'center' },
  primary: { backgroundColor: '#fff' },
  buttonText: { color: '#fff', fontWeight: '600' },
  primaryText: { color: '#111' },
});

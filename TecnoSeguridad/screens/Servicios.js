import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Servicios() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Servicios</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
});
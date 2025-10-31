import React from 'react';
import Navigation from './navigation/Navigation';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

export default function App() {
  return (
    // Envuelve el componente de navegación principal con el Provider 
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}

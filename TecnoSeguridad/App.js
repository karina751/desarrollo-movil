import React from 'react';
import Navigation from './navigation/Navigation';
import 'react-native-gesture-handler';
// 🚨 Importar el proveedor de contexto de área segura 🚨
import { SafeAreaProvider } from 'react-native-safe-area-context'; 

export default function App() {
  return (
    // 🚨 Envolver el componente de navegación principal con el Provider 🚨
    <SafeAreaProvider>
      <Navigation />
    </SafeAreaProvider>
  );
}

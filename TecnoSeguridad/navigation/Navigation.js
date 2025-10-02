import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../src/config/firebaseConfig'; 
// Puedes importar un componente para mostrar una pantalla de carga básica
import { View, ActivityIndicator, StyleSheet } from 'react-native'; 

import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Home from '../screens/Home';

const Stack = createStackNavigator();

// Componente simple de carga (opcional, puedes usar null)
const LoadingScreen = () => (
    <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
    </View>
);

function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Nuevo estado de carga

  useEffect(() => {
    // onAuthStateChanged se dispara inmediatamente con el estado actual
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsAuthenticated(true); 
      } else {
        setIsAuthenticated(false); 
      }
      setIsLoading(false); // Una vez que sabemos el estado, desactivamos la carga
    });

    return () => unsubscribe();
  }, []);

  // 1. Mostrar la pantalla de carga si aún no se ha verificado el estado de Firebase
  if (isLoading) {
      return <LoadingScreen />; 
  }

  // 2. Ocultar el header en todas las pantallas con 'screenOptions'
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={{ 
          headerShown: false // Oculta la barra de navegación para TODAS las pantallas
        }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="SignUp" component={SignUp} />
        <Stack.Screen name="Home" component={Home} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Navigation;
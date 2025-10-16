import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../src/config/firebaseConfig'; 
import { View, ActivityIndicator, StyleSheet } from 'react-native'; 
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importaciones de tus pantallas
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Home from '../screens/Home';
import Perfil from '../screens/Perfil';
import Productos from '../screens/Productos';
import Servicios from '../screens/Servicios';
import AdminProductos from '../screens/AdminProductos';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" /> 
        </View>
    );
}

// Contenedor de pestañas inferiores para pantallas autenticadas
function HomeTabs() { // ❌ NOTA: No lleva 'export default'
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Productos') {
                        iconName = 'cube';
                    } else if (route.name === 'Servicios') {
                        iconName = 'wrench';
                    } else if (route.name === 'Perfil') {
                        iconName = 'user';
                    }
                    return <FontAwesome name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Productos" component={Productos} />
            <Tab.Screen name="Servicios" component={Servicios} />
            <Tab.Screen name="Perfil" component={Perfil} />
        </Tab.Navigator>
    );
}

// Navegador principal que gestiona el flujo de autenticación
export default function Navigation() { // ✅ Única exportación por defecto
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    if (isLoading) {
        return <LoadingScreen />; 
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {isAuthenticated ? (
                        <>
                            <Stack.Screen name="HomeTabs" component={HomeTabs} />
                            <Stack.Screen name="AdminProductos" component={AdminProductos} />
                        </>
                    ) : (
                        <>
                            <Stack.Screen name="Login" component={Login} />
                            <Stack.Screen name="SignUp" component={SignUp} />
                        </>
                    )}
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
});
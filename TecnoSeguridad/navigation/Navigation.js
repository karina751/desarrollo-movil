import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Importamos el método para monitorear el estado de autenticación y la instancia de Auth de Firebase.
import { onAuthStateChanged } from 'firebase/auth'; 
import { auth } from '../src/config/firebaseConfig'; 
import { View, ActivityIndicator, StyleSheet } from 'react-native'; 
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importamos todas las pantallas que usaremos en la aplicación.
import Login from '../screens/Login';
import SignUp from '../screens/SignUp';
import Home from '../screens/Home';
import Perfil from '../screens/Perfil';
import Productos from '../screens/Productos';
import Servicios from '../screens/Servicios';
import AdminProductos from '../screens/AdminProductos';

// Creamos las instancias de los navegadores que usaremos.
const Stack = createStackNavigator(); // Se usa para la navegación en pila (Login -> Home)
const Tab = createBottomTabNavigator(); // Se usa para las pestañas inferiores

/**
 * Muestra una pantalla simple con un spinner mientras la aplicación verifica 
 * el estado de autenticación del usuario.
 */
function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" /> 
        </View>
    );
}

/**
 * Define la estructura del Navegador de Pestañas Inferiores (Bottom Tabs).
 * Este es el contenido principal de la aplicación cuando el usuario está logeado.
 */
function HomeTabs() {
    return (
        <Tab.Navigator
            // Configuramos opciones para todas las pestañas.
            screenOptions={({ route }) => ({
                // Ocultamos el encabezado por defecto, ya que cada pantalla gestiona su propio header.
                headerShown: false,
                // Función que determina qué ícono usar en la barra de pestañas.
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
                    // Devolvemos el ícono FontAwesome con el color y tamaño correctos.
                    return <FontAwesome name={iconName} size={size} color={color} />;
                },
                // Definimos los colores para las pestañas activas e inactivas.
                tabBarActiveTintColor: '#007AFF',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            {/* Definición de cada pantalla que aparecerá como pestaña. */}
            <Tab.Screen name="Home" component={Home} />
            <Tab.Screen name="Productos" component={Productos} />
            <Tab.Screen name="Servicios" component={Servicios} />
            <Tab.Screen name="Perfil" component={Perfil} />
        </Tab.Navigator>
    );
}

/**
 * Componente principal de navegación (Stack Navigator).
 * Este componente es el encargado de verificar el estado de Firebase Auth 
 * y mostrar el Stack de pantallas apropiado (Autenticado vs. No Autenticado).
 */
export default function Navigation() {
    // Estado para saber si el usuario ha iniciado sesión.
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Estado para saber si la verificación de Firebase Auth ha terminado.
    const [isLoading, setIsLoading] = useState(true);

    // Hook que se ejecuta al montar el componente.
    useEffect(() => {
        // Suscribirse a los cambios de autenticación de Firebase.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Si 'user' existe (no es null), isAuthenticated será true.
            setIsAuthenticated(!!user);
            // La carga termina una vez que obtenemos el resultado.
            setIsLoading(false);
        });
        // La función de retorno limpia la suscripción para evitar pérdidas de memoria.
        return unsubscribe;
    }, []);

    // Si todavía estamos cargando, mostramos el spinner.
    if (isLoading) {
        return <LoadingScreen />; 
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                {/* El Stack Navigator principal (oculta el header por defecto) */}
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {/* Rendimiento Condicional: Si está autenticado, muestra las rutas de la app. */}
                    {isAuthenticated ? (
                        <>
                            {/* HomeTabs es el navegador de pestañas completo */}
                            <Stack.Screen name="HomeTabs" component={HomeTabs} />
                            {/* AdminProductos es una pantalla fuera de las pestañas, por eso va en el Stack principal */}
                            <Stack.Screen name="AdminProductos" component={AdminProductos} />
                        </>
                    ) : (
                        // Si NO está autenticado, muestra las rutas de Login/Registro.
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

// Estilos básicos para la pantalla de carga
const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
});
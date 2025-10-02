import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    Image, 
    StyleSheet, 
    ScrollView, 
} from 'react-native'; 
import { FontAwesome } from '@expo/vector-icons';
// Funciones de Firebase para la autenticación
import { signInWithEmailAndPassword } from 'firebase/auth';
// Instancia de autenticación de Firebase
import { auth } from '../src/config/firebaseConfig';
// Componente para crear fondos con degradado
import { LinearGradient } from 'expo-linear-gradient'; 

/**
 * Componente principal de la pantalla de Login.
 * @param {object} navigation - Objeto de navegación de React Navigation.
 */
export default function Login({ navigation }) {
    // 1. ESTADOS DEL COMPONENTE
    // Estado para almacenar el correo electrónico ingresado
    const [email, setEmail] = useState('');
    // Estado para almacenar la contraseña ingresada
    const [password, setPassword] = useState('');
    // Estado para controlar la visibilidad de la contraseña (true = visible, false = oculta)
    const [showPassword, setShowPassword] = useState(false);

    // 2. LÓGICA DE AUTENTICACIÓN
    /**
     * Maneja el proceso de inicio de sesión con Firebase.
     */
    const handleLogin = async () => {
        // Validación básica: asegura que ambos campos no estén vacíos
        if (!email || !password) {
            Alert.alert("Error", "Por favor ingrese ambos campos.");
            return;
        }

        try {
            // Intenta iniciar sesión con el correo y la contraseña
            await signInWithEmailAndPassword(auth, email, password);
            
            // Si tiene éxito:
            Alert.alert("Login exitoso", "Has iniciado sesión correctamente.");
            // Navega a la pantalla 'Home' y resetea el stack de navegación
            // Esto evita que el usuario pueda volver a la pantalla de Login con el botón de retroceso
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); 
        } catch (error) {
            // Si hay un error:
            let errorMessage = "Hubo un problema al iniciar sesión.";
            
            // Analiza el código de error de Firebase para dar un mensaje amigable al usuario
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = "El formato del correo electrónico no es válido.";
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "Correo o contraseña incorrectos.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Error de conexión, por favor intenta más tarde.";
                    break;
            }
            // Muestra la alerta con el mensaje de error específico
            Alert.alert("Error", errorMessage);
        }
    };

    // 3. RENDERIZADO DE LA INTERFAZ DE USUARIO (JSX)
    return (
        // Contenedor principal con el fondo de degradado
        <LinearGradient
            colors={['#97c1e6', '#e4eff9']} // Colores del degradado (azul claro a blanco)
            start={{ x: 0.5, y: 0 }} // Punto de inicio (arriba en el centro)
            end={{ x: 0.5, y: 1 }} // Punto final (abajo en el centro)
            style={styles.contenedorFondo}
        >
            {/* Contenedor que permite desplazar el contenido (útil si el teclado está abierto) */}
            <ScrollView contentContainerStyle={styles.scrollContenido}>
                
                {/* Tarjeta blanca centrada que contiene el formulario */}
                <View style={styles.contenedorBlanco}>
                    
                    {/* Sección del Logo y Nombre de la Aplicación */}
                    <View style={styles.contenedorLogo}>
                        <View style={styles.bordeLogo}>
                            {/* Componente de Imagen. Asegúrate de que la ruta sea correcta */}
                            <Image source={require('../assets/logo.png')} style={styles.logo} /> 
                        </View>
                        <Text style={styles.nombreApp}>TecnoSeguridad</Text>
                    </View>

                    {/* Título de la sección */}
                    <Text style={styles.titulo}>Iniciar Sesión</Text>

                    {/* Campo de Correo Electrónico */}
                    <Text style={styles.etiqueta}>Correo Electrónico</Text>
                    <View style={styles.campoContenedor}>
                        {/* Ícono de sobre para el correo */}
                        <FontAwesome name="envelope" size={20} color="#007AFF" style={styles.icono} />
                        <TextInput
                            style={styles.campoEntrada}
                            placeholder="tecnoseguridad@gmail.com"
                            value={email}
                            onChangeText={setEmail} // Actualiza el estado 'email' con cada cambio
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Campo de Contraseña */}
                    <Text style={styles.etiqueta}>Contraseña</Text>
                    <View style={styles.campoContenedor}>
                        {/* Ícono de candado para la contraseña */}
                        <FontAwesome name="lock" size={20} color="#007AFF" style={styles.icono} />
                        <TextInput
                            style={styles.campoEntrada}
                            placeholder="Contraseña"
                            value={password}
                            onChangeText={setPassword} // Actualiza el estado 'password' con cada cambio
                            // Controla si el texto es visible (si showPassword es false, el texto se oculta)
                            secureTextEntry={!showPassword} 
                        />
                        {/* Botón para alternar la visibilidad de la contraseña */}
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            {/* Cambia el ícono entre 'eye-slash' (oculto) y 'eye' (visible) */}
                            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Link de Olvido de Contraseña */}
                    <TouchableOpacity style={styles.botonOlvido}>
                        <Text style={styles.textoOlvido}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    {/* Botón Principal de Inicio de Sesión */}
                    <TouchableOpacity style={styles.botonPrincipal} onPress={handleLogin}>
                        <Text style={styles.textoBotonPrincipal}>Iniciar Sesión</Text>
                    </TouchableOpacity>

                    {/* Botón Opcional de Google */}
                    <TouchableOpacity style={styles.botonGoogle}>
                        <FontAwesome name="google" size={20} color="#db4437" style={styles.iconoGoogle} /> 
                        <Text style={styles.textoBotonGoogle}>Iniciar sesión con Google</Text>
                    </TouchableOpacity>

                    {/* Sección de Registro: ¿No tienes cuenta? Regístrate aquí */}
                    <View style={styles.contenedorRegistro}>
                        <Text style={styles.textoRegistroGris}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.textoRegistroLink}>Regístrate aquí</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

// 4. ESTILOS (StyleSheet)
const styles = StyleSheet.create({
    contenedorFondo: {
        flex: 1, // Ocupa todo el espacio disponible
    },
    scrollContenido: {
        /* minHeight: '95%', lo dejo comentado para ver bien, porque sino la targeta blanca ocupa demasiado */
        minHeight: '95%', // Asegura que el ScrollView ocupe casi toda la pantalla para el centrado
        justifyContent: 'center', // Centra el contenido (la tarjeta blanca) verticalmente
        paddingVertical: 40, // Espacio superior e inferior dentro del scroll
        paddingHorizontal: 30, 
        alignItems: 'center', // Centra la tarjeta horizontalmente
        width: '100%',
    },
    contenedorBlanco: {
        backgroundColor: '#fff',
        width: '100%', 
        // flex: 1, // Deshabilitado para mantener la tarjeta compacta dentro del ScrollView
        paddingVertical: 60, 
        paddingHorizontal: 25,
        borderRadius: 10, 
        alignItems: 'center',
        maxWidth: 700, // Limita el tamaño en pantallas grandes (tablets)
        // Estilos de sombra para dar profundidad
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10, // Sombra para Android
    },
    // Estilos internos
    contenedorRegistro: {
        flexDirection: 'row', // Alinea el texto en una fila
        marginTop: 15, 
        alignItems: 'baseline',
    },
    textoRegistroGris: {
        color: '#555', 
        fontSize: 14,
    },
    textoRegistroLink: {
        color: '#007AFF', 
        fontSize: 14,
        textDecorationLine: 'underline', // Subraya el texto para indicar que es un link
        fontWeight: '600',
    },
    contenedorLogo: {
        alignItems: 'center',
        marginBottom: 10, 
    },
    bordeLogo: {
        borderRadius: 15, 
        padding: 5,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: '#007AFF',
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },
    nombreApp: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF', 
        marginTop: 5,
    },
    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF', 
        marginBottom: 10, 
    },
    etiqueta: {
        alignSelf: 'flex-start', // Alinea la etiqueta a la izquierda
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF', 
        marginTop: 5, 
        marginBottom: 3, 
        width: '100%',
    },
    campoContenedor: {
        flexDirection: 'row', // Alinea el ícono, el input y el botón de ojo
        alignItems: 'center',
        backgroundColor: '#f0f8ff', 
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007AFF', 
        marginBottom: 10, 
        paddingHorizontal: 10,
        width: '100%',
    },
    icono: {
        marginRight: 10,
    },
    campoEntrada: {
        height: 40, 
        flex: 1, // Permite que el input ocupe el espacio restante
        color: '#333',
    },
    botonOlvido: {
        alignSelf: 'flex-end', // Alinea el botón a la derecha
        marginBottom: 10, 
    },
    textoOlvido: {
        color: '#007AFF',
        fontSize: 13,
    },
    botonPrincipal: {
        backgroundColor: '#1E90FF', 
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    textoBotonPrincipal: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    botonGoogle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff', 
        borderWidth: 2,
        borderColor: '#007AFF', 
        paddingVertical: 10,
        paddingHorizontal: 15, 
        borderRadius: 10,
        marginTop: 10,
        width: '100%',
        justifyContent: 'center',
    },
    iconoGoogle: {
        marginRight: 8,
    },
    textoBotonGoogle: {
        color: '#007AFF', 
        fontSize: 14, 
        fontWeight: 'normal', 
    },
});
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Alert, 
    Image, 
    StyleSheet, 
    ScrollView, // Componente para que la pantalla sea desplazable
} from 'react-native'; 
import { FontAwesome } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient'; 

export default function Login({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Por favor ingrese ambos campos.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            Alert.alert("Login exitoso", "Has iniciado sesión correctamente.");
            // Navega a Home y resetea el stack (quita la pantalla de Login del historial)
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); 
        } catch (error) {
            let errorMessage = "Hubo Algun un problema al iniciar sesión.";
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
            Alert.alert("Error", errorMessage);
        }
    };

    return (
        <LinearGradient
            colors={['#97c1e6', '#e4eff9']} 
            start={{ x: 0.5, y: 0 }} 
            end={{ x: 0.5, y: 1 }} 
            style={styles.contenedorFondo}
        >
            {/* 1. Cambio CLAVE: Usar contentContainerStyle con flexGrow: 1 */}
            <ScrollView contentContainerStyle={styles.scrollContenido}>
                
                <View style={styles.contenedorBlanco}>
                    
                    <View style={styles.contenedorLogo}>
                        <View style={styles.bordeLogo}>
                            <Image source={require('../assets/logo.png')} style={styles.logo} /> 
                        </View>
                        <Text style={styles.nombreApp}>TecnoSeguridad</Text>
                    </View>

                    <Text style={styles.titulo}>Iniciar Sesión</Text>

                    <Text style={styles.etiqueta}>Correo Electrónico</Text>
                    <View style={styles.campoContenedor}>
                        <FontAwesome name="envelope" size={20} color="#007AFF" style={styles.icono} />
                        <TextInput
                            style={styles.campoEntrada}
                            placeholder="tecnoseguridad@gmail.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <Text style={styles.etiqueta}>Contraseña</Text>
                    <View style={styles.campoContenedor}>
                        <FontAwesome name="lock" size={20} color="#007AFF" style={styles.icono} />
                        <TextInput
                            style={styles.campoEntrada}
                            placeholder="Contraseña"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity style={styles.botonOlvido}>
                        <Text style={styles.textoOlvido}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.botonPrincipal} onPress={handleLogin}>
                        <Text style={styles.textoBotonPrincipal}>Iniciar Sesión</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.botonGoogle}>
                        <FontAwesome name="google" size={20} color="#db4437" style={styles.iconoGoogle} /> 
                        <Text style={styles.textoBotonGoogle}>Iniciar sesión con Google</Text>
                    </TouchableOpacity>

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

const styles = StyleSheet.create({
    contenedorFondo: {
        flex: 1, 
    },
    scrollContenido: {
        // 🚨 AJUSTE 1: Se recomienda 'flexGrow: 1' para que el contenido ocupe el espacio,
        // pero se pueda desplazar si es necesario.
        flexGrow: 1, 
        // 🚨 AJUSTE 2: Se puede usar 'justifyContent: 'center' para centrar la tarjeta,
        // pero podría interferir con el scroll al abrir el teclado. 'minHeight' y 'justifyContent'
        // son a menudo conflictivos si se busca una solución universal.
        justifyContent: 'center', // Para centrar la tarjeta verticalmente en el medio
        paddingVertical: 40, // Dejamos padding para espacio en los bordes superior/inferior
        paddingHorizontal: 30, 
        alignItems: 'center', 
        width: '100%',
    },
    contenedorBlanco: {
        backgroundColor: '#fff',
        width: '100%', 
        // 🚨 AJUSTE 3: Se ELIMINA 'flex: 1' o 'minHeight' aquí. 
        // Esto permite que el contenedor se ajuste al tamaño de su contenido.
        paddingVertical: 60, // Aumenta el padding interno para que la tarjeta se vea más grande
        paddingHorizontal: 25,
        borderRadius: 10, 
        alignItems: 'center',
        maxWidth: 700, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    // ... (otros estilos sin cambios críticos)
    contenedorRegistro: {
        flexDirection: 'row',
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
        textDecorationLine: 'underline',
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
        alignSelf: 'flex-start',
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF', 
        marginTop: 5, 
        marginBottom: 3, 
        width: '100%',
    },
    campoContenedor: {
        flexDirection: 'row',
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
        // Reemplazar 'width: 85%' por 'flex: 1' si quieres que ocupe todo el espacio restante. 
        // Lo dejamos como estaba en tu código original.
        width: '85%', 
        color: '#333',
    },
    botonOlvido: {
        alignSelf: 'flex-end',
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
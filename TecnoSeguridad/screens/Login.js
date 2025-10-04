import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    StyleSheet, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform, 
    Modal, 
} from 'react-native'; 
import { FontAwesome } from '@expo/vector-icons'; // Iconos
import { signInWithEmailAndPassword } from 'firebase/auth'; // Función de autenticación de Firebase
import { auth } from '../src/config/firebaseConfig'; // Instancia de autenticación de Firebase
import { LinearGradient } from 'expo-linear-gradient'; // Fondo con gradiente

const CustomAlert = ({ isVisible, title, message, onClose }) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={customAlertStyles.modalContainer}>
                <View style={customAlertStyles.alertBox}>
                    <Text style={customAlertStyles.alertTitle}>{title}</Text>
                    <Text style={customAlertStyles.alertMessage}>{message}</Text>
                    
                    <TouchableOpacity 
                        style={customAlertStyles.alertButton} 
                        onPress={onClose}
                    >
                        <Text style={customAlertStyles.alertButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// Estilos para el custom alert
const customAlertStyles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Overlay oscuro
    },
    alertBox: {
        width: 300,
        backgroundColor: 'white', // Fondo Blanco
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF', // Letras Azules
        marginBottom: 10,
    },
    alertMessage: {
        fontSize: 15,
        color: '#007AFF', // Letras Azules
        textAlign: 'center',
        marginBottom: 20,
    },
    alertButton: {
        backgroundColor: '#007AFF', // Fondo Azul
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'center',
    },
    alertButtonText: {
        color: 'white', // Letras Blancas
        fontSize: 16,
        fontWeight: 'bold',
    },
});



export default function Login({ navigation }) {
    const [email, setEmail] = useState(''); // Estado para el correo electrónico
    const [password, setPassword] = useState(''); // Estado para la contraseña
    const [showPassword, setShowPassword] = useState(false); // Alternar visibilidad de contraseña
    
    // Estados para el Custom Alert
    const [isAlertVisible, setIsAlertVisible] = useState(false); // Controlar visibilidad del modal
    const [alertData, setAlertData] = useState({ title: '', message: '' }); // Contenido del modal

    // Muestra el Custom Alert
    const showAlert = (title, message) => {
        setAlertData({ title, message });
        setIsAlertVisible(true);
    };

    // Oculta el Custom Alert
    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    // Maneja la lógica de inicio de sesión con Firebase
    const handleLogin = async () => {
        if (!email || !password) {
            showAlert("Error", "Por favor ingresa ambos campos."); // Usando Custom Alert
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showAlert("Login exitoso", "Has iniciado sesión correctamente."); // Usando Custom Alert
            // Navegación a Home y reseteo del stack
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] }); 
        } catch (error) {
            let errorMessage = "Hubo un problema al iniciar sesión.";
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
            // Muestra el mensaje de error con el Custom Alert 
            showAlert("Error", errorMessage);
        }
    };

    return (
    <LinearGradient
        colors={['#97c1e6', '#e4eff9']} // Colores de gradiente de fondo
        start={{ x: 0.5, y: 0 }} 
        end={{ x: 0.5, y: 1 }} 
        style={styles.contenedorFondo}
    >  
        {/* Renderiza el Custom Alert */}
        <CustomAlert 
            isVisible={isAlertVisible} 
            title={alertData.title} 
            message={alertData.message} 
            onClose={hideAlert} 
        />
        
        <KeyboardAvoidingView
            style={styles.contenedorFondo}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ajuste de teclado
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} 
            enabled
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContenido}
                keyboardShouldPersistTaps="handled" // Permite clicks sin cerrar el teclado
            >
                <View style={styles.contenedorBlanco}>
                    
                    {/* Sección del logo */}
                    <View style={styles.contenedorLogo}>
                        <View style={styles.bordeLogo}>
                            <Image source={require('../assets/logo.png')} style={styles.logo} /> 
                        </View>
                        <Text style={styles.nombreApp}>TecnoSeguridad</Text>
                    </View>

                    <Text style={styles.titulo}>Iniciar Sesión</Text>

                    {/* Campo de Correo Electrónico */}
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

                    {/* Campo de Contraseña */}
                    <Text style={styles.etiqueta}>Contraseña</Text>
                    <View style={styles.campoContenedor}>
                        <FontAwesome name="lock" size={20} color="#007AFF" style={styles.icono} />
                        <TextInput
                            style={styles.campoEntrada}
                            placeholder={"Contraseña"}
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

                    {/* Botón Principal de Login */}
                    <TouchableOpacity style={styles.botonPrincipal} onPress={handleLogin}>
                        <Text style={styles.textoBotonPrincipal}>Iniciar Sesión</Text>
                    </TouchableOpacity>

                    {/* Botón de Google */}
                    <TouchableOpacity style={styles.botonGoogle}>
                        <FontAwesome name="google" size={20} color="#db4437" style={styles.iconoGoogle} /> 
                        <Text style={styles.textoBotonGoogle}>Iniciar sesión con Google</Text>
                    </TouchableOpacity>

                    <View style={styles.contenedorRegistro}>
                        <Text style={styles.textoRegistroGris}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.textoRegistroLinkSinSubrayado}>Regístrate aquí</Text>
                        </TouchableOpacity>
                    </View>
                    
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    </LinearGradient>
);
}


const styles = StyleSheet.create({
    contenedorFondo: {
        flex: 1, 
    },
    scrollContenido: {
        flexGrow: 1, 
        justifyContent: 'center', 
        paddingVertical: 40, 
        paddingHorizontal: 30, 
        alignItems: 'center', 
        width: '100%',
    },
    contenedorBlanco: {
        backgroundColor: '#fff',
        width: '100%', 
        paddingVertical: 60, 
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
    contenedorRegistro: {
        flexDirection: 'row',
        marginTop: 15, 
        alignItems: 'baseline',
    },
    textoRegistroGris: {
        color: '#555', 
        fontSize: 14,
    },
    textoRegistroLinkSinSubrayado: { 
        color: '#007AFF', 
        fontSize: 14,
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
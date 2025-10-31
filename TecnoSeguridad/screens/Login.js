/**
 * PANTALLA: Login.js
 * FUNCIÓN: Maneja la autenticación de usuarios (Inicio de Sesión).
 * -----------------------------------------------------------
 * - UTILIZA: Firebase Auth (signInWithEmailAndPassword).
 * - UX/SEGURIDAD: Incluye la opción de "Olvidé mi Contraseña" (sendPasswordResetEmail).
 * - NAVEGACIÓN: Utiliza navigation.reset() tras el éxito para borrar el historial.
 * - COMPONENTES: Usa CustomAlert y PasswordResetModal para feedback visual.
 */
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
    ActivityIndicator
} from 'react-native'; 
import { FontAwesome } from '@expo/vector-icons';
// Importamos las funciones de autenticación de Firebase
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; 
import { auth } from '../src/config/firebaseConfig'; // Instancia de Firebase Auth
import { LinearGradient } from 'expo-linear-gradient'; // Componente para el fondo degradado

// --- Componentes de Feedback (Alertas y Modales) ---

/**
 * CustomAlert: Modal de alerta personalizado. 
 * Se usa para mostrar mensajes de éxito o error después de intentar iniciar sesión.
 */
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
    // Define colores para éxito (verde) o error (rojo)
    const feedbackColor = isSuccess ? '#4CAF50' : '#FF4136';
    const iconName = isSuccess ? 'check-circle' : 'exclamation-triangle';

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={customAlertStyles.modalContainer}>
                <View style={[customAlertStyles.alertBox, { borderColor: feedbackColor, borderWidth: 2 }]}>
                    <View style={customAlertStyles.headerContainer}>
                           <FontAwesome name={iconName} size={24} color={feedbackColor} style={{ marginRight: 10 }} />
                           <Text style={customAlertStyles.alertTitleBase}>{title}</Text>
                    </View>
                    <Text style={customAlertStyles.alertMessageBase}>{message}</Text>
                    <TouchableOpacity 
                        style={[customAlertStyles.alertButton, { backgroundColor: feedbackColor }]} 
                        onPress={onClose}
                    >
                        <Text style={customAlertStyles.alertButtonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// Estilos específicos para el Custom Alert
const customAlertStyles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
    alertBox: {
        width: 300,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    alertTitleBase: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
    alertMessageBase: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
    alertButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, width: '100%', alignItems: 'center' },
    alertButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

/**
 * PasswordResetModal: Componente Modal para la funcionalidad de recuperación de contraseña.
 * Solicita el correo electrónico del usuario y envía un enlace de restablecimiento.
 */
const PasswordResetModal = ({ isVisible, onClose, onReset, loading, message, resetEmail, setResetEmail }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.passwordResetModalContainer}>
                <View style={styles.passwordResetModalCard}>
                    <Text style={styles.passwordResetTitle}>Restablecer Contraseña</Text>
                    <Text style={styles.passwordResetText}>
                        Ingrese su correo electrónico para recibir un enlace para restablecer su contraseña.
                    </Text>
                    <View style={styles.inputGroup}>
                        <FontAwesome name="envelope" size={20} color="#007AFF" style={styles.icono} />
                        <TextInput
                            style={styles.input}
                            placeholder="Correo electrónico"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#a0a0a0"
                        />
                    </View>
                    {message ? <Text style={styles.messageText}>{message}</Text> : null}
                    <TouchableOpacity style={styles.passwordResetButton} onPress={onReset} disabled={loading}>
                        {/* Muestra spinner si está cargando, o el texto del botón. */}
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.passwordResetButtonText}>Enviar Enlace</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
                        <Text style={styles.passwordResetCancelText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


// --- COMPONENTE PRINCIPAL ---
export default function Login({ navigation }) {
    // Estados para los campos de formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Alterna visibilidad de contraseña
    
    // Estados para el Custom Alert (feedback de Login)
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });
    
    // Estados para el modal de recuperación
    const [isPasswordResetModalVisible, setIsPasswordResetModalVisible] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState('');


    // Muestra la alerta de feedback
    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };
    // Oculta la alerta
    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    /**
     * Función principal que maneja el proceso de inicio de sesión.
     * Utiliza Firebase para verificar las credenciales y redirige a HomeTabs si es exitoso.
     */
    const handleLogin = async () => {
        // 1. Validación de campos vacíos
        if (!email.trim() || !password.trim()) {
            showAlert("Error de campos", "Por favor ingresa tu correo y contraseña.");
            return;
        }

        try {
            // 2. Intento de inicio de sesión con Firebase
            await signInWithEmailAndPassword(auth, email.trim(), password.trim());
            
            // 3. Éxito: Muestra alerta y luego navega a HomeTabs
            showAlert("Login exitoso", "Has iniciado sesión correctamente.", 'success');
            setTimeout(() => {
                // Navegación robusta: Resetea el stack para ir a la navegación principal (HomeTabs)
                navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
            }, 1500); // Espera 1.5 segundos para la transición
        } catch (error) {
            // 4. Manejo de errores de autenticación de Firebase
            let errorMessage = "Hubo un problema al iniciar sesión.";
            switch (error.code) {
                case 'auth/invalid-email':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "Correo o contraseña incorrectos.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Error de conexión, por favor intenta más tarde.";
                    break;
                default:
                    console.error("Error de login (Auth):", error.code);
                    break;
            }
            showAlert("Error de autenticación", errorMessage);
        }
    };

    /**
     * Función que maneja el envío del enlace de recuperación de contraseña mediante Firebase.
     */
    const handlePasswordReset = async () => {
        // 1. Validación de campo vacío
        if (!resetEmail.trim()) {
            setResetMessage('Por favor, ingresa tu correo electrónico.');
            return;
        }
        setResetLoading(true);
        setResetMessage('');

        try {
            // 2. Envía el correo de recuperación a través de Firebase
            await sendPasswordResetEmail(auth, resetEmail.trim());
            
            // 3. Muestra éxito y cierra el modal después de 3 segundos
            setResetMessage('✅ Se ha enviado un correo con un enlace. Revisa tu bandeja de entrada.');
            setTimeout(() => {
                setIsPasswordResetModalVisible(false);
                setResetMessage('');
            }, 3000);
        } catch (error) {
            // 4. Manejo de errores específicos de Firebase (ej: usuario no encontrado)
            let errorMessage = "Ocurrió un error. Inténtalo de nuevo más tarde.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                 errorMessage = "La dirección de correo NO es válida.";
            }
            setResetMessage(`❌ Error: ${errorMessage}`);
        } finally {
            setResetLoading(false);
        }
    };
    

    return (
    <LinearGradient
        colors={['#97c1e6', '#e4eff9']} // Fondo degradado
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.contenedorFondo}
    >
        {/* Modal de Alerta de Login */}
        <CustomAlert
            isVisible={isAlertVisible}
            title={alertData.title}
            message={alertData.message}
            onClose={hideAlert}
            type={alertData.type}
        />

        {/* Modal de Recuperación de Contraseña */}
        <PasswordResetModal
            isVisible={isPasswordResetModalVisible}
            onClose={() => { setIsPasswordResetModalVisible(false); setResetMessage(''); }}
            onReset={handlePasswordReset}
            loading={resetLoading}
            message={resetMessage}
            resetEmail={resetEmail}
            setResetEmail={setResetEmail}
        />

        {/* KeyboardAvoidingView asegura que el teclado no oculte los campos */}
        <KeyboardAvoidingView
            style={styles.contenedorFondo}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            enabled
        >
            <ScrollView
                contentContainerStyle={styles.scrollContenido}
                keyboardShouldPersistTaps="handled" 
            >
                <View style={styles.contenedorBlanco}>
                    {/* Sección del Logo y Nombre de la App */}
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
                            autoCorrect={false}
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
                            secureTextEntry={!showPassword} // Oculta/muestra el texto
                            autoCorrect={false}
                        />
                        {/* Botón para mostrar/ocultar contraseña */}
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Enlace de Olvidó Contraseña */}
                    <TouchableOpacity style={styles.botonOlvido} onPress={() => setIsPasswordResetModalVisible(true)}>
                        <Text style={styles.textoOlvido}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>
                    
                    {/* Botón Principal de Login */}
                    <TouchableOpacity style={styles.botonPrincipal} onPress={handleLogin}>
                        <Text style={styles.textoBotonPrincipal}>Iniciar Sesión</Text>
                    </TouchableOpacity> 
                    
                    {/* Enlace para ir a la pantalla de Registro */}
                    <View style={styles.contenedorRegistro}>
                        <Text style={styles.textoRegistroGris}>¿No tenes cuenta? </Text>
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

// --- ESTILOS ---
const styles = StyleSheet.create({
    contenedorFondo: { flex: 1 },
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
    textoRegistroGris: { color: '#555', fontSize: 14 },
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
    logo: { width: 80, height: 80, borderRadius: 10 },
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
    icono: { marginRight: 10 },
    campoEntrada: {
        height: 40,
        width: '85%',
        color: '#333',
    },
    botonOlvido: { alignSelf: 'flex-end', marginBottom: 10 },
    textoOlvido: { color: '#007AFF', fontSize: 13 },
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
    // Estilos del modal de recuperación de contraseña
    passwordResetModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    passwordResetModalCard: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    passwordResetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 15,
    },
    passwordResetText: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },
    messageText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
        color: '#007AFF'
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        marginBottom: 15,
        width: '100%',
    },
    icon: { paddingHorizontal: 10 },
    input: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
        color: '#333',
    },
    passwordResetButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 12,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
    },
    passwordResetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    passwordResetCancelText: {
        color: '#888',
        textDecorationLine: 'underline',
        marginTop: 10,
    },
});
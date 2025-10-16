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
import { FontAwesome } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    const isSuccess = type === 'success';
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

export default function Login({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });

    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };

    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            showAlert("Error de campos", "Por favor ingresa tu correo y contraseña.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email.trim(), password.trim());
            showAlert("Login exitoso", "Has iniciado sesión correctamente.", 'success');
            setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: 'HomeTabs' }] });
            }, 1500);
        } catch (error) {
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

    return (
    <LinearGradient
        colors={['#97c1e6', '#e4eff9']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.contenedorFondo}
    >
        <CustomAlert
            isVisible={isAlertVisible}
            title={alertData.title}
            message={alertData.message}
            onClose={hideAlert}
            type={alertData.type}
        />
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
                            autoCorrect={false}
                        />
                    </View>
                    <Text style={styles.etiqueta}>Contraseña</Text>
                    <View style={styles.campoContenedor}>
                        <FontAwesome name="lock" size={20} color="#007AFF" style={styles.icono} />
                        <TextInput
                            style={styles.campoEntrada}
                            placeholder={"Contraseña"}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCorrect={false}
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
});
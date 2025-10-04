import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    ScrollView,
    Platform, 
    KeyboardAvoidingView,
    Modal, // 👈 Importamos Modal
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../src/config/firebaseConfig'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { LinearGradient } from 'expo-linear-gradient'; 

// creo el customalert para controlarlas

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

// xreo esto para modificar el alerta
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


export default function SignUp({ navigation }) {
    // Estados para los campos de entrada
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // Estados para mostrar/ocultar contraseña
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Estados para mensajes de error de validación en la interfaz
    const [passwordError, setPasswordError] = useState('');
    const [confirmError, setConfirmError] = useState('');

    // Estados y funciones para el Custom Alert (Modal)
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '' });

    const showAlert = (title, message) => {
        setAlertData({ title, message });
        setIsAlertVisible(true);
    };

    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    const handleSignUp = async () => {
        // 1. Validación: Campos Obligatorios
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            showAlert("Error", "Todos los campos son obligatorios."); 
            return;
        }

        // 2. Validación: Contraseñas Coincidentes
        if (password !== confirmPassword) {
            setConfirmError("Las contraseñas no coinciden.");
            setPasswordError('');
            showAlert("Error", "Las contraseñas no coinciden."); 
            return;
        } else {
            setConfirmError(''); 
        }

        // 3. Validación: Complejidad de Contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            setPasswordError("La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número.");
            setConfirmError(''); 
            showAlert("Error", "La contraseña no cumple con los requisitos de seguridad."); // 👈 Usando Custom Alert
            return;
        } else {
            setPasswordError(''); 
        }

        try {
            // Registrar usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Guardar datos adicionales en Firestore
            await setDoc(doc(db, "users", user.uid), {
                firstName: firstName,
                lastName: lastName,
                email: email,
                createdAt: new Date()
            });
            
            // ÉXITO
            showAlert("Registro exitoso", "Cuenta creada y datos guardados. Serás redirigido a Login."); // 👈 Usando Custom Alert
            // Dar un pequeño delay para que el usuario lea el mensaje de éxito antes de navegar
            setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] }); 
            }, 2000); 

        } catch (error) {
            let errorMessage = "Hubo un problema al registrar el usuario.";
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "El correo electrónico ya está en uso. Intente con otro.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "El formato del correo electrónico no es válido.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Error de conexión, por favor intenta más tarde.";
                    break;
            }
            // ERROR (Todos los errores usan ahora el Custom Alert)
            showAlert("Error", errorMessage);
        }
    };

    return (
        <LinearGradient
            colors={['#97c1e6', '#e4eff9']} 
            start={{ x: 0.5, y: 0 }} 
            end={{ x: 0.5, y: 1 }} 
            style={styles.contenedorFondo}
        >
            {/* 👈 Renderiza el Custom Alert (Modal) */}
            <CustomAlert 
                isVisible={isAlertVisible} 
                title={alertData.title} 
                message={alertData.message} 
                onClose={hideAlert} 
            />

            <KeyboardAvoidingView
                behavior={"padding"} 
                style={styles.keyboardAvoiding} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} 
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContenido}
                    showsVerticalScrollIndicator={false} 
                    keyboardShouldPersistTaps="handled" 
                >
                    
                    <View style={styles.contenedorBlanco}>
                        
                        <View style={styles.contenedorLogo}>
                            <View style={styles.bordeLogo}>
                                <Image source={require('../assets/logo.png')} style={styles.logo} /> 
                            </View>
                            <Text style={styles.nombreApp}>TecnoSeguridad</Text>
                        </View>

                        <Text style={styles.titulo}>Crear una Cuenta</Text>

                        {/* Campo Nombre */}
                        <Text style={styles.etiqueta}>Nombre</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="user" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Ingrese su Nombre"
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words" 
                            />
                        </View>

                        {/* Campo Apellido */}
                        <Text style={styles.etiqueta}>Apellido</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="user" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Ingrese su Apellido"
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words" 
                            />
                        </View>

                        {/* Campo Correo Electrónico */}
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

                        {/* Campo Contraseña */}
                        <Text style={styles.etiqueta}>Contraseña</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="lock" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Ingrese su Contraseña"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? <Text style={styles.textoError}>{passwordError}</Text> : null}

                        {/* Campo Confirmar Contraseña */}
                        <Text style={styles.etiqueta}>Confirmar Contraseña</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="lock" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Confirme su Contraseña"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                        {confirmError ? <Text style={styles.textoError}>{confirmError}</Text> : null}

                        <TouchableOpacity style={styles.botonPrincipal} onPress={handleSignUp}>
                            <Text style={styles.textoBotonPrincipal}>Registrarse</Text>
                        </TouchableOpacity>

                        <View style={styles.contenedorRegistro}>
                            <Text style={styles.textoRegistroGris}>¿Ya tienes cuenta? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.textoRegistroLink}>Inicia Sesión</Text>
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
    keyboardAvoiding: {
        flex: 1, 
    },
    scrollContenido: {
        flexGrow: 1, 
        paddingVertical: 10, 
        paddingHorizontal: 30, 
        alignItems: 'center', 
        width: '100%',
        alignSelf: 'center',
    },
    contenedorBlanco: {
        backgroundColor: '#fff',
        width: '100%', 
        borderRadius: 10, 
        paddingVertical: 30, 
        paddingHorizontal: 25,
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
        marginTop: 25,
        alignItems: 'baseline',
    },
    textoRegistroGris: {
        color: '#555', 
        fontSize: 14,
    },
    textoRegistroLink: {
        color: '#007AFF', 
        fontSize: 14,
        fontWeight: '600',
    },
    contenedorLogo: {
        alignItems: 'center',
        marginBottom: 20,
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
        marginBottom: 20,
    },
    etiqueta: {
        alignSelf: 'flex-start',
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF', 
        marginTop: 10,
        marginBottom: 5,
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
        flex: 1,
        height: 45,
        color: '#333',
    },
    textoError: {
        color: '#FF4136', 
        fontSize: 12,
        marginBottom: 5,
        alignSelf: 'flex-start',
        width: '100%',
        paddingLeft: 5, 
    },
    botonPrincipal: {
        backgroundColor: '#1E90FF', 
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    textoBotonPrincipal: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
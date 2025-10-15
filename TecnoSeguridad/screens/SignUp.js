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
    Modal, 
    ActivityIndicator,
    Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../src/config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

// Componente CustomAlert: Modal de alerta con ícono y color dinámico.
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    // Definir colores e íconos para retroalimentación (solo estos cambian)
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

// Componente de Requisitos de Contraseña
const PasswordRequirements = ({ hasUppercase, hasLowercase, hasNumber, hasMinLength }) => {
    const getColor = (isMet) => isMet ? '#4CAF50' : '#007AFF';

    return (
        <View style={styles.requirementsContainer}>
            <Text style={{ color: getColor(hasMinLength), fontSize: 12, marginBottom: 2 }}>
                <FontAwesome name={hasMinLength ? "check-circle" : "circle-o"} size={12} /> Mínimo 8 caracteres
            </Text>
            <Text style={{ color: getColor(hasLowercase), fontSize: 12, marginBottom: 2 }}>
                <FontAwesome name={hasLowercase ? "check-circle" : "circle-o"} size={12} /> Al menos una letra minúscula
            </Text>
            <Text style={{ color: getColor(hasUppercase), fontSize: 12, marginBottom: 2 }}>
                <FontAwesome name={hasUppercase ? "check-circle" : "circle-o"} size={12} /> Al menos una letra mayúscula
            </Text>
            <Text style={{ color: getColor(hasNumber), fontSize: 12 }}>
                <FontAwesome name={hasNumber ? "check-circle" : "circle-o"} size={12} /> Al menos un número
            </Text>
        </View>
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

// Valida formato y repetición de nombres/apellidos.
const isValidName = (text) => {
    const nameRegex = /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ'-]+$/;
    if (!nameRegex.test(text)) return false;
    const repetitionRegex = /(.)\1{4,}/;
    if (repetitionRegex.test(text)) return false;
    return true;
};

export default function SignUp({ navigation }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmMatchError, setConfirmMatchError] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [hasLowercase, setHasLowercase] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasMinLength, setHasMinLength] = useState(false);

    const [isAlertVisible, setIsAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });
    const [isSaving, setIsSaving] = useState(false);


    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };

    const hideAlert = () => {
        setIsAlertVisible(false);
    };

    const validateFirstName = (text) => {
        setFirstName(text);
        const trimmedText = text.trim();

        if (trimmedText.length === 0) {
            setFirstNameError(text.length > 0 ? "El nombre no puede ser solo espacios en blanco." : '');
            return;
        }

        if (trimmedText.length < 2) {
            setFirstNameError("El nombre es demasiado corto (mínimo 2 letras útiles).");
        } 
        else if (!isValidName(trimmedText)) {
            setFirstNameError("Solo se permiten letras, espacios o acentos, sin repeticiones excesivas.");
        } else {
            setFirstNameError('');
        }
    };

    const validateLastName = (text) => {
        setLastName(text);
        const trimmedText = text.trim();

        if (trimmedText.length === 0) {
            setLastNameError(text.length > 0 ? "El apellido no puede ser solo espacios en blanco." : '');
            return;
        }

        if (trimmedText.length < 2) {
            setLastNameError("El apellido es demasiado corto (mínimo 2 letras útiles).");
        }
        else if (!isValidName(trimmedText)) {
            setLastNameError("Solo se permiten letras, espacios o acentos, sin repeticiones excesivas.");
        } else {
            setLastNameError('');
        }
    };

    const validatePassword = (text) => {
        setPassword(text);
        setPasswordError('');

        setHasMinLength(text.length >= 8);
        setHasLowercase(/[a-z]/.test(text));
        setHasUppercase(/[A-Z]/.test(text));
        setHasNumber(/\d/.test(text));

        if (confirmPassword && text !== confirmPassword) {
            setConfirmMatchError("Las contraseñas no coinciden.");
        } else {
            setConfirmMatchError('');
        }
    };

    const validateConfirmPassword = (text) => {
        setConfirmPassword(text);
        setConfirmMatchError('');

        if (password && text !== password) {
            setConfirmMatchError("Las contraseñas no coinciden.");
        } else {
            setConfirmMatchError('');
        }
    };

    const handleSignUp = async () => {
        setIsSaving(true);
        
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
            showAlert("Error", "Todos los campos son obligatorios.");
            setIsSaving(false);
            return;
        }

        const hasVisibleError = firstNameError || lastNameError || passwordError || confirmMatchError;
        if (hasVisibleError) {
            showAlert("Error de Validación", "Por favor, corrige los errores marcados en los campos.");
            setIsSaving(false);
            return;
        }

        const isPasswordValid = hasMinLength && hasLowercase && hasUppercase && hasNumber;
        if (!isPasswordValid) {
            setPasswordError("La contraseña no cumple con todos los requisitos.");
            showAlert("Error", "La contraseña no cumple con todos los requisitos.");
            setIsSaving(false);
            return;
        } 

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await setDoc(doc(db, "users", user.uid), {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email,
                profileImage: null,
                createdAt: new Date(),
            });

            showAlert("Registro exitoso", "Cuenta creada. Regresando a Inicio de Sesión.", 'success');
            
            setTimeout(() => {
                // Navegación corregida para volver al Login después de registrarse
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }, 1500);

        } catch (error) {
            let errorMessage = "Hubo un problema al registrar el usuario.";
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = "El correo electrónico ya está en uso.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "El formato del correo electrónico no es válido.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "Error de conexión. Por favor, intenta más tarde.";
                    break;
                default:
                    console.error("Error de registro (Auth):", error);
                    break;
            }
            showAlert("Error de Registro", errorMessage);
        } finally {
            setIsSaving(false);
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
                behavior={"padding"} 
                style={styles.keyboardAvoiding} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20} 
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
                        <Text style={styles.etiqueta}>Nombre</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="user" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Ingrese su Nombre"
                                value={firstName}
                                onChangeText={validateFirstName}
                                autoCapitalize="words" 
                                keyboardType="default"
                            />
                        </View>
                        {firstNameError ? <Text style={styles.textoError}>{firstNameError}</Text> : null}
                        <Text style={styles.etiqueta}>Apellido</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="user" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Ingrese su Apellido"
                                value={lastName}
                                onChangeText={validateLastName}
                                autoCapitalize="words" 
                                keyboardType="default"
                            />
                        </View>
                        {lastNameError ? <Text style={styles.textoError}>{lastNameError}</Text> : null}
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
                                placeholder="Ingrese su Contraseña"
                                value={password}
                                onChangeText={validatePassword} 
                                secureTextEntry={!showPassword} 
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? <Text style={styles.textoError}>{passwordError}</Text> : null}
                        <Text style={styles.etiqueta}>Confirmar Contraseña</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="lock" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Confirme su Contraseña"
                                value={confirmPassword}
                                onChangeText={validateConfirmPassword} 
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <FontAwesome name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>
                        {confirmMatchError ? <Text style={styles.textoError}>{confirmMatchError}</Text> : null}
                        <TouchableOpacity style={styles.botonPrincipal} onPress={handleSignUp}>
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotonPrincipal}>Registrarse</Text>}
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
    contenedorFondo: { flex: 1 },
    keyboardAvoiding: { flex: 1 },
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
        shadowOffset: { width:
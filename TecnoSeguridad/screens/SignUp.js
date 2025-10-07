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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../src/config/firebaseConfig'; // Instancia de Auth y Firestore
import { createUserWithEmailAndPassword } from 'firebase/auth'; // Función para crear usuario
import { doc, setDoc } from 'firebase/firestore'; // Función para guardar datos en Firestore
import { LinearGradient } from 'expo-linear-gradient'; // Fondo con gradiente


// Componente CustomAlert: Modal de alerta con ícono y color dinámico.
const CustomAlert = ({ isVisible, title, message, onClose, type = 'error' }) => {
    // Definir colores e íconos para retroalimentación (solo estos cambian)
    const isSuccess = type === 'success';
    const feedbackColor = isSuccess ? '#4CAF50' : '#FF4136'; // Verde o Rojo
    const iconName = isSuccess ? 'check-circle' : 'exclamation-triangle'; // Check o Triángulo

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={customAlertStyles.modalContainer}>
                {/* El borde del alertbox usa el color de feedback */}
                <View style={[customAlertStyles.alertBox, { borderColor: feedbackColor, borderWidth: 2 }]}>

                    {/* Contenedor del Ícono y Título */}
                    <View style={customAlertStyles.headerContainer}>
                        {/* El ícono usa el color de feedback */}
                        <FontAwesome name={iconName} size={24} color={feedbackColor} style={{ marginRight: 10 }} />
                        {/* El título usa el color base AZUL */}
                        <Text style={customAlertStyles.alertTitleBase}>{title}</Text>
                    </View>

                    {/* El mensaje usa un color base azul/gris */}
                    <Text style={customAlertStyles.alertMessageBase}>{message}</Text>

                    <TouchableOpacity
                        // El botón usa el color de feedback
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
    // Determina el color: Verde si se cumple, Azul si no.
    const getColor = (isMet) => isMet ? '#4CAF50' : '#007AFF';

    return (
        <View style={styles.requirementsContainer}>
            <Text style={{ color: getColor(hasMinLength), fontSize: 12, marginBottom: 2 }}>
                <FontAwesome name={hasMinLength ? "check-circle" : "circle-o"} size={12} /> Mínimo 6 caracteres
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


// Estilos específicos para el Custom Alert (MODIFICADOS)
const customAlertStyles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
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
        // El borde se aplica dinámicamente
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    // Estilo base para el título (siempre azul)
    alertTitleBase: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    // Estilo base para el mensaje (color neutral)
    alertMessageBase: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
    },
    alertButton: {
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: '100%',
        alignItems: 'center',
        // El color de fondo se aplica dinámicamente
    },
    alertButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});


// Valida formato (letras, acentos, espacios, guiones) y repetición.
const isValidName = (text) => {
    // 1. Regex para el formato de caracteres.
    const nameRegex = /^[a-zA-Z\sñÑáéíóúÁÉÍÓÚ'-]+$/;
    if (!nameRegex.test(text)) {
        return false; // Falla si tiene números o símbolos
    }

    // 2. Comprobación de Caracteres Repetidos (5 o más veces consecutivas).
    const repetitionRegex = /(.)\1{4,}/;
    if (repetitionRegex.test(text)) {
        return false; // Falla si el patrón se repite
    }

    return true;
};


export default function SignUp({ navigation }) {
    // Estados para los campos de entrada
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Estados de Error Específicos (Mostrados debajo del campo)
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmMatchError, setConfirmMatchError] = useState('');

    // Estados para mostrar/ocultar contraseña
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Estados para la VALIDACIÓN DE COMPLEJIDAD de contraseña
    const [hasLowercase, setHasLowercase] = useState(false);
    const [hasUppercase, setHasUppercase] = useState(false);
    const [hasNumber, setHasNumber] = useState(false);
    const [hasMinLength, setHasMinLength] = useState(false);

    // Estados y funciones para el Custom Alert (Modal)
    const [isAlertVisible, setIsAlertVisible] = useState(false);
    // Añadido 'type' para el alert dinámico
    const [alertData, setAlertData] = useState({ title: '', message: '', type: 'error' });

    // Muestra el Custom Alert con título, mensaje y tipo.
    const showAlert = (title, message, type = 'error') => {
        setAlertData({ title, message, type });
        setIsAlertVisible(true);
    };

    // Oculta el Custom Alert
    const hideAlert = () => {
        setIsAlertVisible(false);
    };


    // Valida Nombre en tiempo real (longitud, espacios, formato, repetición).
    const validateFirstName = (text) => {
        setFirstName(text);

        const trimmedText = text.trim();

        // 1. Campo vacío o solo espacios
        if (trimmedText.length === 0) {
            setFirstNameError(text.length > 0 ? "El nombre no puede ser solo espacios en blanco." : '');
            return;
        }

        // 2. Longitud útil (Mínimo 2 letras)
        if (trimmedText.length < 2) {
            setFirstNameError("El nombre es demasiado corto (mínimo 2 letras útiles).");
        }
        // 3. Formato y Repetición
        else if (!isValidName(trimmedText)) {
            setFirstNameError("Solo se permiten letras, espacios o acentos, sin repeticiones excesivas.");
        } else {
            setFirstNameError(''); // Éxito
        }
    };

    // Valida Apellido en tiempo real (longitud, espacios, formato, repetición).
    const validateLastName = (text) => {
        setLastName(text);

        const trimmedText = text.trim();

        // 1. Campo vacío o solo espacios
        if (trimmedText.length === 0) {
            setLastNameError(text.length > 0 ? "El apellido no puede ser solo espacios en blanco." : '');
            return;
        }

        // 2. Longitud útil (Mínimo 2 letras)
        if (trimmedText.length < 2) {
            setLastNameError("El apellido es demasiado corto (mínimo 2 letras útiles).");
        }
        // 3. Formato y Repetición
        else if (!isValidName(trimmedText)) {
            setLastNameError("Solo se permiten letras, espacios o acentos, sin repeticiones excesivas.");
        } else {
            setLastNameError(''); // Éxito
        }
    };

    // Valida la complejidad de la contraseña en tiempo real.
    const validatePassword = (text) => {
        setPassword(text);
        setPasswordError('');

        // Chequeo de complejidad
        setHasMinLength(text.length >= 6);
        setHasLowercase(/[a-z]/.test(text));
        setHasUppercase(/[A-Z]/.test(text));
        setHasNumber(/\d/.test(text));

        // Chequeo de coincidencia con la confirmación
        if (confirmPassword && text !== confirmPassword) {
            setConfirmMatchError("Las contraseñas no coinciden.");
        } else {
            setConfirmMatchError('');
        }
    };

    // Valida la coincidencia de la confirmación en tiempo real.
    const validateConfirmPassword = (text) => {
        setConfirmPassword(text);
        setConfirmMatchError('');

        if (password && text !== password) {
            setConfirmMatchError("Las contraseñas no coinciden.");
        } else {
            setConfirmMatchError('');
        }
    };


    // Maneja el proceso de registro completo (Auth y Firestore).
    const handleSignUp = async () => {
        // --- 1. VALIDACIONES FINALES ---

        // 1.1. Validación: Campos Obligatorios
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
            showAlert("Error", "Todos los campos son obligatorios.");
            return;
        }

        // 1.2. Validación: Errores Visuales Pendientes
        const hasVisibleError = firstNameError || lastNameError || passwordError || confirmMatchError;

        if (hasVisibleError) {
            showAlert("Error de Validación", "Por favor, corrige los errores marcados en los campos.");
            return;
        }

        // 1.3. Validación: Complejidad de Contraseña
        const isPasswordValid = hasMinLength && hasLowercase && hasUppercase && hasNumber;
        if (!isPasswordValid) {
            setPasswordError("La contraseña no cumple con todos los requisitos.");
            showAlert("Error", "La contraseña no cumple con todos los requisitos.");
            return;
        }


        // --- 2. REGISTRO EN FIREBASE Y FIRESTORE ---

        try {
            // A. Registrar usuario en Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ÉXITO DE AUTENTICACIÓN (Muestra verde)
            showAlert("Registro exitoso", "Cuenta creada. Regresando a Inicio de Sesión.", 'success');

            // Redirige a Login después de un breve tiempo
            setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }, 1500);

            // B. Guardar datos adicionales en Firestore
            try {
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstName.trim(), // Guarda el nombre sin espacios extra
                    lastName: lastName.trim(), // Guarda el apellido sin espacios extra
                    email: email,
                    createdAt: new Date()
                });
            } catch (firestoreError) {
                // Fallo en la base de datos (la cuenta Auth ya existe)
                console.error("Error al guardar datos de usuario en Firestore:", firestoreError);
            }

        } catch (error) {
            // C. Manejo de errores de Firebase Authentication (Muestra rojo)
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
        }
    };

    return (
        <LinearGradient
            colors={['#97c1e6', '#e4eff9']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.contenedorFondo}
        >
            {/* Renderiza la alerta personalizada */}
            <CustomAlert
                isVisible={isAlertVisible}
                title={alertData.title}
                message={alertData.message}
                onClose={hideAlert}
                type={alertData.type} // Pasa el tipo ('error' o 'success')
            />

            <KeyboardAvoidingView
                style={styles.contenedorFondo}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                enabled
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContenido}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    <View style={styles.contenedorBlanco}>

                        {/* Logo y Nombre de la Aplicación */}
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
                                onChangeText={validateFirstName} // Validación en tiempo real
                                autoCapitalize="words"
                                keyboardType="default"
                            />
                        </View>
                        {/* Mensaje de error de Nombre */}
                        {firstNameError ? <Text style={styles.textoError}>{firstNameError}</Text> : null}


                        {/* Campo Apellido */}
                        <Text style={styles.etiqueta}>Apellido</Text>
                        <View style={styles.campoContenedor}>
                            <FontAwesome name="user" size={20} color="#007AFF" style={styles.icono} />
                            <TextInput
                                style={styles.campoEntrada}
                                placeholder="Ingrese su Apellido"
                                value={lastName}
                                onChangeText={validateLastName} // Validación en tiempo real
                                autoCapitalize="words"
                                keyboardType="default"
                            />
                        </View>
                        {/* Mensaje de error de Apellido */}
                        {lastNameError ? <Text style={styles.textoError}>{lastNameError}</Text> : null}


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

                        {/* Contraseña */}
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

                        {/* Requisitos de seguridad */}
                        <PasswordRequirements
                            hasLowercase={hasLowercase}
                            hasUppercase={hasUppercase}
                            hasNumber={hasNumber}
                            hasMinLength={hasMinLength}
                        />
                        {/* Mensaje de error de complejidad */}
                        {passwordError ? <Text style={styles.textoError}>{passwordError}</Text> : null}

                        {/* Campo Confirmar Contraseña */}
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

                        {/* Mensaje de error si las contraseñas no coinciden */}
                        {confirmMatchError ? <Text style={styles.textoError}>{confirmMatchError}</Text> : null}

                        {/* Botón de Registro */}
                        <TouchableOpacity style={styles.botonPrincipal} onPress={handleSignUp}>
                            <Text style={styles.textoBotonPrincipal}>Registrarse</Text>
                        </TouchableOpacity>

                        {/* Enlace para ir al Login */}
                        <View style={styles.contenedorRegistro}>
                            <Text style={styles.textoRegistroGris}>¿Ya tenes cuenta? </Text>
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
    requirementsContainer: {
        width: '100%',
        paddingLeft: 5,
        marginBottom: 10,
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
        textDecorationLine: 'underline',
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
        marginBottom: 2,
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
        marginBottom: 8,
        alignSelf: 'flex-start',
        width: '100%',
        paddingLeft: 5,
        fontWeight: '500',
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
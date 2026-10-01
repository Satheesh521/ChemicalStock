// D:\ReactNative\ChemicalStock\app\login.tsx

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// =====================================================
// COLOUR SCHEME
// =====================================================

const COLORS = {
  primary: '#1B7B3C',
  primaryLight: '#2FA85F',
  primaryLightest: '#E8F5E9',

  accent: '#FF6B6B',
  accentLight: '#FFE8E8',

  text: '#212121',
  textLight: '#757575',
  textPlaceholder: '#BDBDBD',

  border: '#E0E0E0',
  background: '#FFFFFF',

  success: '#4CAF50',
};

// =====================================================
// AUTHORISED EMAILS
// =====================================================

// FULL ACCESS USERS
const FULL_ACCESS_EMAILS = [
  'mpadmin605@gmail.com',
  'mpowner605@gmail.com',
  'mpmanager605@gmail.com',
  'mplab605@gmail.com',
  'mpdyesincharge605@gmail.com',
];

// RESTRICTED ACCESS USERS
const RESTRICTED_ACCESS_EMAILS = [
  'mpsupervisor605@gmail.com',
  'mpsample605@gmail.com',
];

// =====================================================
// EMAIL ACCESS CHECK
// =====================================================

const getEmailAccess = (emailValue: string) => {
  const normalizedEmail = emailValue.toLowerCase().trim();

  if (FULL_ACCESS_EMAILS.includes(normalizedEmail)) {
    return 'full';
  }

  if (RESTRICTED_ACCESS_EMAILS.includes(normalizedEmail)) {
    return 'restricted';
  }

  return null;
};

// =====================================================
// LOGIN SCREEN
// =====================================================

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  const {
    signIn,
    signUp,
    loading,
    error,
    clearError,
  } = useAuth();

  const router = useRouter();

  // =====================================================
  // EMAIL VALIDATION
  // =====================================================

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(emailValue);
  };

  // =====================================================
  // FORM VALIDATION
  // =====================================================

  const validateForm = () => {
    let isValid = true;

    setEmailError('');
    setPasswordError('');
    setNameError('');

    // EMAIL
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    // PASSWORD
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    // NAME - SIGNUP ONLY
    if (!isLogin) {
      if (!name.trim()) {
        setNameError('Full name is required');
        isValid = false;
      } else if (name.trim().length < 3) {
        setNameError('Name must be at least 3 characters');
        isValid = false;
      }
    }

    return isValid;
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    clearError();

    // First validate form
    if (!validateForm()) {
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ===================================================
    // IMPORTANT SECURITY CHECK
    // ===================================================
    // Only authorised emails are allowed.
    //
    // Any other email:
    // LOGIN  -> BLOCK
    // SIGNUP -> BLOCK
    // ===================================================

    const accessType = getEmailAccess(normalizedEmail);

    if (!accessType) {
      Alert.alert(
        'Access Denied',
        'This email address is not authorised to access ChemMaintain.'
      );

      return;
    }

    try {
      // =================================================
      // LOGIN
      // =================================================

      if (isLogin) {
        const loggedUser = await signIn(
          normalizedEmail,
          password
        );

        // Login failed / no user returned
        if (!loggedUser) {
          throw new Error(
            'Unable to login. Please check your email and password.'
          );
        }

        // =================================================
        // SECOND SECURITY CHECK
        // =================================================
        // Do NOT trust database role here.
        // Email whitelist decides access.
        // =================================================

        const loggedInEmail =
          loggedUser.email?.toLowerCase().trim() || '';

        const loggedInAccess =
          getEmailAccess(loggedInEmail);

        // Somehow logged-in email is not authorised
        if (!loggedInAccess) {
          Alert.alert(
            'Access Denied',
            'This account is not authorised to access ChemMaintain.'
          );

          return;
        }

        // =================================================
        // FULL ACCESS
        // =================================================

        if (loggedInAccess === 'full') {
          router.replace('/(tabs)' as any);
          return;
        }

        // =================================================
        // RESTRICTED ACCESS
        // =================================================

        if (loggedInAccess === 'restricted') {
          router.replace('/(tabs)' as any);
          return;
        }

        return;
      }

      // =================================================
      // SIGNUP
      // =================================================

      // Only approved emails can create an account.
      await signUp(
        normalizedEmail,
        password,
        name.trim()
      );

      Alert.alert(
        'Success',
        'Account created successfully! Please login now.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsLogin(true);

              setEmail('');
              setPassword('');
              setName('');

              setEmailError('');
              setPasswordError('');
              setNameError('');

              clearError();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('❌ Submit error:', err);

      const displayMessage =
        typeof err === 'string'
          ? err
          : err?.message ||
          'Please check your email and password.';

      Alert.alert(
        isLogin ? 'Login Failed' : 'Signup Failed',
        displayMessage
      );
    }
  };

  // =====================================================
  // LOGIN / SIGNUP TOGGLE
  // =====================================================

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);

    setEmail('');
    setPassword('');
    setName('');

    setEmailError('');
    setPasswordError('');
    setNameError('');

    clearError();
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <KeyboardAvoidingView
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.headerSection}>

          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.appName}>
            ChemMaintain
          </Text>

          <Text style={styles.appTagline}>
            Chemical Stock Maintain App
          </Text>

          <Text style={styles.welcomeText}>
            {isLogin
              ? 'Welcome Back'
              : 'Create Your Account'}
          </Text>

          <Text style={styles.subtitleText}>
            {isLogin
              ? 'Sign in to your authorised work account'
              : 'Create an authorised work account'}
          </Text>

        </View>

        {/* =================================================
            FORM
        ================================================= */}

        <View style={styles.formSection}>

          {/* NAME - SIGNUP ONLY */}

          {!isLogin && (
            <View style={styles.formGroup}>

              <Text style={styles.label}>
                Full Name
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  nameError
                    ? styles.inputError
                    : null,
                ]}
              >

                <Text style={styles.inputIcon}>
                  👤
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={
                    COLORS.textPlaceholder
                  }
                  value={name}
                  onChangeText={(text) => {
                    setName(text);

                    if (text.trim().length >= 3) {
                      setNameError('');
                    }
                  }}
                  editable={!loading}
                  maxLength={50}
                />

              </View>

              {nameError ? (
                <Text style={styles.errorText}>
                  {nameError}
                </Text>
              ) : null}

            </View>
          )}

          {/* EMAIL */}

          <View style={styles.formGroup}>

            <Text style={styles.label}>
              Work Email
            </Text>

            <View
              style={[
                styles.inputContainer,
                emailError
                  ? styles.inputError
                  : null,
              ]}
            >

              <Text style={styles.inputIcon}>
                ✉️
              </Text>

              <TextInput
                style={styles.input}
                placeholder="your.email@company.com"
                placeholderTextColor={
                  COLORS.textPlaceholder
                }
                value={email}
                onChangeText={(text) => {
                  setEmail(text);

                  if (validateEmail(text.trim())) {
                    setEmailError('');
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />

            </View>

            {emailError ? (
              <Text style={styles.errorText}>
                {emailError}
              </Text>
            ) : null}

          </View>

          {/* PASSWORD */}

          <View style={styles.formGroup}>

            <View style={styles.passwordHeader}>

              <Text style={styles.label}>
                Password
              </Text>

              {isLogin && (
                <TouchableOpacity>
                  <Text
                    style={
                      styles.forgotPasswordLink
                    }
                  >
                    Forgot?
                  </Text>
                </TouchableOpacity>
              )}

            </View>

            <View
              style={[
                styles.inputContainer,
                passwordError
                  ? styles.inputError
                  : null,
              ]}
            >

              <Text style={styles.inputIcon}>
                🔒
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={
                  COLORS.textPlaceholder
                }
                value={password}
                onChangeText={(text) => {
                  setPassword(text);

                  if (text.length >= 6) {
                    setPasswordError('');
                  }
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(!showPassword)
                }
                disabled={!password}
              >

                <Text style={styles.eyeIcon}>
                  {showPassword
                    ? '👁️'
                    : '👁️‍🗨️'}
                </Text>

              </TouchableOpacity>

            </View>

            {passwordError ? (
              <Text style={styles.errorText}>
                {passwordError}
              </Text>
            ) : null}

          </View>

          {/* SERVER ERROR */}

          {error && (
            <View
              style={
                styles.serverErrorContainer
              }
            >
              <Text
                style={styles.serverErrorText}
              >
                ⚠️ {error}
              </Text>
            </View>
          )}

          {/* SUBMIT BUTTON */}

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading
                ? styles.submitButtonDisabled
                : null,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >

            {loading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.background}
              />
            ) : (
              <Text
                style={styles.submitButtonText}
              >
                {isLogin
                  ? 'LOGIN'
                  : 'CREATE ACCOUNT'}
              </Text>
            )}

          </TouchableOpacity>

        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <View style={styles.footerSection}>

          <View style={styles.toggleContainer}>

            <Text style={styles.toggleText}>
              {isLogin
                ? 'New user? '
                : 'Already have an account? '}
            </Text>

            <TouchableOpacity
              onPress={toggleAuthMode}
              disabled={loading}
            >

              <Text style={styles.toggleLink}>
                {isLogin
                  ? 'Register'
                  : 'Login'}
              </Text>

            </TouchableOpacity>

          </View>

          {/* TERMS */}

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.termsLink}>
              Privacy Policy
            </Text>
          </Text>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  // ===================================================
  // HEADER
  // ===================================================

  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },

  logoContainer: {
    marginBottom: 20,
  },

  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor:
      COLORS.primaryLightest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  logoIcon: {
    fontSize: 40,
  },

  logoImage: {
    width: 50,
    height: 50,
  },

  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },

  appTagline: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primaryLight,
    marginBottom: 24,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },

  subtitleText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },

  // ===================================================
  // FORM
  // ===================================================

  formSection: {
    marginBottom: 30,
  },

  formGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    height: 50,
  },

  inputError: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight,
  },

  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    paddingVertical: 0,
  },

  eyeIcon: {
    fontSize: 18,
    marginLeft: 8,
  },

  errorText: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 6,
    fontWeight: '500',
  },

  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  forgotPasswordLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // ===================================================
  // SERVER ERROR
  // ===================================================

  serverErrorContainer: {
    backgroundColor: COLORS.accentLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  serverErrorText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },

  // ===================================================
  // SUBMIT BUTTON
  // ===================================================

  submitButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,

    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,

    elevation: 5,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
    letterSpacing: 0.5,
  },

  // ===================================================
  // FOOTER
  // ===================================================

  footerSection: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },

  toggleText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  termsText: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400',
  },

  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },

});
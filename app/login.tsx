import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// Color Scheme - Green Professional Theme
const COLORS = {
  primary: '#1B7B3C', // Deep Green
  primaryLight: '#2FA85F', // Medium Green
  primaryLightest: '#E8F5E9', // Very Light Green
  accent: '#FF6B6B', // Red accent for errors/warnings
  accentLight: '#FFE8E8',
  text: '#212121',
  textLight: '#757575',
  textPlaceholder: '#BDBDBD',
  border: '#E0E0E0',
  background: '#FFFFFF',
  success: '#4CAF50',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [nameError, setNameError] = useState('');

  const { signIn, signUp, loading, error, clearError } = useAuth();
  const router = useRouter();

  const validateEmail = (emailValue: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setNameError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

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

  const handleSubmit = async () => {
    clearError();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        // ✅ LOGIN
        await signIn(email, password);
        
        // ✅ Navigate to main app after successful login
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
        
      } else {
        // ✅ SIGNUP
        await signUp(email, password, name);
        
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
              },
            },
          ]
        );
      }
    } catch (err: any) {
      console.error('❌ Submit error:', err);
      Alert.alert('Error', err.message || error || 'Something went wrong');
    }
  };

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🧪</Text>
            </View>
          </View>
          <Text style={styles.appName}>ChemMaintain</Text>
          <Text style={styles.appTagline}>Chemical Stock Maintain App</Text>
          <Text style={styles.welcomeText}>
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </Text>
          <Text style={styles.subtitleText}>
            {isLogin ? 'Sign in to your work account' : 'Join us to manage your chemical inventory'}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Name Field (for signup) */}
          {!isLogin && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputContainer, nameError && styles.inputError]}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (text.trim().length >= 3) setNameError('');
                  }}
                  editable={!loading}
                  maxLength={50}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>
          )}

          {/* Email Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Work Email</Text>
            <View style={[styles.inputContainer, emailError && styles.inputError]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@company.com"
                placeholderTextColor={COLORS.textPlaceholder}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validateEmail(text)) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Field */}
          <View style={styles.formGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              {isLogin && (
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordLink}>Forgot?</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.inputContainer, passwordError && styles.inputError]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textPlaceholder}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (text.length >= 6) setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={!password}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          {/* Server Error */}
          {error && (
            <View style={styles.serverErrorContainer}>
              <Text style={styles.serverErrorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Social logins removed as requested */}
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin ? "New user? " : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={toggleAuthMode} disabled={loading}>
              <Text style={styles.toggleLink}>
                {isLogin ? 'Register' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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

  // Header Section
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
    backgroundColor: COLORS.primaryLightest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  logoIcon: {
    fontSize: 40,
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

  // Form Section
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

  // Server Error
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

  // Submit Button
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
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

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Social Buttons
  socialButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Footer Section
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

// sk 

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { Scissors, Mail, Lock } from 'lucide-react-native';
import { COLORS } from '../../../styles/colors';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useAlert } from '../../../app/providers/AlertProvider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signIn, signUp } = useAuth();
  const { showAlert } = useAlert();

  const validateEmail = (text: string) => {
    setEmail(text);
    if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      setEmailError('Email inválido');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    if (text && text.length < 6 && isSignUp) {
      setPasswordError('Mínimo 6 caracteres');
    } else {
      setPasswordError('');
    }
  };

  const handleAuth = async () => {
    setError('');
    
    // Validations
    if (!email) {
      setEmailError('Email é obrigatório');
      return;
    }
    if (!password) {
      setPasswordError('Senha é obrigatória');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Email inválido');
      return;
    }
    if (isSignUp && password.length < 6) {
      setPasswordError('Mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        showAlert('Sucesso', 'Conta criada com sucesso! Faça login agora.', 'success');
        setEmail('');
        setPassword('');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Falha na autenticação';
      setError(errorMessage);
      showAlert('Erro de Autenticação', errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header com Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Scissors color={COLORS.gold} size={48} />
          </View>
          <Text style={styles.title}>Barber Pro</Text>
          <Text style={styles.subtitle}>Gestão de Barbearia</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {isSignUp ? 'Criar Conta' : 'Fazer Login'}
          </Text>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrapper, emailError ? styles.inputError : {}]}>
              <Mail color={emailError ? COLORS.orange : COLORS.zinc500} size={18} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={COLORS.zinc500}
                value={email}
                onChangeText={validateEmail}
                editable={!isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {emailError && <Text style={styles.fieldError}>{emailError}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={[styles.inputWrapper, passwordError ? styles.inputError : {}]}>
              <Lock color={passwordError ? COLORS.orange : COLORS.zinc500} size={18} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.zinc500}
                value={password}
                onChangeText={validatePassword}
                editable={!isLoading}
                secureTextEntry
              />
            </View>
            {passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
          </View>

          {/* Auth Button */}
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Criar Conta' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Auth Mode */}
          <TouchableOpacity
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setEmailError('');
              setPasswordError('');
            }}
            disabled={isLoading}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? '👤 Já tem conta? Faça login'
                : '✏️ Não tem conta? Crie uma'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isSignUp
              ? '📧 Um email de confirmação será enviado'
              : '🔐 Dados seguros com Supabase'}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.gold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.zinc500,
  },
  form: {
    width: '100%',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.foreground,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: `${COLORS.orange}20`,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.foreground,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.zinc700,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputError: {
    borderColor: COLORS.orange,
    backgroundColor: `${COLORS.orange}10`,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'System',
  },
  fieldError: {
    color: COLORS.orange,
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  toggleText: {
    textAlign: 'center',
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc800,
  },
  footerText: {
    color: COLORS.zinc500,
    fontSize: 12,
    textAlign: 'center',
  },
});

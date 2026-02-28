import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAlert } from '../context/AlertContext';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const router = useRouter();
  const { login, register } = useAuth();
  const { showAlert } = useAlert();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form States
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async () => {
    if (!id || !password || (mode === 'register' && !name)) {
      showAlert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return;
    }

    setLoading(true);
    try {
      let success = false;
      if (mode === 'login') {
        success = await login(id, password);
      } else {
        success = await register(name, id, password);
        if (success) {
          setMode('login'); // Switch to login after registration
          setId('');
          setPassword('');
          setName('');
        }
      }

      if (success && mode === 'login') {
        router.back();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#bdc3c7" />
          </TouchableOpacity>

          {/* Top Image Section */}
          <View style={styles.imageHeader}>
            <Image
              source={mode === 'login'
                ? require('../assets/images/login_img.png')
                : require('../assets/images/register_img.png')
              }
              style={styles.headerImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.logoContainer}>
            <Text style={styles.title}>
              {mode === 'login' ? 'LOGIN' : 'REGISTER'}
            </Text>
          </View>

          {/* Inputs */}
          <View style={styles.form}>
            {mode === 'register' && (
              <>
                <Text style={styles.label}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ชื่อ-นามสกุล"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </>
            )}

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              placeholder="Email (เช่น user@example.com)"
              value={id}
              onChangeText={setId}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.mainBtn}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.mainBtnText}>
                  {mode === 'login' ? 'SIGN IN' : 'REGISTER'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              <Text style={styles.secondaryBtnText}>
                {mode === 'login' ? 'Register' : 'Login'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    width: '90%',
    backgroundColor: '#F2F2F2', // Slightly warmer light grey
    borderRadius: 35,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 5
  },
  imageHeader: {
    marginTop: -100, // Adjusted to push image further up so card edge is roughly at its center
    marginBottom: 0,
    zIndex: 5,
  },
  headerImage: {
    width: 240,
    height: 140,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '800', // Bold but cleaner
    color: '#2D3436',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#718096', // Slate grey
    marginBottom: 6,
    marginTop: 12,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mainBtn: {
    backgroundColor: '#FF9F0A', // Vibrant Orange
    padding: 16,
    borderRadius: 30, // Pill shaped as per Image 2
    alignItems: 'center',
    marginTop: 25,
    shadowColor: '#FF9F0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  secondaryBtn: {
    backgroundColor: '#4A4A4A', // Dark charcoal grey
    padding: 16,
    borderRadius: 30, // Pill shaped
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});

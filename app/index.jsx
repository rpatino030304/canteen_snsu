import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export const unstable_settings = {
  headerShown: false,
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const BASE_URL = 'http://192.168.1.5:4000';

  const handleLogin = async () => {
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error('Invalid credentials');
      }
      const data = await res.json();
      if (data?.student) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(data.student));
        router.push('/homepage');
      } else {
        setError('Invalid credentials');
      }
    } catch (e) {
      setError('Invalid credentials');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.snsu}><Text style={styles.snsuBold}>SNSU</Text> <Text style={styles.canteen}>CANTEEN</Text></Text>
        <Text style={styles.subtitle}>Surigao Del Norte State University Canteen</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>EMAIL:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#b2ffb2"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>PASSWORD:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#b2ffb2"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>LOG IN</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/images/snsu.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.footer}>SURIGAO DEL NORTE STATE UNIVERSITY</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#39FF14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    width: '100%',
    marginBottom: 30,
    marginTop: 40,
    alignItems: 'flex-start',
  },
  snsu: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    flexDirection: 'row',
  },
  snsuBold: {
    color: '#CFFF04',
    fontWeight: 'bold',
  },
  canteen: {
    fontStyle: 'italic',
    color: '#fff',
    fontWeight: '300',
  },
  subtitle: {
    color: '#3ad13a',
    fontSize: 13,
    marginTop: 2,
    marginLeft: 2,
  },
  form: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    color: '#111',
  },
  error: {
    color: '#cc0000',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFFF00',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#39FF14',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoContainer: {
    position: 'absolute',
    right: 0,
    bottom: 80,
    opacity: 0.25,
  },
  logo: {
    width: 180,
    height: 180,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: '#ccc',
    fontWeight: 'bold',
    fontSize: 13,
    opacity: 0.7,
  },
});

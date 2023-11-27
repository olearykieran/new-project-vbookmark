import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Image} from 'react-native';
import {signInWithGoogle} from './AuthService';

const LoginScreen = () => {
  // In your component
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      console.log('Google Sign-In Successful');
      // Navigate or update state as needed
    } catch (error) {
      console.error('Google Sign-In Error', error);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#333333']} style={styles.container}>
      <Image source={require('./images/vbtitle.png')} style={styles.logo} />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Login</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Sign In with Google</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    borderColor: '#fbfbfb',
    padding: 10,
    width: '80%',
    borderRadius: 5,
    backgroundColor: '#222222',
    color: '#f0f0f0',
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 5,
    margin: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default LoginScreen;

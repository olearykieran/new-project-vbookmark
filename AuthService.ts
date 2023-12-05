import {GoogleSignin} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules} from 'react-native';
const {UserDefaultsManager} = NativeModules;
import Config from 'react-native-config';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {jwtDecode} from 'jwt-decode';
import base64 from 'base64-js';

GoogleSignin.configure({
  iosClientId: Config.IOS_CLIENT_ID,
});

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    console.log('User Info:', userInfo);

    // Save the user ID right after signing in
    await AsyncStorage.setItem('userID', userInfo.user.id);
    await UserDefaultsManager.saveUserID(userInfo.user.id);

    console.log('UserID saved successfully.');
    return userInfo; // Return the userInfo object here
  } catch (error) {
    console.error('Google Sign-In Error', error);
    return null; // Return null in case of error
  }
}

export async function signOut() {
  try {
    await GoogleSignin.revokeAccess(); // Optional: remove access
    await GoogleSignin.signOut();
    // Clear the user ID from shared UserDefaults
    await AsyncStorage.removeItem('userID');
    UserDefaultsManager.clearUserID()
      .then(() => {
        console.log('UserID cleared successfully.');
      })
      .catch(error => {
        console.error('Failed to clear UserID', error);
      });
  } catch (error) {
    console.error('Google Sign-Out Error', error);
  }
}

async function verifyIdentityTokenWithServer(identityToken) {
  const serverUrl = 'http://192.168.0.5:8888/.netlify/functions/auth-apple'; // Replace 192.168.x.x with your actual IP

  try {
    // Replace the URL with your Netlify function endpoint
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({identityToken}),
    });

    if (!response.ok) {
      throw new Error('Server verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying identity token:', error);
    return null;
  }
}

export async function signInWithApple() {
  if (!appleAuth.isSupported) {
    console.error('Apple Sign-In is not supported on this device.');
    return;
  }

  try {
    console.log('Apple Sign-In Operation:', appleAuth.Operation.LOGIN);

    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [],
    });

    // Log the entire appleAuthRequestResponse object for inspection
    console.log('Apple Sign-In Response:', appleAuthRequestResponse);

    // Check if the email is defined before saving it
    if (appleAuthRequestResponse) {
      const appleUserID = appleAuthRequestResponse.user;
      console.log('Apple Sign-In userID:', appleUserID); // Log the email
      await AsyncStorage.setItem('userID', appleUserID);

      UserDefaultsManager.saveUserID(appleUserID)
        .then(() => console.log('UserID saved successfully.'))
        .catch(error => console.error('Failed to save UserID', error));

      console.log('Apple Sign-In successful');
      return {appleUserID}; // Return only the Apple User I
    } else {
      console.error('Apple Sign-In failed - no email returned');
      return null;
    }
  } catch (error) {
    console.error('Apple Sign-In Error:', error);
    return null;
  }
}

export async function signOutApple() {
  try {
    // Clear the user data from AsyncStorage or your choice of storage
    // Example: await AsyncStorage.removeItem('appleUserID');
    await AsyncStorage.removeItem('userID');
    UserDefaultsManager.clearUserID();

    console.log('User signed out from Apple');
  } catch (error) {
    console.error('Apple Sign-Out Error:', error);
  }
}

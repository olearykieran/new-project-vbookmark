import {GoogleSignin} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules} from 'react-native';
const {UserDefaultsManager} = NativeModules;
import Config from 'react-native-config';
import {appleAuth} from '@invertase/react-native-apple-authentication';

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
      requestedScopes: [], // Remove scopes if not needed
    });

    const {identityToken} = appleAuthRequestResponse;

    if (!identityToken) {
      console.error('Apple Sign-In failed - no identity token returned');
      return;
    }

    // Send the identityToken to your server for verification
    const verifiedUser = await verifyIdentityTokenWithServer(identityToken);
    if (!verifiedUser) {
      console.error('Failed to verify identity token with server');
      return;
    }

    // Save the user ID similarly to Google Sign-In
    const userId = verifiedUser.id; // Assuming your server returns a user object with an 'id' field
    await AsyncStorage.setItem('userID', userId);
    UserDefaultsManager.saveUserID(userId)
      .then(() => console.log('UserID saved successfully.'))
      .catch(error => console.error('Failed to save UserID', error));

    console.log('Apple Sign-In successful:', verifiedUser);
    return verifiedUser;
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

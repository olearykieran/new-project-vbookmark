import {GoogleSignin} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NativeModules} from 'react-native';
const {UserDefaultsManager} = NativeModules;
import Config from 'react-native-config';

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
    UserDefaultsManager.saveUserID(userInfo.user.id)
      .then(() => {
        console.log('UserID saved successfully.');
      })
      .catch(error => {
        console.error('Failed to save UserID', error);
      });
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

import {GoogleSignin} from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

GoogleSignin.configure({
  /* webClientId:
    '1002687147571-d1v8i9abev7ugnt26uafienip8b6v7qv.apps.googleusercontent.com', */
  iosClientId:
    '274554538083-5b0o333cqqrhobemmp7o6h1cf10dvnq2.apps.googleusercontent.com',
});

export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    console.log('User Info:', userInfo);
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
  } catch (error) {
    console.error('Google Sign-Out Error', error);
  }
}

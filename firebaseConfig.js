// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {initializeAuth, getReactNativePersistence} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDBnpcGMx-Nm-ZWuefYU-lcX9FZbLLF2Zo',
  authDomain: 'videobookmark-84772.firebaseapp.com',
  projectId: 'videobookmark-84772',
  storageBucket: 'videobookmark-84772.appspot.com',
  messagingSenderId: '274554538083',
  appId: '1:274554538083:web:9247d5bf95fe8ded081056',
  clientId:
    '1002687147571-d1v8i9abev7ugnt26uafienip8b6v7qv.apps.googleusercontent.com',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);

// Export the initialized Firebase app, auth, and db instances
export {app, auth, db};

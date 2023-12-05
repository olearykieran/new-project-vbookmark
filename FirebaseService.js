import {app} from './firebaseConfig';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  limit,
  doc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';

const db = getFirestore(app);

export const addBookmark = async (bookmark, userID) => {
  try {
    const bookmarksCollectionRef = collection(db, 'Bookmarks');
    const newBookmarkRef = await addDoc(bookmarksCollectionRef, {
      ...bookmark,
      userID,
      created: new Date(), // Use Firebase server timestamp if available
    });
    return newBookmarkRef.id; // Return the new bookmark ID
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
};

export const getBookmarks = async userID => {
  try {
    if (!userID) {
      console.warn('No userID provided for fetching bookmarks.');
      return []; // Return an empty array if userID is undefined
    }

    const q = query(
      collection(db, 'Bookmarks'),
      where('userID', '==', userID),
      orderBy('created', 'desc'),
      limit(10),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    } else {
      console.log('No bookmarks found for the user.');
      return []; // Return an empty array if no bookmarks are found
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
};

export const deleteBookmark = async bookmarkId => {
  const db = getFirestore(app);
  const bookmarkRef = doc(db, 'Bookmarks', bookmarkId);
  await deleteDoc(bookmarkRef);
};

export async function checkAndAddUserToFirestore(userID) {
  try {
    const userRef = doc(db, 'users', userID);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // User doesn't exist, so add them
      await setDoc(userRef, {userId: userID});
      console.log('User added to Firestore:', userID);
    } else {
      console.log('User already exists in Firestore:', userID);
    }
  } catch (error) {
    console.error('Error interacting with Firestore:', error);
  }
}

export const deleteAccount = async userID => {
  try {
    // Delete user's document from 'users' collection
    const userRef = doc(db, 'users', userID);
    await deleteDoc(userRef);

    // Optionally, delete related data like bookmarks
    // Note: This assumes bookmarks are directly related to the user ID
    const bookmarksQuery = query(
      collection(db, 'Bookmarks'),
      where('userID', '==', userID),
    );
    const bookmarksSnapshot = await getDocs(bookmarksQuery);
    bookmarksSnapshot.forEach(async bookmarkDoc => {
      await deleteDoc(doc(db, 'Bookmarks', bookmarkDoc.id));
    });

    console.log('User account and related data deleted successfully.');
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

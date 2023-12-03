import {app} from './firebaseConfig';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
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
    const q = query(
      collection(db, 'Bookmarks'),
      where('userID', '==', userID),
      orderBy('created', 'desc'), // Add this line to sort by the 'created' field
      limit(10),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
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

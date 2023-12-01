import React, {useState} from 'react';
import {useEffect} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Image} from 'react-native';
import {signInWithGoogle, signOut} from './AuthService';
import {getBookmarks, addBookmark, deleteBookmark} from './FirebaseService.js';
import {Linking} from 'react-native';

const LoginScreen = () => {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  // In your component
  const handleGoogleLogin = async () => {
    const userInfo = await signInWithGoogle();
    if (userInfo) {
      console.log('Google Sign-In Successful');
      setUser(userInfo.user); // Update this line to setUser(userInfo.user)
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(); // Implement this function to sign out from Google
      setUser(null); // Clear the user info from state
    } catch (error) {
      console.error('Sign-Out Error', error);
    }
  };

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (user) {
        try {
          const bookmarks = await getBookmarks(user.id);
          const updatedBookmarks = [];

          for (const bookmark of bookmarks) {
            // Check the "source" field to determine the source of the bookmark
            if (bookmark.source === 'iOS') {
              // Append the timestamp as needed for iOS bookmarks
              // Assuming you want to append it as a query parameter
              const timestamp = bookmark.created.toDate().getTime();
              const urlWithTimestamp = `${bookmark.url}?timestamp=${timestamp}`;

              // Create a new bookmark object with the updated URL
              const updatedBookmark = {...bookmark, url: urlWithTimestamp};
              updatedBookmarks.push(updatedBookmark);
            } else {
              // For non-iOS bookmarks, keep them as is
              updatedBookmarks.push(bookmark);
            }
          }

          setBookmarks(updatedBookmarks);
        } catch (error) {
          console.error('Error fetching bookmarks:', error);
        }
      }
    };

    fetchBookmarks();
  }, [user]);

  // Add a function to handle adding a new bookmark
  const handleAddBookmark = async bookmarkData => {
    try {
      const bookmarkId = await addBookmark(bookmarkData, user.id);
      console.log('Bookmark added with ID:', bookmarkId);
      // Optionally refresh the bookmarks list
      const updatedBookmarks = await getBookmarks(user.id);
      setBookmarks(updatedBookmarks);
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  const handleDeleteBookmark = async bookmarkId => {
    try {
      await deleteBookmark(bookmarkId); // Implement this function to delete from Firestore
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    }
  };

  const secondsToHMS = seconds => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = num => (num < 10 ? `0${num}` : num);

    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const handleOpenLink = url => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <LinearGradient colors={['#000000', '#333333']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Wrap content in ScrollView */}
        <Image source={require('./images/vbtitle.png')} style={styles.logo} />
        {user ? (
          <View>
            <Text style={styles.title}>Logged in as {user.email}</Text>
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
            <View style={styles.bookmarkListHeader}>
              <Text style={styles.bookmarksHeader}>Bookmarks</Text>
              {bookmarks.map((bookmark, index) => (
                <View key={bookmark.id} style={styles.bookmarkContainer}>
                  <TouchableOpacity
                    onPress={() => handleOpenLink(bookmark.url)}>
                    <Text style={styles.bookmarkTitle}>{bookmark.title}</Text>
                  </TouchableOpacity>
                  <Image
                    source={{uri: bookmark.thumbnail}}
                    style={styles.thumbnail}
                  />
                  <Text style={styles.bookmarkNumber}>{index + 1}</Text>
                  <Text style={styles.bookmarkTime}>
                    {secondsToHMS(bookmark.time)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteBookmark(bookmark.id)}
                    style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Login</Text>
            <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
              <Text style={styles.buttonText}>Sign In with Google</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    textAlign: 'center',
  },
  headerContainer: {
    marginBottom: 50,
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    textAlign: 'center',
    marginBottom: 50,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookmarkContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // 50% transparent white
    borderRadius: 5,
    padding: 20,
    marginVertical: 5,
    textAlign: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  bookmarkTitle: {
    color: '#f0f0f0',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookmarkTime: {
    color: '#f0f0f0',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    width: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    alignItems: 'center',
  },
  scrollView: {
    width: '100%', // Ensure ScrollView takes the full width
  },
  bookmarksHeader: {
    color: 'white',
    textAlign: 'center',
    fontSize: 36,
    fontWeight: 'bold',
  },
  thumbnail: {
    width: 100, // set a specific width
    height: 100, // set a specific height
    resizeMode: 'contain', // or 'cover' depending on what you need
    alignSelf: 'center',
  },
});

export default LoginScreen;

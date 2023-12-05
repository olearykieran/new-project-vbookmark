import React, {useState} from 'react';
import {useEffect} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  signInWithGoogle,
  signInWithApple,
  signOutApple,
  signOut,
} from './AuthService';
import {getBookmarks, addBookmark, deleteBookmark} from './FirebaseService.js';
import {AppleButton} from '@invertase/react-native-apple-authentication';

const LoginScreen = () => {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Function to show an alert
  const showAlert = (title, message) => {
    Alert.alert(title, message, [{text: 'OK'}], {cancelable: true});
  };

  // Function to handle the sharing of a bookmark
  const handleShare = async url => {
    try {
      await Share.share({
        message: `Check out this bookmark: ${url}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  // In your component
  const handleGoogleLogin = async () => {
    const userInfo = await signInWithGoogle();
    if (userInfo) {
      console.log('Google Sign-In Successful');
      setUser({...userInfo.user, provider: 'google'}); // Update state with user info
    }
  };

  const handleSignOut = async () => {
    try {
      if (user && user.provider === 'google') {
        await signOut(); // Google sign-out
      } else if (user && user.provider === 'apple') {
        // Apple sign-out
        await signOutApple();
        console.log('UserID cleared successfully.');
      }
      setUser(null); // Clear the user info from state
    } catch (error) {
      console.error('Sign-Out Error', error);
      if (error.message.includes('Failed to clear UserID')) {
        console.error('Failed to clear UserID', error);
      }
    }
  };

  const handleAppleLogin = async () => {
    const userInfo = await signInWithApple();
    if (userInfo) {
      console.log('Apple Sign-In Successful');
      setUser({
        appleUserId: userInfo.appleUserID,
        provider: 'apple',
      });
    }
  };

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (user) {
        setIsLoading(true); // Start loading
        const userId = user.provider === 'google' ? user.id : user.appleUserId;
        try {
          console.log('Fetching bookmarks for user:', userId);
          let bookmarks = await getBookmarks(userId);

          // Sort bookmarks by creation time in descending order
          bookmarks.sort((a, b) => b.created.seconds - a.created.seconds);

          const updatedBookmarks = bookmarks.map(bookmark => {
            const videoTimestampInSeconds = Math.floor(bookmark.time);
            const separator = bookmark.url.includes('?') ? '&' : '?';
            const urlWithTimestamp = `${bookmark.url}${separator}t=${videoTimestampInSeconds}s`;
            console.log('Updated URL with timestamp:', urlWithTimestamp);
            return {...bookmark, url: urlWithTimestamp};
          });

          console.log('Updated bookmarks:', updatedBookmarks);
          setBookmarks(updatedBookmarks);
        } catch (error) {
          console.error('Error fetching bookmarks:', error);
        }
        setIsLoading(false); // Stop loading after fetching
      }
    };

    fetchBookmarks();
  }, [user]);

  const refreshBookmarks = async () => {
    if (user) {
      setRefreshing(true); // Start refreshing
      const userId = user.provider === 'google' ? user.id : user.appleUserId;
      try {
        console.log('Refreshing bookmarks for user:', userId);
        let newBookmarks = await getBookmarks(userId);

        // Sort bookmarks by creation time in descending order
        newBookmarks.sort((a, b) => b.created.seconds - a.created.seconds);

        const updatedBookmarks = newBookmarks.map(bookmark => {
          const videoTimestampInSeconds = Math.floor(bookmark.time);
          const separator = bookmark.url.includes('?') ? '&' : '?';
          const urlWithTimestamp = `${bookmark.url}${separator}t=${videoTimestampInSeconds}s`;
          console.log('Updated URL with timestamp:', urlWithTimestamp);
          return {...bookmark, url: urlWithTimestamp};
        });

        console.log('Refreshed bookmarks:', updatedBookmarks);
        setBookmarks(updatedBookmarks); // Update state with new bookmarks
      } catch (error) {
        console.error('Error refreshing bookmarks:', error);
      }
      setRefreshing(false); // Stop refreshing
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refreshBookmarks().finally(() => setRefreshing(false));
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
      await deleteBookmark(bookmarkId);
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      showAlert('Deleted', 'Bookmark deleted successfully.'); // Show alert on successful delete
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      showAlert('Error', 'Failed to delete bookmark.'); // Show alert on error
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Image source={require('./images/vbtitle.png')} style={styles.logo} />
        {user ? (
          <View>
            <Text style={styles.title}>
              Logged in as{' '}
              {user && (user.provider === 'apple' ? 'Apple User' : user.email)}
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
            <View style={styles.bookmarkListHeader}>
              <Text style={styles.bookmarksHeader}>My Bookmarks</Text>
              {isLoading ? (
                <ActivityIndicator size="large" color="#ffffff" />
              ) : bookmarks.length > 0 ? (
                bookmarks.map((bookmark, index) => (
                  <View key={bookmark.id} style={styles.bookmarkContainer}>
                    <TouchableOpacity
                      onPress={() => handleOpenLink(bookmark.url)}
                      onLongPress={() => handleShare(bookmark.url)}>
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
                ))
              ) : (
                <Text style={styles.title}>No Bookmarks Saved</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Login</Text>
            <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
              <Text style={styles.buttonText}>Sign In with Google</Text>
            </TouchableOpacity>
            <AppleButton
              buttonStyle={AppleButton.Style.BLACK}
              buttonType={AppleButton.Type.SIGN_IN}
              style={{
                width: 140,
                height: 40,
              }}
              onPress={handleAppleLogin}
            />
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

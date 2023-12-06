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
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  signInWithGoogle,
  signInWithApple,
  signOutApple,
  signOut,
} from './AuthService';
import {
  getBookmarks,
  addBookmark,
  deleteBookmark,
  deleteAccount,
} from './FirebaseService.js';
import {AppleButton} from '@invertase/react-native-apple-authentication';

const LoginScreen = () => {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [showRefreshMessage, setShowRefreshMessage] = useState(true); // New state to control visibility

  // Function to show an alert
  const showAlert = (title, message) => {
    Alert.alert(title, message, [{text: 'OK'}], {cancelable: true});
  };

  const handleDismissRefreshMessage = () => {
    setShowRefreshMessage(false); // Function to hide the message
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

  const handleDeleteAccount = async () => {
    // Confirm before deleting
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'OK',
          onPress: async () => {
            if (user) {
              const userId =
                user.provider === 'google' ? user.id : user.appleUserId;
              try {
                await deleteAccount(userId);
                setUser(null); // Clear the user info from state after deleting account
                showAlert('Deleted', 'Account deleted successfully.');
              } catch (error) {
                console.error('Failed to delete account', error);
                showAlert('Error', 'Failed to delete account.');
              }
            }
          },
        },
      ],
      {cancelable: false},
    );
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
            {user && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setAccountSettingsVisible(true)}>
                <Text style={styles.buttonText}>Account Settings</Text>
              </TouchableOpacity>
            )}
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
                    {bookmark.note && (
                      <Text style={styles.bookmarkNote}>{bookmark.note}</Text>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeleteBookmark(bookmark.id)}
                      style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.welcomeMessage}>
                  <Text style={styles.welcomeTitle}>
                    No Bookmarks Saved Yet
                  </Text>
                  <Text style={styles.welcomeText}>
                    Welcome to Video Bookmark! Currently, our app is designed to
                    work seamlessly with the YouTube app on iPhone. Here's how
                    to save your first bookmark:
                  </Text>
                  <Text style={styles.welcomeStep}>
                    1. Open the YouTube app on your iPhone.
                  </Text>
                  <Text style={styles.welcomeStep}>
                    2. Find the video you want to bookmark.
                  </Text>
                  <Text style={styles.welcomeStep}>
                    3. Tap the Share button below the video.
                  </Text>
                  <Text style={styles.welcomeStep}>
                    4. In the share options, select Video Bookmark. (You might
                    need to tap on 'More' to find it.)
                  </Text>
                  <Text style={styles.welcomeStep}>
                    5. Enter the timestamp for the bookmark.
                  </Text>
                  <Text style={styles.welcomeStep}>6. Press Save.</Text>
                  <Text style={styles.welcomeText}>
                    That's it! Your bookmark will be saved and ready for you to
                    access anytime in the Video Bookmark app.
                  </Text>
                </View>
              )}
            </View>
            <AccountSettingsModal
              isVisible={isAccountSettingsVisible}
              onClose={() => setAccountSettingsVisible(false)}
              onSignOut={handleSignOut}
              onDeleteAccount={handleDeleteAccount}
            />
            {showRefreshMessage && (
              <View style={styles.refreshBanner}>
                <Text style={styles.refreshText}>
                  1. Pull down to refresh the page after saving a new bookmark.
                </Text>
                <Text style={styles.refreshText}>
                  2. Click the title of the saved bookmark to be taken to your
                  video at the timestamp saved.
                </Text>
                <Text style={styles.refreshText}>
                  3. You can also share the timestamped video with your friends
                  by long pressing on the title of your saved bookmark. Enjoy!
                </Text>
                <TouchableOpacity
                  onPress={handleDismissRefreshMessage}
                  style={styles.dismissButton}>
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}
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

const AccountSettingsModal = ({
  isVisible,
  onClose,
  onSignOut,
  onDeleteAccount,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.centeredModalView}>
        <LinearGradient
          colors={['#000000', '#333333']}
          style={styles.modalView}>
          <TouchableOpacity
            style={[styles.modalButton, styles.buttonClose]}
            onPress={() => {
              onSignOut();
              onClose();
            }}>
            <Text style={styles.modalButtonText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.buttonClose]}
            onPress={() => {
              onDeleteAccount();
              onClose();
            }}>
            <Text style={styles.modalButtonText}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.buttonClose]}
            onPress={onClose}>
            <Text style={styles.modalButtonText}>Close</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
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
  centeredModalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    margin: 20,
    width: '80%',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    backgroundColor: '#d32f2f', // Or any other color from your app's color scheme
    padding: 10,
    borderRadius: 5,
    margin: 10,
    width: '80%',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bookmarkNote: {
    color: '#f0f0f0',
    fontStyle: 'italic', // Example style, adjust as needed
    textAlign: 'center',
  },
  welcomeMessage: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
  welcomeStep: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
  },
  refreshBanner: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
    color: 'white',
    marginTop: 60,
  },
  refreshText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  dismissButton: {
    marginTop: 5,
    backgroundColor: '#555', // Adjust as needed
    borderRadius: 5,
    padding: 5,
  },
  dismissButtonText: {
    color: 'white',
    fontSize: 12,
  },
});

export default LoginScreen;

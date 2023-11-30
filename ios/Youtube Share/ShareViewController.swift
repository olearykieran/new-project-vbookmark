import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers
import Firebase

class ShareViewController: UIViewController {
  
  


  // This function is called when the Post button is pressed
      @IBAction func postButtonPressed(_ sender: UIButton) {
          didSelectPost()
      }

      // This function is called when the Cancel button is pressed
      @IBAction func cancelButtonPressed(_ sender: UIButton) {
          extensionContext?.cancelRequest(withError: NSError())
      }

    func didSelectPost() {
        // This is called after the user selects Post. Do the upload of content here.
        FirebaseApp.configure()
        if let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem {
            if let itemProviders = extensionItem.attachments {
                for itemProvider in itemProviders {
                    if itemProvider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                        itemProvider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil, completionHandler: { (item, error) in
                            if let url = item as? URL {
                                print("URL received: \(url)")
                                self.saveBookmarkToFirebase(url: url)
                            } else if let error = error {
                                print("Error loading item: \(error)")
                            }
                        })
                    }
                }
            }
        }
        
        // Signal that we are done with the request
        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
  private func saveBookmarkToFirebase(url: URL) {
      // Retrieve the 'userID' from UserDefaults
      if let userDefaults = UserDefaults(suiteName: "group.com.holygrail.bookmark") {
          if let userID = userDefaults.string(forKey: "userID") {
              // If userID is found, proceed to save the bookmark
              let bookmarksCollectionRef = Firestore.firestore().collection("Bookmarks")
              
              // Extract the thumbnail, time, and title from the URL if possible or set defaults
              let thumbnail = "https://img.youtube.com/vi/\(url.lastPathComponent)/0.jpg"
              let time = 0.0 // Replace with actual time if available
              let title = "Video Title" // Replace with actual title if you can extract it
              
              // Creating the bookmark data dictionary
              let bookmarkData: [String: Any] = [
                  "created": Timestamp(date: Date()),
                  "thumbnail": thumbnail,
                  "time": time,
                  "title": title,
                  "url": url.absoluteString,
                  "userID": userID  // Use the userID here
              ]
              
              // Add the bookmark to Firestore
              bookmarksCollectionRef.addDocument(data: bookmarkData) { error in
                  if let error = error {
                      print("Error saving bookmark: \(error)")
                  } else {
                      print("Bookmark saved successfully")
                  }
              }
          } else {
              // Handle the case where userID is not found
              print("UserID not found in UserDefaults")
          }
      }
  }
    // Other necessary overrides...
}

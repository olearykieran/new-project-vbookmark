import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers
import Firebase
import Alamofire
import KeychainSwift

struct YoutubeVideo {
  let title: String
  // Add other properties as needed
}

class ShareViewController: UIViewController {
  // URL to be processed
  var sharedURL: URL?
  
  var apiKey: String?
  
  var timeInSeconds: Int = 0
  
  @IBOutlet weak var hoursTextField: UITextField!
  @IBOutlet weak var minutesTextField: UITextField!
  @IBOutlet weak var secondsTextField: UITextField!
  
  private func showAlert(title: String, message: String, completion: (() -> Void)? = nil) {
    let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
    alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
      completion?() // Call completion handler when the alert is dismissed
    })
    self.present(alert, animated: true, completion: nil)
  }
  
  override func viewDidLoad() {
    super.viewDidLoad()
    
    apiKey = KeychainManager.shared.getAPIKey() ?? ""

    // Set default values
    hoursTextField.text = "0"
    minutesTextField.text = "0"
    secondsTextField.text = "0"
    
    // Configure Firebase once when the view loads
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
      print("Firebase configured in Share Extension.")
    } else {
      print("Firebase already configured.")
    }
    
    // Check for shared content immediately when the view is loaded
    if let extensionItem = extensionContext?.inputItems.first as? NSExtensionItem {
      processSharedContent(extensionItem)
    }
    
    // Add tap gesture to dismiss keyboard
    let tapGesture = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
    view.addGestureRecognizer(tapGesture)
  }
  
  @objc private func dismissKeyboard() {
    view.endEditing(true)
  }
  
  private func processSharedContent(_ extensionItem: NSExtensionItem) {
    if let itemProviders = extensionItem.attachments {
      for itemProvider in itemProviders {
        print("Registered type identifiers: \(itemProvider.registeredTypeIdentifiers)")
        
        if itemProvider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
          itemProvider.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] (item, error) in
            DispatchQueue.main.async {
              if let text = item as? String {
                print("Plain text received: \(text)")
                self?.handlePlainText(text)
              } else if let error = error {
                print("Error loading plain text item: \(error)")
              }
            }
          }
        } else {
          print("Item provider does not conform to expected type identifiers")
        }
      }
    } else {
      print("No item providers found in extension item")
    }
  }
  
  private func handlePlainText(_ text: String) {
    if let url = extractURL(from: text) {
      print("Extracted URL: \(url)")
      sharedURL = url
    } else {
      print("No URL found in plain text")
    }
  }
  
  private func extractURL(from text: String) -> URL? {
    // Basic URL extraction from text
    // This can be enhanced based on the expected format of the text
    return URL(string: text.trimmingCharacters(in: .whitespacesAndNewlines))
  }
  
  
  
  
  @IBAction func postButtonPressed(_ sender: UIButton) {
    if let url = sharedURL,
       let hoursText = hoursTextField.text,
       let minutesText = minutesTextField.text,
       let secondsText = secondsTextField.text,
       validateTimeInput(hoursText, minutesText, secondsText) {
      
      // Convert hours and minutes input to seconds
      timeInSeconds = convertTimeToSeconds(hoursText, minutesText, secondsText)
      
      saveBookmarkToFirebase(url: url)
    }
  }
  
  func validateTimeInput(_ hours: String, _ minutes: String, _ seconds: String) -> Bool {
    if let hoursValue = Int(hours), let minutesValue = Int(minutes), let secondsValue = Int(seconds),
       hoursValue >= 0, minutesValue >= 0, secondsValue >= 0 {
      return true
    }
    // Handle invalid input (show an alert, error message, etc.)
    return false
  }
  
  
  func convertTimeToSeconds(_ hours: String, _ minutes: String, _ seconds: String) -> Int {
    // Parse hours, minutes, and seconds from input
    let hoursValue = Int(hours) ?? 0
    let minutesValue = Int(minutes) ?? 0
    let secondsValue = Int(seconds) ?? 0
    // Calculate total time in seconds
    return (hoursValue * 3600) + (minutesValue * 60) + secondsValue
  }
  
  
  
  @IBAction func cancelButtonPressed(_ sender: UIButton) {
    let error = NSError(domain: "com.holygrail.YoutubeShareExtensionError", code: 1001, userInfo: [NSLocalizedDescriptionKey: "User cancelled the action"])
    extensionContext?.cancelRequest(withError: error)
  }
  
  func didSelectPost() {
    extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
  }
  
  private func saveBookmarkToFirebase(url: URL) {
    guard let userDefaults = UserDefaults(suiteName: "group.com.holygrail.bookmark"),
          let userID = userDefaults.string(forKey: "userID") else {
      print("UserID not found in UserDefaults")
      showAlert(title: "Login Required",
                message: "Please log in to the Video Bookmark app and try saving the bookmark again.")
      return
    }
    print("User ID retrieved: \(userID)")
    
    // Fetch current bookmarks count
    checkBookmarksLimit(forUserID: userID) { [weak self] allowed in
      guard let self = self else { return }
      
      if allowed {
        self.proceedWithSavingBookmark(url: url, userID: userID)
      } else {
        self.showAlert(title: "Limit Reached",
                       message: "You already have 10 bookmarks saved. Please delete old bookmarks to save new ones.")
      }
    }
  }
  
  private func checkBookmarksLimit(forUserID userID: String, completion: @escaping (Bool) -> Void) {
    let bookmarksCollectionRef = Firestore.firestore().collection("Bookmarks")
    bookmarksCollectionRef.whereField("userID", isEqualTo: userID).getDocuments { (snapshot, error) in
      if let error = error {
        print("Error fetching bookmarks: \(error)")
        completion(true) // Assuming allowed to add if error occurs
      } else if let snapshot = snapshot, snapshot.documents.count >= 10 {
        completion(false) // Limit reached, not allowed to add more
      } else {
        completion(true) // Allowed to add more bookmarks
      }
    }
  }
  
  private func proceedWithSavingBookmark(url: URL, userID: String) {
    let videoID = extractYoutubeVideoID(from: url)
    
    fetchYoutubeVideoDetails(videoID: videoID) { [weak self] result in
      guard let self = self else { return }
      
      switch result {
      case .success(let videoDetails):
        let (video, duration) = videoDetails
        
        if self.timeInSeconds > duration {
          self.showAlert(title: "Error", message: "The bookmark time exceeds the video duration.")
          return
        }
        let thumbnail = "https://img.youtube.com/vi/\(videoID)/0.jpg"
        let bookmarkData: [String: Any] = [
          "created": Timestamp(date: Date()),
          "thumbnail": thumbnail,
          "time": Double(self.timeInSeconds),
          "title": video.title,
          "url": url.absoluteString,
          "userID": userID,
        ]
        self.saveToFirebase(data: bookmarkData) { success, errorMessage in
          DispatchQueue.main.async {
            if success {
              // Bookmark saved successfully, show success message
              self.showAlert(title: "Success", message: "Bookmark saved successfully") {
                self.didSelectPost()
              }
            } else if let errorMessage = errorMessage {
              // Error occurred, show error message
              self.showAlert(title: "Error", message: errorMessage)
            }
          }
        }
        
      case .failure(let error):
        // Handle error, show an error message or handle as appropriate
        self.showAlert(title: "Error", message: error.localizedDescription)
      }
    }
  }
  
  private func convertISO8601DurationToSeconds(_ duration: String) -> Int {
    var hours = 0
    var minutes = 0
    var seconds = 0
    
    let regex = try! NSRegularExpression(pattern: "PT(\\d+H)?(\\d+M)?(\\d+S)?")
    let nsDuration = duration as NSString
    
    let matches = regex.matches(in: duration, range: NSRange(duration.startIndex..., in: duration))
    if let match = matches.first {
      if match.range(at: 1).location != NSNotFound {
        let hourRange = match.range(at: 1)
        hours = Int(nsDuration.substring(with: hourRange).dropLast()) ?? 0
      }
      if match.range(at: 2).location != NSNotFound {
        let minuteRange = match.range(at: 2)
        minutes = Int(nsDuration.substring(with: minuteRange).dropLast()) ?? 0
      }
      if match.range(at: 3).location != NSNotFound {
        let secondRange = match.range(at: 3)
        seconds = Int(nsDuration.substring(with: secondRange).dropLast()) ?? 0
      }
    }
    
    return (hours * 3600) + (minutes * 60) + seconds
  }
  
  
  private func saveToFirebase(data: [String: Any], completion: @escaping (Bool, String?) -> Void) {
    print("Entering saveToFirebase with data: \(data)")
    let bookmarksCollectionRef = Firestore.firestore().collection("Bookmarks")
    bookmarksCollectionRef.addDocument(data: data) { error in
      if let error = error {
        print("Error saving bookmark: \(error)")
        completion(false, error.localizedDescription)
      } else {
        print("Bookmark saved successfully")
        completion(true, nil)
      }
    }
  }
  
  private func fetchYoutubeVideoDetails(videoID: String, completion: @escaping (Result<(YoutubeVideo, Int), Error>) -> Void) {
      let url = "https://www.googleapis.com/youtube/v3/videos?id=\(videoID)&key=\(apiKey!)&part=snippet,contentDetails"
      
      print("Fetching YouTube video details for ID: \(videoID)")
      print("Request URL: \(url)")
      
      AF.request(url).response { response in
          print("Received response for YouTube video details")
          
          switch response.result {
          case .success(let data):
              guard let jsonData = data else {
                  print("No data received in response")
                  completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
                  return
              }
              
              do {
                  let json = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]
                  print("JSON Response: \(String(describing: json))")
                  
                  if let items = json?["items"] as? [[String: Any]],
                     let firstItem = items.first,
                     let snippet = firstItem["snippet"] as? [String: Any],
                     let title = snippet["title"] as? String,
                     let contentDetails = firstItem["contentDetails"] as? [String: Any],
                     let durationString = contentDetails["duration"] as? String {
                      
                      let duration = self.convertISO8601DurationToSeconds(durationString)
                      let video = YoutubeVideo(title: title)
                      completion(.success((video, duration)))
                  } else {
                      print("Video details not found in JSON response")
                      completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Video details not found"])))
                  }
              } catch {
                  print("JSON parsing error: \(error)")
                  completion(.failure(error))
              }
              
          case .failure(let error):
              print("Network request failed: \(error)")
              completion(.failure(error))
          }
      }
  }

  
  private func extractYoutubeVideoID(from url: URL) -> String {
    if let queryItems = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems {
      for item in queryItems where item.name == "v" {
        return item.value ?? ""
      }
    }
    return url.lastPathComponent
  }
}

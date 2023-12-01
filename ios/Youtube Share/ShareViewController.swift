import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers
import Firebase
import Alamofire

struct YoutubeVideo {
    let title: String
    // Add other properties as needed
}

class ShareViewController: UIViewController {
    // URL to be processed
    var sharedURL: URL?
  
    let apiKey = ProcessInfo.processInfo.environment["YOUTUBE_API_KEY"] ?? ""

    override func viewDidLoad() {
        super.viewDidLoad()

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
          extractAndStoreTimestamp(from: url)
          // Further processing as needed
      } else {
          print("No URL found in plain text")
      }
  }

  private func extractURL(from text: String) -> URL? {
      // Basic URL extraction from text
      // This can be enhanced based on the expected format of the text
      return URL(string: text.trimmingCharacters(in: .whitespacesAndNewlines))
  }

  private func extractAndStoreTimestamp(from url: URL) {
      let queryItems = URLComponents(string: url.absoluteString)?.queryItems
      let timeParameter = queryItems?.first(where: { $0.name == "t" })?.value

      // Convert the time parameter to seconds
      let timeInSeconds = convertYouTubeTimeParameterToSeconds(timeParameter)
      print("Extracted Timestamp: \(timeInSeconds) seconds")
      // Store the timestamp for later use
      // ...
  }

  private func convertYouTubeTimeParameterToSeconds(_ timeParameter: String?) -> Int {
      guard let time = timeParameter else { return 0 }

      let timeComponents = time.components(separatedBy: CharacterSet.decimalDigits.inverted)
      let timeNumbers = timeComponents.compactMap { Int($0) }

      switch timeNumbers.count {
      case 1: // Only seconds
          return timeNumbers[0]
      case 2: // Minutes and seconds
          return timeNumbers[0] * 60 + timeNumbers[1]
      default:
          return 0
      }
  }

    @IBAction func postButtonPressed(_ sender: UIButton) {
        if let url = sharedURL {
            saveBookmarkToFirebase(url: url)
        }
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
            return
        }
        print("User ID retrieved: \(userID)")

        let videoID = extractYoutubeVideoID(from: url)
        fetchYoutubeVideoDetails(videoID: videoID) { [weak self] result in
            print("Fetch YouTube Video Details Result: \(result)")
            switch result {
            case .success(let video):
                let thumbnail = "https://img.youtube.com/vi/\(videoID)/0.jpg"
                let bookmarkData: [String: Any] = [
                    "created": Timestamp(date: Date()),
                    "thumbnail": thumbnail,
                    "time": 0.0, // Replace with actual time if available
                    "title": video.title, // Using fetched title
                    "url": url.absoluteString,
                    "userID": userID
                ]
                self?.saveToFirebase(data: bookmarkData) {
                                self?.didSelectPost()
                            }
            case .failure(let error):
                print("Error fetching video details: \(error)")
                self?.didSelectPost()
            }
        }
    }

    private func saveToFirebase(data: [String: Any], completion: @escaping () -> Void) {
        print("Entering saveToFirebase with data: \(data)")
        let bookmarksCollectionRef = Firestore.firestore().collection("Bookmarks")
        bookmarksCollectionRef.addDocument(data: data) { error in
            if let error = error {
                print("Error saving bookmark: \(error)")
            } else {
                print("Bookmark saved successfully")
            }
            completion()
        }
    }
  private func fetchYoutubeVideoDetails(videoID: String, completion: @escaping (Result<YoutubeVideo, Error>) -> Void) {
      print("Starting to fetch video details for ID: \(videoID)")
      let url = "https://www.googleapis.com/youtube/v3/videos?id=\(videoID)&key=\(apiKey)&part=snippet,contentDetails"
      print("Sending request to: \(url)")

      AF.request(url).response { response in
          print("Response received for video details request")
          print("Raw response: \(String(describing: response.data))")
          switch response.result {
          case .success(let data):
              guard let jsonData = data else {
                  print("No data received")
                  completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data received"])))
                  return
              }

              do {
                  let json = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]
                  if let items = json?["items"] as? [[String: Any]],
                     let firstItem = items.first,
                     let snippet = firstItem["snippet"] as? [String: Any],
                     let title = snippet["title"] as? String {
                      let video = YoutubeVideo(title: title)
                      print("Video title: \(title)")
                      completion(.success(video))
                  } else {
                      print("Items or title not found in JSON")
                      completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Items or title not found"])))
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

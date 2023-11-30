import Foundation

@objc(UserDefaultsManager)
class UserDefaultsManager: NSObject {

  @objc(saveUserID:resolver:rejecter:)
  func saveUserID(userID: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let userDefaults = UserDefaults(suiteName: "group.com.holygrail.bookmark") {
      userDefaults.set(userID, forKey: "userID")
      print("UserID saved successfully: \(userID)")
      resolve(true)
    } else {
      print("Error: Unable to access UserDefaults")
      reject("error", "Unable to save userID", nil)
    }
  }

  // React Native module requires to be exported
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

import Foundation

@objc(UserDefaultsManager)
class UserDefaultsManager: NSObject {

  @objc(saveUserID:resolver:rejecter:)
  func saveUserID(userID: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    if let userDefaults = UserDefaults(suiteName: "group.com.holygrail.bookmark") {
      userDefaults.set(userID, forKey: "userID")
      resolve(true)
    } else {
      reject("error", "Unable to save userID", nil)
    }
  }

  // React Native module requires to be exported
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}

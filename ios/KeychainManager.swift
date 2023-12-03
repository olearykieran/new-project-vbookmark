//
//  KeychainManager.swift
//  NewProject
//
//  Created by Kieran on 12/2/23.
//

import Foundation
import KeychainSwift

@objc class KeychainManager: NSObject {
    @objc static let shared = KeychainManager()

    private let keychain = KeychainSwift()

    @objc func setupKeychain() {
        keychain.accessGroup = "group.com.holygrail.bookmark"
        keychain.set("AIzaSyCcS7Z0nnMBvAlk8u4rPkFrqsZZEDyRAQo", forKey: "YOUTUBE_API_KEY")
    }

    @objc func getAPIKey() -> String? {
        return keychain.get("YOUTUBE_API_KEY")
    }
}

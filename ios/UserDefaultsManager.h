//
//  UserDefaultsManager.h
//  NewProject
//
//  Created by Kieran on 11/29/23.
//

#ifndef UserDefaultsManager_h
#define UserDefaultsManager_h

#import <React/RCTBridgeModule.h>

@interface UserDefaultsManager : NSObject <RCTBridgeModule>

// Declare the method signature
- (void)saveUserID:(NSString *)userID
          resolver:(RCTPromiseResolveBlock)resolve
          rejecter:(RCTPromiseRejectBlock)reject;

@end

#endif /* UserDefaultsManager_h */

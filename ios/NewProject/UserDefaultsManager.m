// UserDefaultsManager.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(UserDefaultsManager, NSObject)

RCT_EXTERN_METHOD(saveUserID:(NSString *)userID
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#import <Firebase.h>

@implementation AppDelegate

  
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  @try {
      [FIRApp configure];
      NSLog(@"Firebase configured successfully.");
    }
    @catch (NSException *exception) {
      NSLog(@"Error configuring Firebase: %@", exception.reason);
    }
  
  self.moduleName = @"NewProject";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  
  // Add the print statement here
  NSDictionary* infoDict = [[NSBundle mainBundle] infoDictionary];
  NSString* storyboardName = infoDict[@"NSExtensionMainStoryboard"];
  NSLog(@"Main storyboard: %@", storyboardName);

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end

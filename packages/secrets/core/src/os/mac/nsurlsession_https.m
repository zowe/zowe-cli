#import <Foundation/Foundation.h>
#import <Security/Security.h>

// Structure to hold request parameters
typedef struct {
    const char* hostname;
    uint16_t port;
    const char* path;
    const char* method;
    const char** header_keys;
    const char** header_values;
    size_t header_count;
    const uint8_t* body;
    size_t body_length;
    const char* cert_account;
    bool reject_unauthorized;
    uint64_t timeout_ms;
} HttpsRequestParams;

// Structure to hold response data
typedef struct {
    uint16_t status_code;
    char** header_keys;
    char** header_values;
    size_t header_count;
    uint8_t* body;
    size_t body_length;
    char* error_message;
} HttpsResponseData;

// Delegate class to handle authentication challenges
@interface HttpsDelegate : NSObject <NSURLSessionDelegate, NSURLSessionTaskDelegate>
@property (nonatomic, strong) NSString* certAccount;
@property (nonatomic, assign) BOOL rejectUnauthorized;
@property (nonatomic, strong) NSError* error;
@property (nonatomic, strong) NSMutableData* responseData;
@property (nonatomic, strong) NSHTTPURLResponse* response;
@property (nonatomic, assign) BOOL completed;
@property (nonatomic, strong) NSCondition* condition;
@end

@implementation HttpsDelegate

- (instancetype)initWithCertAccount:(NSString*)certAccount rejectUnauthorized:(BOOL)rejectUnauthorized {
    self = [super init];
    if (self) {
        _certAccount = certAccount;
        _rejectUnauthorized = rejectUnauthorized;
        _responseData = [NSMutableData data];
        _completed = NO;
        _condition = [[NSCondition alloc] init];
    }
    return self;
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didReceiveChallenge:(NSURLAuthenticationChallenge *)challenge
 completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential *))completionHandler {
    
    NSString* authMethod = challenge.protectionSpace.authenticationMethod;
    
    // Handle client certificate authentication
    if ([authMethod isEqualToString:NSURLAuthenticationMethodClientCertificate]) {
        // Search for the identity in the keychain
        NSDictionary* query = @{
            (id)kSecClass: (id)kSecClassIdentity,
            (id)kSecMatchLimit: (id)kSecMatchLimitOne,
            (id)kSecReturnRef: @YES,
            (id)kSecMatchSubjectContains: self.certAccount
        };
        
        CFTypeRef identityRef = NULL;
        OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)query, &identityRef);
        
        if (status == errSecSuccess && identityRef != NULL) {
            SecIdentityRef identity = (SecIdentityRef)identityRef;
            
            // Create credential with the identity
            NSURLCredential* credential = [NSURLCredential credentialWithIdentity:identity
                                                                      certificates:nil
                                                                       persistence:NSURLCredentialPersistenceForSession];
            
            completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
            CFRelease(identityRef);
            return;
        } else {
            self.error = [NSError errorWithDomain:@"HttpsClient"
                                             code:status
                                         userInfo:@{NSLocalizedDescriptionKey: [NSString stringWithFormat:@"Failed to find identity '%@' in keychain (status: %d)", self.certAccount, (int)status]}];
            completionHandler(NSURLSessionAuthChallengeCancelAuthenticationChallenge, nil);
            return;
        }
    }
    
    // Handle server trust (SSL certificate validation)
    if ([authMethod isEqualToString:NSURLAuthenticationMethodServerTrust]) {
        if (!self.rejectUnauthorized) {
            // Accept any certificate (insecure mode)
            NSURLCredential* credential = [NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust];
            completionHandler(NSURLSessionAuthChallengeUseCredential, credential);
        } else {
            // Use default handling (validate certificate)
            completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
        }
        return;
    }
    
    // Default handling for other authentication methods
    completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)dataTask
    didReceiveData:(NSData *)data {
    [self.responseData appendData:data];
}

- (void)URLSession:(NSURLSession *)session
              task:(NSURLSessionTask *)task
didCompleteWithError:(NSError *)error {
    [self.condition lock];
    if (error) {
        self.error = error;
    }
    self.completed = YES;
    [self.condition signal];
    [self.condition unlock];
}

@end

// C function to perform HTTPS request
HttpsResponseData* perform_nsurlsession_request(const HttpsRequestParams* params) {
    @autoreleasepool {
        HttpsResponseData* response = (HttpsResponseData*)calloc(1, sizeof(HttpsResponseData));
        
        // Build URL
        NSString* urlString = [NSString stringWithFormat:@"https://%s:%d%s",
                              params->hostname, params->port, params->path];
        NSURL* url = [NSURL URLWithString:urlString];
        
        if (!url) {
            response->error_message = strdup("Invalid URL");
            return response;
        }
        
        // Create request
        NSMutableURLRequest* request = [NSMutableURLRequest requestWithURL:url];
        request.HTTPMethod = [NSString stringWithUTF8String:params->method];
        
        // Set timeout
        if (params->timeout_ms > 0) {
            request.timeoutInterval = params->timeout_ms / 1000.0;
        }
        
        // Add headers
        for (size_t i = 0; i < params->header_count; i++) {
            NSString* key = [NSString stringWithUTF8String:params->header_keys[i]];
            NSString* value = [NSString stringWithUTF8String:params->header_values[i]];
            [request setValue:value forHTTPHeaderField:key];
        }
        
        // Add body if present
        if (params->body && params->body_length > 0) {
            request.HTTPBody = [NSData dataWithBytes:params->body length:params->body_length];
        }
        
        // Create delegate
        NSString* certAccount = [NSString stringWithUTF8String:params->cert_account];
        HttpsDelegate* delegate = [[HttpsDelegate alloc] initWithCertAccount:certAccount
                                                          rejectUnauthorized:params->reject_unauthorized];
        
        // Create session with delegate
        NSURLSessionConfiguration* config = [NSURLSessionConfiguration ephemeralSessionConfiguration];
        NSURLSession* session = [NSURLSession sessionWithConfiguration:config
                                                              delegate:delegate
                                                         delegateQueue:nil];
        
        // Create and start task
        NSURLSessionDataTask* task = [session dataTaskWithRequest:request
                                                 completionHandler:^(NSData *data, NSURLResponse *urlResponse, NSError *error) {
            [delegate.condition lock];
            if (data) {
                [delegate.responseData appendData:data];
            }
            if (urlResponse) {
                delegate.response = (NSHTTPURLResponse*)urlResponse;
            }
            if (error) {
                delegate.error = error;
            }
            delegate.completed = YES;
            [delegate.condition signal];
            [delegate.condition unlock];
        }];
        
        [task resume];
        
        // Wait for completion
        [delegate.condition lock];
        while (!delegate.completed) {
            [delegate.condition wait];
        }
        [delegate.condition unlock];
        
        // Check for errors
        if (delegate.error) {
            response->error_message = strdup([[delegate.error localizedDescription] UTF8String]);
            [session invalidateAndCancel];
            return response;
        }
        
        // Extract response data
        if (delegate.response) {
            response->status_code = (uint16_t)[delegate.response statusCode];
            
            // Extract headers
            NSDictionary* headers = [delegate.response allHeaderFields];
            response->header_count = [headers count];
            response->header_keys = (char**)calloc(response->header_count, sizeof(char*));
            response->header_values = (char**)calloc(response->header_count, sizeof(char*));
            
            NSUInteger idx = 0;
            for (NSString* key in headers) {
                response->header_keys[idx] = strdup([key UTF8String]);
                response->header_values[idx] = strdup([[headers objectForKey:key] UTF8String]);
                idx++;
            }
            
            // Extract body
            if ([delegate.responseData length] > 0) {
                response->body_length = [delegate.responseData length];
                response->body = (uint8_t*)malloc(response->body_length);
                memcpy(response->body, [delegate.responseData bytes], response->body_length);
            }
        }
        
        [session invalidateAndCancel];
        return response;
    }
}

// C function to free response data
void free_nsurlsession_response(HttpsResponseData* response) {
    if (!response) return;
    
    if (response->header_keys) {
        for (size_t i = 0; i < response->header_count; i++) {
            free(response->header_keys[i]);
        }
        free(response->header_keys);
    }
    
    if (response->header_values) {
        for (size_t i = 0; i < response->header_count; i++) {
            free(response->header_values[i]);
        }
        free(response->header_values);
    }
    
    if (response->body) {
        free(response->body);
    }
    
    if (response->error_message) {
        free(response->error_message);
    }
    
    free(response);
}

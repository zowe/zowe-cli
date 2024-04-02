// shared    (~/.zowe/.events/<project-name>/<event-id>)
// it should create a file to watch on instantiation of the subscription
// it should generate a notification when credential manager is changed
// it should generate a notification when onGlobalConfigChanged is changed
// should generate .event files under a folder with the project name ~/.zowe/.events/<project-name>/<event-id>
// it should generate multiple notifications(3) if multiple subscriptions(3) to the same event
// unsubscribing from subscriptions should not affect another user's subscriptions

// custom    (~/.zowe/.events/<app-name>/<event-id>)
// it should create a file to watch on instantiation of the subscription
// it should generate a notification when a custom event occurs
// should generate .event files under a folder with the app name ~/.zowe/.events/<app-name>/<event-id>
// it should generate multiple notifications(3) if multiple subscription events(3)

// user
// it should create a file to watch on instantiation of the subscription
// it should generate a notification when vault is changed
// it should generate a notification when configuration is changed
// it should generate a notification when schema is changed
// it should generate multiple notifications(3) if multiple subscriptions(3) to the same event

// event emission/file
// event should be written to file with all required properties in IImperativeEventJson
// event details should be written to the correct event file
// deleting a subscription should result in the deletion of the corresponding event file only
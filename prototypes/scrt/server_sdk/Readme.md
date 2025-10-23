This server_sdk folder contains prototype Java classes that are used to record the use of features for SCRT reporting. 

These classes will be added to the following REST API SDK  package.

    com.broadcom.restapi.sdk.jfrs

- The App.java file is a simple driver program that can be compiled and run on a laptop to exercise the basic logic of the ScrtFeatHeaderInterceptor (and indirectly the recordFeatureUse function). Additional build files (not supplied in this folder) are required to actually compile and test the app.
- The JfrsZosWriter.java file contains a new function named recordFeatureUse(). That new function will be added to the existing REST API SDK file located here:

```
libs/security-spring/src/main/java\com\broadcom/restapi/sdk/jfrs/JfrsZosWriter.java
```

- The config/ScrtFeatHeaderConfig.java file is infrastructure used by SpringBoot to configure the ScrtFeatHeaderInterceptor class.
- The config/ScrtFeatHeaderInterceptor.java file contains a class that intercepts HTTP requests, extracts SCRT data from a custom header, and then calls the recordFeatureUse function.
- The config/ScrtProps.java file contains a class to hold SCRT properties which can be passed around by the other various functions.

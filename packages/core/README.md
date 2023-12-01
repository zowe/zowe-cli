# Core package

The Zowe SDK Core package contains functionality that is shared across all other SDK packages, such as `@zowe/zos-files-for-zowe-sdk`.

> [!IMPORTANT]  
> You must install the Core package to satisfy the peer dependency requirement for all other SDK packages.

## Core libraries

The following libraries are included in this package:

* *apiml* - Defines the `Services` class, which facilitates managing services hosted by the Zowe API Mediation Layer. It defines methods to load API ML config data for installed CLI plug-ins, obtain data from the API ML services endpoint, and convert this data to a config JSON file.

* *auth* - Contains the `Login` and `Logout` classes, which let you handle login and logout from the Zowe API Mediation Layer (or other token-based authentication services). Use the functions `Login.apimlLogin` and `Logout.apimlLogout` to store a web token in a local "base profile", which enables a secure connection to the server.

* *rest* - Defines the `ZosmfRestClient` class, which lets you access z/OSMF REST APIs and is an extension of the Imperative CLI Framework `RestClient` class. It provides convenience methods, such as `appendHeaders` and `processError`, that can be used for any z/OSMF request.

* *utils* - Contains miscellaneous utility methods, such as `ProfileUtils.loadDefaultProfile`, which automatically loads the username, host, port, etc... that is defined in your default profile configuration. To learn about all available utilities, refer to the comments in the `core/utils` source code.

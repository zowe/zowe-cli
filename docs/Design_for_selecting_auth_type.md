# Order of authentication in Zowe Clients

This document identifies a design to enable users to specify the order in which credentials are selected for authentication when multiple credentials are specified by the user.

Users may not intentionally specify multiple credentials for the same operation. However, because configuration properties can be inherited from a base profile or within nested profiles, it is possible that multiple credentials may be available when a Zowe client attempts to make a connection to a mainframe service.

## Use cases

A user may use the same user and password to authenticate to most of their services. It makes sense to place that user & password in a base profile so that they are automatically available to every service. This reduces redundancy and reduces maintenance efforts. If one plugin requires a token for authentication, the user would store a token value within that plugin's profile. For that plugin, both the user & password and a token will be available when Zowe CLI attempts to make a connection to that service. For this example, the token is the right choice for this service.  For historical reasons, Zowe always selects a user & password over a token when both are available. The use of user & password does not give the desired results.

When a site gradually deploys API-ML, they will very likely encounter another (but opposite) authentication issue. Sites login to APIML to obtain a token, which is then used to authenticate all future requests to services through API-ML. The API-ML token is typically stored in a base profile so that connections to all services are done through API-ML with its token. When a new service is brought on-line at a site, it is common for that service to not be immediately integrated with APIML. For at least a period of time, the site makes a direct connection to that service. The site adds user/password properties to that service's profile to authenticate that direct connection. Once again, both user & password and a token are available when Zowe attempts to connect to the service for that profile. In this case, the user & password are the right choice for this service. This is the opposite choice from the previous example.

As these examples demonstrate, Zowe cannot simply change which authentication type should be given preference. It varies based on what a site is trying to do. That order might also change from one part of the customer's configuration to another. The preferred order in which credentials are chosen is further complicated when we consider that certificates may also be used by a site for some of its services.

## General approach for a solution

In this section we identify the key features that a solution would have to provide.

- The order in which different types of authentication are used should be controlled by the user in the Zowe client configuration.

- The user must be able to change that authentication order for different parts of the Zowe client configuration.

- Zowe client logic must be enhanced to select the right authentication type for a profile being used to make a connection.

- Zowe client extenders (CLI plugins and ZE extensions) should **<u>not</u>** be able to alter the order of authentication types. The user should control that choice.

## Detailed requirements

- If a user does not specify the order of authentication, Zowe should use the historical order of authentication so that we do not introduce a breaking change.

- Zowe has an order of precedence for obtaining property values (config file, environment variable, command line). While a command line option will override the same property stored in a config file, it should not alter the order of authentication.
  
  - For example, if a user specifies a token value on the command line, it will override a token value stored in a config file. However,
    
    - If the user has specified that a certificate should be used before a token, and a certificate is also available in the configuration, the certificate should be used because the user configured that certificates are used before tokens.
    
    - The token should not be used just because it was supplied on the command line.

- The authentication order only identifies the order in which Zowe chooses the **<u>one</u>** authentication method that will be used. If that first authentication method fails, Zowe will not make a second attempt to authenticate with any of the later authentication methods.

- Once an auth type is selected, our logic should ensure that only that one auth type is placed into a session object. Thus, logic in down-stream handlers will not alter the order of auth selection, simply by testing for the auth types within the session in a different order than the order that the user specified.
  
  - If we continue to allow multiple auth types to be placed into a session, we will have to re-work various functions to test for auth type in the desired order. We will also have to provide the object containing that well-defined order to each such function. This will increase the amount of code being changed, and thus increase the probability of mistakes.

- Zowe clients do not currently support AUTH_TYPE_CERT_PFX, so we cannot add it to a set of available auth types. If AUTH_TYPE_CERT_PFX is implemented, it should be placed immediately after AUTH_TYPE_CERT_PEM in the default order.

- Customers should be able to specify AUTH_TYPE_NONE in their preferred order of auth types. While it is not advisable to have no authentication, if a customer has a service that requires no authentication, the customer should be able to specify AUTH_TYPE_NONE at the top of their list of auth types applicable to that particular profile.

- A customer should not have to specify every possible auth type in their ordered list of auth types. If a site only uses password and tokens, the customer should be able to specify only those two auth types in their list.

- A customer-specified list of auth types must contain at least one of our supported auth types.

- ## Historical behavior

The objective of this feature is to enable users to define the order in which an authentication type is selected. However, when a user does not specify any such order, the default order should reflect past behavior.

- The AbstractRestClient currently enforces an order of:
  
  - AUTH_TYPE_TOKEN
  
  - AUTH_TYPE_BASIC
  
  - AUTH_TYPE_BEARER
  
  - AUTH_TYPE_CERT_PEM

- Zowe classes other than AbstractRestClient (like AbstractSession) currently override the authentication order from AbstractRestClient into:
  
  - AUTH_TYPE_BASIC
  
  - AUTH_TYPE_BEARER
  
  - AUTH_TYPE_TOKEN
  
  - AUTH_TYPE_CERT_PEM

These selections of authentication should be maintained as the default selections for their respective classes to avoid introducing a breaking change.

## Configuration enhancement

- <span style="color:red">authTypeOrder config property</span>
- <span style="color:red">Levels in config where auth type order can reside</span>
  - Base
  - Nested parent
  - Individual profile

## Determination of functions to be modified

The set of candidates for modification consist of all functions that contain the string ***"AUTH_TYPE_"***. This section contains an assessment of whether each such function affects the authentication order. Based on this analysis, those functions that warrant modification are identified in the "Proposed software modifications" section of this document.

- cli\src\config\auto-init\ApimlAutoInitHandler
  
  - doAutoInit - This function logins into APIML with the session object if either user & password or cert are in the session object. doAutoInit does not make a selection of order. It lets Login.apimlLogin() make that decision. If only the selected auth type is placed into a session, then no need to change.
    - **Modify doAutoInit ?  <span style="color:green">No</span>**

- core\src\rest\ZosmfRestClient.ts
  
  - processError - This function just alters error message text based on auth types found in the session. If only the selected auth type is placed into a session, then no need to change.
    - **Modify processError ?  <span style="color:green">No</span>**

- imperative\src\config\src\ConfigAutoStore.ts
  
  - _fetchTokenForSessCfg - Since this function is used to explicitly retrieve a token value to be auto-stored into a session config, its use of AUTH_TYPE_TOKEN does not affect the auth order. So, no need to change.
    - **Modify _fetchTokenForSessCfg ? <span style="color:green">No</span>**

- imperative\src\imperative\src\config\cmd\import\import.handler.ts
  
  - buildSession - This function is used to import a config from a URL. That URL is an arbitrary location at a customer site where a config file is kept. It is not the target of a REST request to a mainframe service. By design, the only auth type that it will use is user & password. Supporting more authentication types in the 'import' command is beyond the scope of this authentication-order feature. Therefore, no need to change.
    - **Modify buildSession ? <span style="color:green">No</span>**

- imperative\src\rest\src\client\AbstractRestClient.ts
  
  This class is the only class to use the recently created ISession.authTypeOrder property, which is an array of authentication types supplied in the order in which they should be selected.
  
  - buildOptions - This function tests for the auth type based on the order in which they occur in ISession.authTypeOrder. Therefore, no need to change.
    
    - **Modify buildOptions ? <span style="color:green">No</span>**
  
  - constructor - This function currently hard-codes an order of authentication types into the ISession.authTypeOrder array. We must create a means to record the customer-defined order in this function. This function should call a common function (tentatively named recordAuthTypeOrderFromConfig) to do this work. recordAuthTypeOrderFromConfig should be able to set the old hard-coded order (as the default order) only if a customer does not specify an order. 
    
    - **Modify constructor?   <span style="color:orange">yes</span>**
  
  - Each of the following functions reference AUTH_TYPE_XXX to a place an identified type into the ISession.type property. Since buildOptions calls just one of the following functions based on being the first available auth type in the ISession.authTypeOrder array, none of these functions need to change.
    
    - **Modify setBearerAuth ? <span style="color:green">No</span>**
    
    - **Modify setCertPemAuth ? <span style="color:green">No</span>**
    
    - **Modify setPasswordAuth ? <span style="color:green">No</span>**
    
    - **Modify setTokenAuth ? <span style="color:green">No</span>**

- imperative\src\rest\src\session\AbstractSession.ts
  
  - buildSession - This private function is called by the constructor, which accepts an Isession object. A caller could populate multiple auth types (and related properties) into that supplied session. Session.buildSession() will have to scrub all but the highest priority available auth type from the session. We should create a common utility function (tentatively named selectTopAuthType) to do the scrubbing. selectTopAuthType can be also be called from ConnectionPropsForSessCfg.resolveSessCfgProps function as described below.
    
    - **Modify buildSession ? <span style="color:orange">Yes</span>**
  
  - DEFAULT_TYPE - This simply a constant definition set to AUTH_TYPE_NONE. It is not used in any CLI or ZE code outside of this AbstractSession class. Because it is a public property, it cannot be removed without risk of breaking change. If AUTH_TYPE_NONE is added to the ISession.authTypeOrder array, DEFAULT_TYPE should be deprecated.
    
    - **Modify DEFAULT_TYPE ? <span style="color:orange">Yes</span>**

- imperative\src\rest\src\session\ConnectionPropsForSessCfg.ts
  
  - addPropsOrPrompt - This function only uses AUTH_TYPE_XXX to determine whether a token and a cert are irrelevant based on the existence of AUTH_TYPE_TOKEN. Those items should not need to change. However, addPropsOrPrompt accepts three parameters, each of which can have property overrides of auth type. After calling resolveSessCfgProps, addPropsOrPrompt continues to modify the session properties with values from its parameters. Thus addPropsOrPrompt must be refactored to work properly with a refactored resolveSessCfgProps.
    
    - **Modify addPropsOrPrompt ? <span style="color:orange">Yes</span>**
  
  - resolveSessCfgProps - Many functions call this function before creating a new session. This function could scrub all but the selected auth type and related properties from the session object. However, callers could call 'new Session()' without first calling resolveSessCfgProps(). Thus, Session.buildSession() will have to perform the same scrubbing of auth types from the session. Both Session.buildSession and resolveSessCfgProps should call selectTopAuthType() to do the scrubbing. 
    
    - **Modify resolveSessCfgProps ? <span style="color:orange">Yes</span>**
  
  - setTypeForTokenRequest - This function handles setting auth type to AUTH_TYPE_TOKEN to get a token back from user & password. This does not appear to require any change, but it should be revisited after resolveSessCfgProps is refactored.
    
    - **Modify setTypeForTokenRequest ? <span style="color:orange">Maybe</span>**

- imperative\src\rest\src\session\SessConstants.ts
  
  - Constants and type definitions of AUTH_TYPE_XXX are what they need to be.
    - **Modify constants ? <span style="color:green">No</span>**

- imperative\src\rest\src\session\Session.ts
  
  - createFromUrl - This function is only called from ImportHandler.buildSession when to enable importing a config from a URL. As with ImportHandler.buildSession, the use of AUTH_TYPE_BASIC when user & password exist is appropriate and should not need to change.
    - **Modify createFromUrl ? <span style="color:green">No</span>**

- imperative\src\rest\src\session\doc\IOptionsForAddConnProps.ts
  
  - supportedAuthTypes - Our set of supported auth types will not change as part of this feature.
    - **Modify supportedAuthTypes ? <span style="color:green">No</span>**

- imperative\src\rest\src\session\doc\ISession.ts
  
  - authTypeOrder - This property could be the focus of our refactoring, but currently it is hard-coded and only used in AbstractRestClient.constructor & AbstractRestClient.buildOptions. This property should be used to hold the customer-defined order of authentication types. There is no reason to change this property. Other code will repopulate authTypeOrder's set of values based on customer input. It is possible that an ISession may not be available at the time we want to store the customer-defined order of authentication types. Another object may need to store that order, which is later transferred into this ISession property.
    
    - **Modify authTypeOrder ? <span style="color:green">No</span>**

- packages\zosuss\src\SshBaseHandler.ts
  
  - process - Since our SSH connection can only use basic authentication, this function's use of AUTH_TYPE_BASIC is appropriate and does not need to change.
    - **Modify process ? <span style="color:green">No</span>**

## New software logic to add

This section describes new functions that must be added to achieve the desired functionality.

- Utility function to record the order of authentication types.
  
  > ---
  > 
  > @internal
  > 
  > public UnknownClass.recordAuthTypeOrderFromConfig(tokenIsTopDefault: boolean = false): string[ ] {
  > 
  > - This function should obtain the customer-defined authentication order from the Zowe client config file.
  > 
  > - It must confirm that the customer specified valid values. If not, it should record the error, and fall-back to the appropriate default order.
  > 
  > - It should place those auth types into a string array that is returned.
  >   
  >   - <span style="color:red">Maybe instead of returning that array, the array is set into come commonly accessible object (like ImperativeConfig)?</span>
  > 
  > - If no order has been configured into zowe.config.json, it should create a default order to be backward compatible.
  > 
  > - If tokenIsTopDefault is true, it should place token at the top of the order, resulting in this order:
  >   
  >   - AUTH_TYPE_TOKEN
  >   
  >   - AUTH_TYPE_BASIC
  >   
  >   - AUTH_TYPE_BEARER
  >   
  >   - AUTH_TYPE_CERT_PEM
  >   
  >   - AUTH_TYPE_CERT_PFX
  >   
  >   - AUTH_TYPE_NONE
  > 
  > - If tokenIsTopDefault is false, it should place basic at the top of the order, resulting in this order:
  >   
  >   - AUTH_TYPE_BASIC
  >   
  >   - AUTH_TYPE_TOKEN
  >   
  >   -  AUTH_TYPE_BEARER
  >   
  >   - AUTH_TYPE_CERT_PEM
  >   
  >   - AUTH_TYPE_CERT_PFX
  >   
  >   - AUTH_TYPE_NONE
  > 
  > }

- Utility function to get the array of authentication types.
  
  > ---
  > 
  > public UnknownClass.getAuthTypeOrder(): string[ ] {
  > 
  > - This function should return the recorded array of authentication types. They will be in the order of top preference first.
  > 
  > - <span style="color:red">Maybe this function lives in ImperativeConfig?.</span>
  > 
  > }

- Utility function to select the top available authentication type in a session.
  
  > ---
  > 
  > @internal
  > 
  > public UnknownClass.selectTopAuthType(iSessObj: ISession): void {
  > 
  > - This function should use the new getAuthTypeOrder function to get the ordered array of auth types.
  > - It should confirm if the auth types (in the preferred order) and their associated properties are available in the iSessObj.
  > - Once the first auth type is found, the properties related to all other auth types should be removed from iSessObj.
  > - <span style="color:red">Maybe this function lives in AbstractSession?.</span>
  > 
  > }



# 
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
  
  - If we continue to allow multiple authTypes to be placed into a session, we will have to re-work various functions to test for authType in the desired order. We will also have to provide the object containing that well-defined order to each such function. This will increase the amount of code being changed, and thus increase the probability of mistakes.

- Zowe clients do not currently support AUTH_TYPE_CERT_PFX, so we cannot add it to a set of available authTypes. If AUTH_TYPE_CERT_PFX is implemented, it should be placed immediately after AUTH_TYPE_CERT_PEM in the default order.

- <span style="color:red">Propose that AUTH_TYPE_NONE gets a place in our list of possible authentication types</span>

- ## Historical behavior

The objective of this feature is to enable users to define the order in which an authentication type is selected. However, when a user does not specify any such order, the default order should reflect past behavior.

- The AbstractRestClient currently enforces an order of:
  
  - AUTH_TYPE_TOKEN
  
  - AUTH_TYPE_BASIC
  
  - AUTH_TYPE_BEARER
  
  - AUTH_TYPE_CERT_PEM

- All Zowe functions down-stream from AbstractRestClient explicitly override the authentication order from AbstractRestClient to be:
  
  - AUTH_TYPE_BASIC
  
  - AUTH_TYPE_BEARER
  
  - AUTH_TYPE_TOKEN
  
  - AUTH_TYPE_CERT_PEM
  
  - <span style="color:red">Confirm this order</span>
  
  - <span style="color:red">Describe how AUTH_TYPE_NONE gets set</span>

These selections of authentication should be maintained as the default selections for their respective classes to avoid introducing a breaking change.

## Configuration enhancement

- <span style="color:red">authTypeOrder config property</span>
- <span style="color:red">Levels in config where authType order can reside</span>

## Functions that are candidates for modification

The set of candidates for modification consist of all functions that contain the string ***"AUTH_TYPE_"***. This section contains an assessment of whether each such function affects the authentication order. Based on this analysis, those functions that warrant modification are identified in the "Proposed software modifications" section of this document.

- cli\src\config\auto-init\ApimlAutoInitHandler
  
  - doAutoInit - This function logins into APIML with the session object if either user & password or cert are in the session object. doAutoInit does not make a selection of order. It lets Login.apimlLogin() make that decision. If only the selected authType is placed into a session, 
    - **Modify doAutoInit ?  <span style="color:green">No</span>**

- core\src\rest\ZosmfRestClient.ts
  
  - processError - This function just alters error message text based on auth types found in the session. If only the selected authType is placed into a session,
    - **Modify processError ?  <span style="color:green">No</span>**

- imperative\src\config\src\ConfigAutoStore.ts
  
  - _fetchTokenForSessCfg - Since this function is used to explicitly retrieve a token value to be auto-stored into a session config, its use of AUTH_TYPE_TOKEN does not affect the auth order. So,
    - **Modify _fetchTokenForSessCfg ? <span style="color:green">No</span>**

- imperative\src\imperative\src\config\cmd\import\import.handler.ts
  
  - buildSession - This function is used to import a config from a URL. That URL is an arbitrary location at a customer site where a config file is kept. It is not the target of a REST request to a mainframe service. By design, the only auth type that it will use is user & password. Supporting more authentication types in the 'import' command is beyond the scoope of this authentication-order feature. Therefore,
    - **Modify buildSession ? <span style="color:green">No</span>**

- imperative\src\rest\src\client\AbstractRestClient.ts
  
  This class is the only class to use the recently created ISession.authTypeOrder property, which is an arry of authentication types supplied in the order in which they should be selected.
  
  - buildOptions - This function tests for the authType based on the order in which they occur in ISession.authTypeOrder. Therefore,
    
    - **Modify buildOptions ? <span style="color:green">No</span>**
  
  - constructor - This function hard-codes the order of authentication types into the ISession.authTypeOrder array. We must create a means to provide the customer-defined order to this function. This function should only use its hard-coded order (as the default order) if a customers does not specify an order. 
    
    - That default order should be:
      
      - AUTH_TYPE_TOKEN
      
      - AUTH_TYPE_BASIC
      
      - AUTH_TYPE_BEARER
      
      - AUTH_TYPE_CERT_PEM
      
      - AUTH_TYPE_CERT_PFX
      
      - AUTH_TYPE_NONE
      
      - <span style="color:red">Confirm this order</span>
    
    - **Modify constructor?   <span style="color:orange">yes</span>**
  
  - Each of the following functions reference AUTH_TYPE_ to a place an identified type into the ISession.type property. Since buildOptions calls just one of the following functions based on being the first available authType in the ISession.authTypeOrder array, none of these functions need to change.
    
    - **Modify setBearerAuth ? <span style="color:green">No</span>**
    
    - **Modify setCertPemAuth ? <span style="color:green">No</span>**
    
    - **Modify setPasswordAuth ? <span style="color:green">No</span>**
    
    - **Modify setTokenAuth ? <span style="color:green">No</span>**

- imperative\src\rest\src\session\AbstractSession.ts
  
  - buildSession - This function accepts a session. It already confirms that a valid authType has already been set in the session. It then populates some session properties based on the authType that it finds. Other new logic, which ensures that only the selected authType is placed into a session, should have no adverse affect on this function. So,
    
    - **Modify buildSession ? <span style="color:green">No</span>**
  
  - DEFAULT_TYPE - This simply a constant definition set to AUTH_TYPE_NONE. It is not used in any CLI or ZE code outside of this AbstractSession class. Because it is a public property, it cannot be removed without risk of breaking change. If AUTH_TYPE_NONE is added to the ISession.authTypeOrder array, DEFAULT_TYPE should be deprecated, so
    
    - **Modify DEFAULT_TYPE ? <span style="color:orange">Yes</span>**

- imperative\src\rest\src\session\ConnectionPropsForSessCfg.ts
  
  - addPropsOrPrompt
  
  - resolveSessCfgProps
  
  - setTypeForTokenRequest

- imperative\src\rest\src\session\SessConstants.ts
  
  - Constants and type definitions

- imperative\src\rest\src\session\Session.ts
  
  - createFromUrl

- imperative\src\rest\src\session\doc\IOptionsForAddConnProps.ts
  
  - supportedAuthTypes

- imperative\src\rest\src\session\doc\ISession.ts
  
  - type
  
  - authTypeOrder
    
    - Could be the focus of our refactoring, but currently it is only used in
      AbstractRestClient.constructor & AbstractRestClient.buildOptions

- packages\zosuss\src\SshBaseHandler.ts
  
  - process

## New software logic to add

- <span style="color:red">Describe new functions that must be written to get the authTypeOrder</span>

- <span style="color:red">API functions allow programs to specify the auth options that they want. How can this be refactored in a non-breaking way?</span>

## Proposed deprecations

<span style="color:red">Remove this section?</span>

imperative\src\rest\src\session\AbstractSession.ts: DEFAULT_TYPE
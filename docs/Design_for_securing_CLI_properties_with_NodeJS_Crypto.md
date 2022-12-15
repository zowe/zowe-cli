<style>
.indent1 {
    padding-left: 30px;
}
.indent2 {
    padding-left: 60px;
}
</style>

# Securing Zowe CLI properties with NodeJS Crypto

## **Overview**
This document describes a design for storing secure CLI properties to a Zowe-controlled file, instead of using each operating system's secure storage vault.

## **Background**
A 3rd party component named Keytar provides a set of secure storage functions that the Zowe Secure Credential Store uses to store secure values in the underlying operating system's secure vault.

The retirement of Keytar affects the Zowe CLI's ability to store secure property values. Keytar is being retired as part of the retirement of the Atom text editor (https://github.blog/2022-06-08-sunsetting-atom/). The approach for replacing Keytar is to write a plug-compatible, platform-specific set of library functions in the Rust programming language. The design of that Rust approach is described in a separate design document.

While evaluating alternative solutions to the Keytar retirement, an option to encrypt secure values using NodeJS cryptographic functions was investigated. This document describes an approach that could be used to implement secure storage with portable, NodeJS technology. The purpose of this document is to retain a record of the investigation of this technology should it be valuable for some effort in the future.

## **Advantages of a NodeJS Crypto approach**

<u>**A NodeJS solution could avoid installation problems**</u>
<div class="indent1">

The Keytar component is a platform-specific binary library that is installed during the installation of Zowe CLI.

The Zowe Secure Credential Store (SCS) works reliably after Keytar has been successfully installed. However, customers have encountered problems installing the SCS due to installation problems related to Keytar. Some problems occurred when obtaining the Keytar binary module. Some problems occurred from overlooking the requirement to unlock the Linux keyring. Some problems appear to be due to locked-down security policies at some sites.

Typically, the CLI installation completes and CLI commands will work. However, a CLI command that tries to access data in the SCS fails to load the SCS due to a previously failed SCS installation. The majority of the CLI commands connect to z/OS, which require credentials. Those credentials should be stored in the SCS. Thus, most CLI commands become unusable when the SCS fails to install.

It is felt that an implementation in purely Typescript, using NodeJS-supplied cryptographic functions would not experience the same installation problems.
</div>

<u>**Support for USS**</u>

<p class="indent1">
Another scenario for which a NodeJS Crypto solution could provide value is the use of Zowe CLI on USS. Because no Keytar binary is available for USS, customers must currently store credentials in plain text. A Zowe NodeJS Crypto solution will use the same NodeJS-supplied technology on every platform, including USS.
</p>

## **Shortcomings of a NodeJS Crypto approach**
Because a different approach is used for encrypting data, consumers will experience some operational changes after a NodeJS Crypto solution is delivered.

<u>**Consumers must re-enter all secure values after upgrade**</u>
<div class="indent1">

Because secure values will no longer be stored in the same vault, consumers must re-enter their values one time so that they are available for future use by Zowe CLI commands.

The re-storage of secure properties would be accomplished with the **'zowe config secure'** command, which will prompt the user for every secure property recorded in the Zowe CLI configuration file.
</div>

<u>**Consumers must enter a new 'encryption password' each session**</u>
<p class="indent1">
To securely encrypt data, a user must supply one secret password that will be used to generate an encryption key, which is then used during cryptographic operations. The entry of such a password would probably occur once per day.
</p>

<u>**May introduce changes to client-side SDK functions**</u>
<p class="indent1">
Apps that call the Zowe CLI SDK may have to change some programming logic and application behavior. To enable this different form of encrypting, the SDK functions could require different parameters than they require today.
</p>

## **NodeJS Crypto functions not applicable to VS Code extensions**
Applications like Zowe Explorer, which are extensions to Visual Studio Code, utilize a version of Keytar automatically supplied by VS Code. Our expectation is that VS Code will provide a plug-compatible replacement for Keytar. Our suspicion is that VS Code will create Keytar-like wrappers around the Electron secure store mechanism. VS Code is built on the Electron GUI framework.

Note that the CLI is not a GUI app, thus it is not built on Electron. Therefore, the Zowe CLI cannot attempt to use the Electron secure storage mechanism.

## **Technical approach**

Secure property values will be encrypted into a file stored under the $ZOWE_CLI_HOME directory. A generated key (keyForProps) will be used to encrypt and decrypt those secure properties. That generated keyForProps must also be stored on disk, so that it can be accessed by future CLI commands. We will create this file as readable and writable by only the user. NodeJS functions can add those access restrictions for Linux and Mac. On Windows, we will launch the **icacls** command to perform comparable access restrictions.

Even so, if an attacker gains access to these files, both files could be stolen and the encrypted properties could be easily decrypted off-site using the keyForProps file. To prevent such a vulnerability, Zowe CLI will also encrypt the keyForProps file.

The CLI will ask the user to enter a password of his/her choice. The user must remember the password and supply the same password in the future when asked by the CLI. This password will only be used for encryption and decryption on the client system. It is not a mainframe password, and will never be passed to the mainframe.

This “decryption” password will be used to generate a second secret key, which we will call keyForKey. KeyForKey will only exist in memory for the duration of a CLI command. Neither the password nor the keyForKey will be stored on disk. KeyForKey will be regenerated from the password whenever encryption/decryption is needed. KeyForKey will decrypt the primary secret key (keyForProps). KeyForProps will, in turn, decrypt the secure properties. As a result, if an attacker steals both the keyForProps file and the encrypted properties file, the attacker will not be able to use the keyForProps file to decrypt the actual properties file, because the keyForProps file is also encrypted.

Obviously a user will not want to enter a password each time (s)he types a Zowe command. The CLI will launch a background process (when needed) to keep that password within the memory of that new process. Future CLI commands ask that 'password process' for the user's password whenever secure values must be encrypted or decrypted. The 'password process' creates a working environment similar to a login session used by QWS and many other client-server applications. The password does not have to be re-entered while the session is still alive.

The new 'password process' can be launched and managed using similar techniques as the CLI uses to launch its 'daemon process'. The 'password process' will be much simpler than the daemon. It will only perform the actions to remember a password and retrieve the password.

Also similar to the daemon, the CLI will communicate its requests to the 'password process' over a named pipe (Windows) or a domain socket (Linux/Mac). The file representing the communication channel will be created so that it is readable and writeable only by the user who originally issued the CLI command that launched the 'password process'.

The 'password process' will exist until the user closes his/her terminal window (Windows) or until the user's computer is rebooted (Linux/Mac). Thus, it is likely that the user will enter her/his password once a day.

Decryption of secure properties can only be performed if all three of the following items are available. All three items will only exist in the memory of a single process for the duration of a single CLI command.

1. The encrypted properties
2. The encrypted keyForProps
3. The user-supplied password

The following diagram displays how the CLI components and data will interact.

![Design Diagram](images/Diagram_of_secure_properties_with_NodeJS_Crypto.png "")

## **Additional security considerations**

The password in the 'password process' could be encrypted while stored in the memory of this long-running process. This in-memory encryption of the password would have to use a hard-coded encryption key. While a hard-coded key is not cryptographically secure it will obfuscate the password much better than keeping the plain text password in memory.


Obviously, the password must be decrypted for actual use. In a garbage-collection type of language, like JavaScript, you cannot directly, immediately remove that decrypted value from memory. You are at the mercy of the garbage collector for the timing of the removal from memory. The 'password process' can use techniques like setting the decrypted variable to null after its use, ensuring that the variable goes out of scope after its use, and maybe a few other techniques. Those techniques only guarantee that the variable becomes a candidate for removal. The techniques do not control when that removal will occur.

We expect that a common practice may be to run the 'password process' for a full day, before shutting down at the end of the work day. However, a customer could leave the 'password process' running for a much longer period of time. It is reasonable to assume that garbage collection will occur sooner than the indefinite operation of the 'password process'.

Program memory can be paged to disk. We believe that the OS kernels restrict access to the page file, making it harder for a normal user to access that file. None-the-less, these factors may make the in-memory encryption of the password worthwhile.

<u>**Cryptographic algorithms**</u>
<div class="indent1">

The CLI will generate keyForKey from the user-supplied password using a Password-Based Key Derivation Function from a cryptographic library.

The CLI will generate keyForProps by using 256 bits of output from a cryptographically strong pseudorandom data function.

The CLI will encrypt data using AES 256 bit encryption.
</div>

<u>**Periodic key change**</u>
<div class="indent1">
A good security practice is to periodically change a secret key that is used for encryption. When the key is changed, the CLI must decrypt all secure properties stored on disk with the old key and then encrypt the properties again with a new key. A new Zowe team configuration property named 'securePropKeyDuration' can be set by customers to adjust how often the key should be changed. Because re-encryption will slow performance, the default value will be once per week and the minimum value that the CLI will accept is 1 hour.
</div>

<u>**Password change**</u>
<div class="indent1">

The user will be prompted for a decryption password when required. The user must supply that same password every time (s)he is prompted. The user may want the ability to change that password.

We feel that the creation of a new zowe command would be the best approach - something like **zowe config reset-decryption-password**. Such a command would:
  - Decrypt the keyForProps file using the old password and old salt
  - Generate a new salt
  - Generate a new keyForKey using the new password, and a new salt
  - Re-encrypt the keyForProps using the new keyForKey
  - Store the newly re-encrypted keyForProps to disk

  Because the scope of this design is already significant, we do not plan to provide such a new command at this time. Also, an in-the-field workaround will exist. A user could delete the keyForProps.json and secureProps.json files. While the user will have to enter every secure value again, the user could supply a new password at that time. This will also be the required technique if the user forgets his/her password.
</div>

<u>**Performance**</u>
<p class="indent1">
Encryption and decryption are CPU-intensive operations which can impact performance. It is not clear how much performing our own encryption will affect performance. It should be noted that Keytar and its underlying tools must also perform encryption and decryption, so theoretically the performance could be similar to what we observe today with SCS. We will not be able to assess any performance impact until the new features are implemented.
</p>

## **Secure properties in CI/CD pipelines**

The recommended approach for using secure data with Zowe CLI in a CI/CD pipeline is to keep all such secure data items in the secure data tool of the pipeline. For example, such secure data could be stored in the “Jenkins Secrets” tool. The pipelines’ secure tools are generally much easier to set up inside of a CI/CD pipeline than any Zowe secure data storage tool.

A DevOps engineer could store every secure property in a Jenkins Secret. Inside the pipeline, a Jenkins Secret’s value could be placed into a Zowe_OPT_XXX type of environment variable. That value will be used in any following Zowe commands as the value of the corresponding XXX command line property. For example, the value of the variable named ZOWE_OPT_PASSWORD, would be used as the password for any Zowe commands.

The remainder of this section describes techniques to use secure properties stored by NodeJS Crypto within in a CI/CD pipeline.

Outside of a pipeline, a DevOps engineer would record all required secure values (perhaps by running the '**zowe configure secure**' command). The engineer could store the secure properties file and the keyForProps file into the source control tool used by the project. Those files will then be available in the pipeline when source code is retrieved. User-written pipeline scripts would copy the secure properties file and the keyForProps file from source control into the $ZOWE_CLI_HOME directory

One aspect of the NodeJS Crypto design is to ask the user for a "decryption" password. When the pipeline runs its first zowe command, that command will prompt for the password. You do not typically prompt for user input in a CI/CD pipeline. To supply the password inside the pipeline when prompted for a password by Zowe, the DevOps engineer would place the password into the secure data tool of the pipeline (like the “Jenkins Secrets” tool). A pipeline script would retrieve the password from the secure data tool of the pipeline and supply that password in a Linux ‘expect’ command ([https://man7.org/linux/man-pages/man1/expect.1.html](https://www.google.com/url?q=https://man7.org/linux/man-pages/man1/expect.1.html&sa=D&source=editors&ust=1667332042709385&usg=AOvVaw1dTB2LosRc-fM2PfhO9L8f)) to simulate an end user interactively supplying a password to the first zowe command.

That first zowe command will launch the 'password process'. With that process running in the background and the availability of the secure data files, the behavior of the remaining zowe commands in the pipeline should be the same as if they were run outside of the pipeline.

If any of the secure property values change, or if the site changes the password, the initial setup steps would have to be performed again before running the pipeline.

## **Data Structures**
This section provides details about how data will be stored on disk.

<u>**Data structure to hold the key for decrypting secure properties**</u>
<div class="indent1">

```
$ZOWE_CLI_HOME\keyForProps.json
{
    encKeyForProps :  // encrypted & base64 encoded key to decrypt properties
    saltForPassword : // salt for generating keyForKey from the user password
    lastKeyGenTime :  // the time that a keyForProps was last generated
}
```
</div>

<u>**Data structure to store secure properties on disk**</u>
<div class="indent1">

This object must be structured similarly to the in-memory representation of our team configuration. Doing so will enable our code to most easily find the encrypted value of a desired secure property. This object would only have to contain the secure properties. No other properties will be required in this object. Using the zowe.config.json structure for illustrative purposes, the content of our in-memory credentials might be similar to the following.

```
$ZOWE_CLI_HOME\secureProps.json
    "profiles": {
        "my_zosmf_profile": {
            "secure": [
                "user":     // AES 256 encrypted, base64 encoded user value,
                "password": // AES 256 encrypted, base64 encoded password value
            ]
        },
        "my_endevor_profile": {
            "secure": [
                "user":     // AES 256 encrypted, base64 encoded user value,
                "password": // AES 256 encrypted, base64 encoded password value
            ]
        },
        …
    }
```
</div>

## **Pseudo code**

The following pseudo code is provided to demonstrate that a reasonable approach exists to encrypt or decrypt desired secured data using the proposed data structures and CLI components. The eventual implementation does not have to follow these exact algorithms. This pseudo code is only provided to identify a starting point and to ensure that no major decisions are overlooked in the final implementation.

When a CLI command is issued it will perform the following logic.

- // Get the 'decryption' password
- if passwordProcess is not running
  - prompt the user for his/her password
  - launch the password process
  - send a request to the passwordProcess to remember the password
- else
  - send a request to the passwordProcess to get the password
<br><br>
- Read keyForProps.json from disk
<br><br>
- // Is it time to re-encrypt the secure properties?
- if CurrentTime - keyForProps.json{lastKeyGenTime} > zowe.config.json{securePropKeyDuration}
  - // Decrypt the current secured properties with the current keyForProps
  - Use a Password-Based Key Derivation Function (Crypto.scrypt) to generate the keyForKey from the password and keyForProps.json{saltForPassword}
  - Use keyForKey to decrypt keyForProps.json{encKeyForProps} into keyForProps
  - Read secureProps.json from disk
  - Use keyForProps to decrypt all properties from secureProps.json
<br><br>
  - // Re-encrypt the properties with a new keyForProps
  - Use crypto.randomBytes() to create a newKeyForProps
  - Use newKeyForProps to re-encrypt all properties from secureProps.json
  - Store the newly re-encrypted secured properties into secureProps.json on disk
<br><br>
  - // Generate new salt and new keyForKey from password
  - Use crypto.randomBytes() to create a newSalt from 32 bytes of random data
  - Use Crypto.scrypt() to generate a newKeyForKey from the password and newSalt
<br><br>
  - // Encrypt the new keyForProps before storing it to disk
  - Use newKeyForKey to encrypt newKeyForProps
  - Store the encrypted newKeyForProps, the newSalt, and the current time into<br> keyForProps.json{encKeyForProps, saltForPassword, and lastKeyGenTime}
<br><br>
- if the command needs a secure property
  - if keyForKey and keyForProps are available from the re-encryption logic above
    - use the existing values of keyForKey and keyForProps
  - else
    - Use Crypto.scrypt() to generate the keyForKey from the password and keyForProps.json{saltForPassword}
    - Use keyForKey to decrypt keyForProps.json{encKeyForProps} into keyForProps
  - Use keyForProps to decrypt (or encrypt) the desired secured property from (or to) secureProps.json

## **Findings on available crypto libraries**

<u>**Javascript crypto libraries**</u>
<div class="indent1">
Our NodeJS Javascript daemon must perform secure encryption. Numerous Javascript packages exist which provide encryption capabilities. Little objective information exists on what differentiates one package from another. We investigated overview information for the following packages.

  - crypto-js
      - JavaScript library of crypto standards.
      - [https://www.npmjs.com/package/crypto-js](https://www.google.com/url?q=https://www.npmjs.com/package/crypto-js&sa=D&source=editors&ust=1667332042721372&usg=AOvVaw2M81DqaAZB29xdmdVyhIUZ)
      - 4,652,740 weekly downloads
      - MIT License
  - CryptoJs
      - JavaScript implementations of standard and secure cryptographic algorithms. CryptoJS is a project that I enjoy and work on in my spare time, but unfortunately my 9-to-5 hasn't left me with as much free time as it used to. I'd still like to continue improving it in the future, but I can't say when that will be. If you find that CryptoJS doesn't meet your needs, then I'd recommend you try Forge.
      - [https://cryptojs.gitbook.io/docs/](https://www.google.com/url?q=https://cryptojs.gitbook.io/docs/&sa=D&source=editors&ust=1667332042721980&usg=AOvVaw3v3OdPYqLNj9Tqdlvc__4V)
      - ? weekly downloads<
      - New BSD License
  - node-forge
      - A native implementation of TLS (and various other cryptographic tools) in JavaScript.
      - [https://www.npmjs.com/package/node-forge](https://www.google.com/url?q=https://www.npmjs.com/package/node-forge&sa=D&source=editors&ust=1667332042722816&usg=AOvVaw3rr5oz9hIJa75gJtiRwhgs)
      - 17,226,352 weekly downloads<
      - You may use the Forge project under the terms of either the BSD License or the GNU General Public License (GPL) Version 2.
  - Node.js Crypto
      - The node:crypto module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.
      - [https://nodejs.org/api/crypto.html#crypto_crypto](https://www.google.com/url?q=https://nodejs.org/api/crypto.html%23crypto_crypto&sa=D&source=editors&ust=1667332042723297&usg=AOvVaw1t0lRGwhJH9Crkl23s_HEq)
      - 3,698,340 downloads of the full Node.js package on Aug 4, 2022
      - MIT License

  <u>**Selected package**</u>

  The Javascript crypto library that we plan to use is Node.js Crypto for the following reasons:

  - Zowe CLI already relies on Node.js. We add no new dependency.
  - Significantly more tutorial documentation exists for this package than any of the others.
  - Node.js Crypto provides all necessary functionality.
  - No comparative information exists to recommend another package over Node.js Crypto.

  The Node.JS Crypto documentation states that “It is possible for Node.js to be built without including support for the node:crypto module.” Because that statement is a cause for uncertainty, we wrote an experiment to perform the following actions with Node.JS Crypto:

  - Wrote the experiment on a Windows laptop.
  - Used the Node.JS Crypto module to encrypt and decrypt some hard-coded text within an existing Zowe CLI command handler.
  - Used AES encryption with a hard-coded 256 bit key.
  - The data encryption and decryption worked successfully.

Our interpretation of the Node.js Crypto disclaimer is that you may not have the crypto library if you compile nodeJS yourself. We assume that if you download a standard LTS version of Node.js, it will contain a working crypto module.
</div>

<u>**Rust hash libraries**</u>
<div class="indent1">

In an earlier design iteration, we intended to use a cryptographic hash function in the Rust program. After some design changes, we no longer need any cryptographic functions in the Rust program. We have chosen to retain the following information as a record of our analysis of Rust hashing options.

Numerous Rust crates exist which provide encryption capabilities. Our Rust command line program must only create a secure hash. We focused on crates that only provide hash functions to avoid including extra unnecessary functionality. We investigated overview information for the following crates.

  - crypto-hash
      - A Rust wrapper around OS-level implementations of cryptographic hash functions.
          <br>
          By operating system:
          - Windows: CryptoAPI
          - OS X: CommonCrypto
          - Linux/BSD/etc.: OpenSSL
      - [https://crates.io/crates/crypto-hash](https://www.google.com/url?q=https://crates.io/crates/crypto-hash&sa=D&source=editors&ust=1667332042725922&usg=AOvVaw2U54xdIcryH4x7e5mOUPPz)
      - 3,500 downloads on Aug 1, 2022
  - seahash
      - A blazingly fast, portable hash function with proven statistical guarantees.
          <br>
          A word of warning!
          This is not a cryptographic function, and it certainly should not be used as one.
      - [https://docs.rs/seahash/latest/seahash/](https://www.google.com/url?q=https://docs.rs/seahash/latest/seahash/&sa=D&source=editors&ust=1667332042726581&usg=AOvVaw1NWLllBK56a5_wQKp7ixkV)
      - 13,882 downloads on Aug 1, 2022<
      - MIT

  - RustCrypto/hashes
      - Collection of cryptographic hash functions written in pure Rust.
      - [https://github.com/RustCrypto/hashes](https://www.google.com/url?q=https://github.com/RustCrypto/hashes&sa=D&source=editors&ust=1667332042727098&usg=AOvVaw3Fb50mr1z_DYMc2zAIBb02)
      - 30,000 downloads on Aug 1, 2022
      - MIT OR Apache-2.0 License

  <u>**Selected crate**</u>

  The Rust hash crate that we plan to use is RustCrypto/hashes for the following reasons:
  - It is a true cryptographic hash.
  - Because it is self-contained (pure Rust), it will not be reliant on the different APIs available on different operating systems.
  - It documents support for the SHA3-256 hash
      - SHA3-256 is the newest SHA hash algorithm, documented in NIST standard FIPS pub 202.
      - SHA3-256 is also one of the hash functions included in the latest Federal Information Processing Standards Publication (FIPS) 140-3. Adherence to this standard is often required for U.S. Federal Government contracts.

  We wrote an experiment to perform the following actions with RustCrypto/hashes:
  - Wrote the experiment on a Windows laptop.
  - Within an existing Rust command, we used the RustCrypto/hashes crate to create a SHA3 256 bit hash from some hard-coded input.
    - This hash should be the right size for a key to be used in the AES 256 encryption that will be done in the daemon.
  - The hash generation worked successfully.
</div>

## **Footnotes**
[[a] ](#cmnt_ref1) During review, it was pointed out that since encrypted data must be unencrypted to perform a user's operation, that unencrypted data will remain in memory when using a garbage-collection type of language like JavaScript. This is a true statement. I added a justification to this document for why we still encrypt secure data when keeping it in memory indefinitely.

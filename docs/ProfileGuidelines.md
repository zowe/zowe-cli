# Profile Guidelines
This document is intended to be a living summary document of conventions and  best practices for profiles within Zowe CLI and plug-ins to Zowe CLI.

## Purpose and Use Cases
Profiles (as described by their use case in @brightside/imperative) are simple documents (YAML format) intended to persist user configuration properties.

The basic use case for a profile is to persist "connection details" (i.e. host/port & user credentials to a remote service). An analogy for profiles is "sessions" in Putty.

Profiles are ultimately for user convenience. Having to repetitively type (or retype) sets of configuration/options can be cumbersome for a user.

See Imperative CLI Framework documentation about profiles for details on implementing profiles and the profile "type" concept.  

### When You Use a Profile to Store Configuration Items
Use a profile to store configuration items under the following conditions:

- You require information specific to the user (e.g. credentials)
- Your require Configuration/Options that are repetitive or required on every command for a group
- The configuration information that the user would want to swap on a per command basis (e.g. issuing commands to z/OSMF on SYSA, then again on SYSB would require different sets of "connection details")
- The configuration information that apps built on Zowe CLI require. For example, a "Job Explorer" extension in VS Code would benefit from a user profile - no additional configuration would be required from the user for the extension to connect to a remote z/OSMF.

### When You Should Not Use Profiles to Store Configuration Items
- Your profiles requires a global configuration. That is, depending on the use case, the use of an environment variable might be more suitable for this type of configuration.

#### Future Profile Enhancements
To aid in automation & scriptability, the Imperative CLI Framework will provide some mechanism to surface required profile properties on a command (alleviating the need for a profile in an automation environment). Again, profiles are for user (human) convenience.  




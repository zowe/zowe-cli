# Using global profile configuration with Zowe CLI <!-- omit in toc -->

**Early access feature:** Global profiles are available in the `@next` version of Zowe CLI. If you already installed the supported version `@zowe-v1-lts`, switch versions to try this feature. The functionality will be included in the next major Zowe release, V2.0.0-LTS.

**Table of Contents:**
- [Feature overview](#feature-overview)
  - [Benefits](#benefits)
  - [Changes to secure credential storage](#changes-to-secure-credential-storage)
- [Installing @next version](#installing-next-version)
- [Initializing global configuration](#initializing-global-configuration)
- [(Optional) Initializing user-specific configuration](#optional-initializing-user-specific-configuration)
- [Editing configuration](#editing-configuration)
- [Managing credential security](#managing-credential-security)
- [Tips for efficient configuration](#tips-for-efficient-configuration)
  - [Tips for using the base array](#tips-for-using-the-base-array)
- [Sharing global configuration](#sharing-global-configuration)
- [Example configurations](#example-configurations)

## Feature overview

In the V1-LTS version of the CLI, users issue commands from the `zowe profiles` group to create, edit, and manage user profiles. Each profile contains the host, port, username, and password for a specific mainframe service instance. While that approach is effective, users often need to duplicate values across profiles and spend time managing many profiles separately.

The **global profile functionality** simplifies profile management by letting you edit, store, and share mainframe configuration details in one location. You can use a text editor to populate configuration files with connection details for your mainframe services.

### Benefits

Global profile configuration can improve your Zowe CLI experience in the following ways:

- As a CLI user, you can manage your connection details efficiently in one location.
- As a team leader, you can share a configuration file with your team members so that they can easily access mainframe services. You can add the file directly to your project in an SCM.
- As a new team member, you can onboard quickly by consuming your team's configuration file.

### Changes to secure credential storage

In this version, Secure Credential Store (SCS) Plug-in is deprecated. The `zowe scs` and `zowe config` command groups are obsolete. The equivalent functionality that encrypts your credentials is now included in the core CLI.

With the new configuration, the CLI prompts you to enter username and password securely by default. Commands in the new `zowe config` command group let you manage security for any option value.

## Installing @next version

To get started, install the Zowe CLI `@next` version from the online registry. You can follow this procedure for a first-time installation, or to update a currently installed version.

**Follow these steps:**

1. Meet the [software requirements for Zowe CLI](https://docs.zowe.org/stable/user-guide/systemrequirements.html#zowe-cli-requirements).

2. To install or update the core CLI, open a command-line window and issue the following command:

   ```
   npm install -g @zowe/cli@next
   ```

3. Meet the [software requirements for each plug-in](https://docs.zowe.org/stable/user-guide/cli-swreqplugins.html#software-requirements-for-zowe-cli-plug-ins).

4. (Optional) Check [npmjs.com](https://www.npmjs.com/) for any Zowe plug-ins that have an `@next` version available. If an `@next` version is available, you can issue the following command (substituting the plugin name) to install it. If no `@next` version, try installing the `@latest` version of the plug-in:

    ```
    zowe plugins install @zowe/<plugin-name>@next
    ```

   Zowe CLI and optional plug-ins are installed!

5. Open a command-line window and issue the following command:

   ```
   zowe scs revert --force
   ```

6. If you previously had the Secure Credential Store plug-in installed, uninstall it now to avoid unexpected behavior. Issue the following command:

    ```
    zowe plugins uninstall @zowe/secure-credential-store-for-zowe-cli
    ```

7. If you previously had an instance of Zowe CLI installed, your current configuration files are ignored if zowe.config.json is found globally, at the project level, or up the directory structure. Delete the following files from your local `.zowe/` directory:
   - `.zowe/settings/imperative.json`
   - `.zowe/profiles`

   **Important!** Prior to deleting the contents of the `/profiles` directory, take note of any mainframe service details that you need (host, port, etc...). You might want to save the entire `/profiles` directory to another location on your computer so that you can reference or restore the profiles later.

You can now configure the CLI and issue commands.
## Initializing global configuration

To begin, define a connection to z/OSMF and initialize your configuration files. We recommend this method for getting started, but you can choose create the configuration files manually if desired.

**Follow these steps:**

1. Issue the following command:

   ```
   zowe config init --global
   ```

   The CLI provides a series of prompts.

2. Respond to the prompts to enter a username and password for a mainframe service such as z/OSMF. The `--global` option ensures that your credentials are stored securely on your computer by default.

   After you respond to the prompts, the following file is added to your local `.zowe` directory:

   - `zowe.config.json` - A global configuration file. This is the primary location where your MF service connection details such as host and port are defined. Use this configuration file for the following procedures.

3. Issue a Zowe CLI command to test that you can access z/OSMF. For example, list all data sets under your user ID:

   ```
   zowe zos-files list data-set "MY.DATASET.*"
   ```

   A list of data sets is returned. You successfully configured Zowe CLI to access a z/OSMF instance!

   If the CLI returns an error message, verify that you have access to the target system. Examine your configuration files in a text editor to verify that the information you entered is correct.

**Important!:** After the configuration files are in place (either via the `zowe config init` command or by manually creating the files), the old `zowe profiles` commands will no longer function. Expect to see errors if you attempt to make use of old profiles.

## (Optional) Initializing user-specific configuration

Additionally, you can generate a *user-specific* configuration file. In your user config, you can override values that are defined in the global `zowe.config.json`.

Issue the command `zowe config init --global --user` to generate both global (`zowe.config.json`) and user (`zowe.config.user.json`) config files.

In your user-specific file, notice that the top level defaults, plugins, and secure fields are empty. The profiles do not have any properties. You can add your connection details as properties here to override properties in `zowe.config.json`, or add add new connections.
## Editing configuration

After the initial setup, you can define additional mainframe services to your global or user config.

Open the `~/.zowe/zowe.config.json` file in a text editor or IDE on your computer. The profiles object should contain connection and other frequently needed information for accessing various services. For example:

```javascript
{
    "$schema": "./zowe.schema.json",
    "profiles": {
        "lpar1": {
            "properties": {
                "host": "example1.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 443
                    }
                }
            }
        }
    },
    "defaults": {
        "zosmf": "lpar1.zosmf"
    },
    "plugins": [],
    "secure": [
        "profiles.lpar1.properties.user",
        "profiles.lpar1.properties.password"
    ]
}
```

From here, you can edit the details as needed and save the file. For example, you might change the host or port fields if those values changed.

To add a new service, for example add a new instance of z/OSMF that runs on a different mainframe LPAR, you can build on the existing array as follows:

```javascript
{
    "$schema": "./zowe.schema.json",
    "profiles": {
        "lpar1": {
            "properties": {
                "host": "example1.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 443
                    }
                }
            }
        },
        "lpar2": {
            "properties": {
                "host": "example2.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 1443
                    }
                }
            }
        }
    },
    "defaults": {
        // Change to lpar2.zosmf if you wish to change default profile
        "zosmf": "lpar1.zosmf"
    },
    "plugins": [],
    "secure": [
        "profiles.lpar1.properties.user",
        "profiles.lpar1.properties.password",
        // See below about tips for using base array to avoid duplicating these
        "profiles.lpar2.properties.user",
        "profiles.lpar2.properties.password"
    ]
}
```

You can continue to add more LPARs, and more services within each LPAR. After you make changes, save the file and issue a Zowe CLI command to the service to verify connection.
## Managing credential security

When you first run the `zowe config init --global` command, the `profiles.base.properties.user` and `profiles.base.properties.password` fields are defined to the "secure" array in your configuration file. This ensures that username and password are stored securely on your computer.

Issue the `zowe config secure` command to re-prompt for all secure fields when you want to update them (for example, when you want to change your username and password).

To secure a specific field, use the command `zowe config set secure --<option-name>`. For example, you can issue `zowe config set secure --host`. If you issue the command for an option that is already secure, the CLI re-prompts you to enter a new option value.

Alternatively, you can use an editor to define options to the secure array in `zowe.config.json` manually. Any option that you define to there becomes secure/prompted-for.

## Tips for efficient configuration

There are several methods you can employ to more efficiently update and maintain your configuration.

Zowe CLI uses a "command option order of precedence" that lets your service definitions inherit option values. You can use this to your advantage, because it lets you avoid duplicating the same option value in several places.

The CLI checks for option values in the following order. If not found, the next location is checked:
1. Options you define explicitly on the command-line
2. Environment variables
3. Service type profiles
4. Base type profiles
5. If no value is found, the default value for the option is used.

The user name and password fields are not supplied in the service definitions.

In the following example, the username and password fields for ZOSMF1 and ZOSMF2 are user name and password fields are not supplied in the service definitions to allow them to inherit values from the base array:

```javascript
{
    "$schema": "./zowe.schema.json",
    "profiles": {
        "lpar1": {
            "properties": {
                "host": "example1.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 443
                    }
                }
            }
        },
        "lpar2": {
            "properties": {
                "host": "example2.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 1443
                    }
                }
            }
        },
        "my_base": {
            "type": "base",
            "properties": {
                "rejectUnauthorized": true
            }
        }
    },
    "defaults": {
        "zosmf": "lpar1.zosmf",
        "base": "my_base"
    },
    "plugins": [],
    "secure": [
        "profiles.my_base.properties.password",
        "profiles.my_base.properties.user"
    ]
}
```

### Tips for using the base array

The base array is a useful tool for sharing option values between services. You might define options to the base array in the following situations:
- You have multiple services that share the same username, password, or other value.
- You want to store a web token to access all services through Zowe API Mediation Layer.
- You want to trust a known self-signed certificate, or your site does not have server certificates configured. You can define `reject-unauthorized` in the base array with a value of  `false` to apply to all services. Understand the security implications of accepting self-signed certificates at your site before you use this method.

## Sharing global configuration

You might want to share configuration in the following scenarios:
- Share global config with developers so that they can begin working with a defined set of mainframe services. The recipient of the file manually places it in their local `~/.zowe` folder before issuing CLI commands.
- Add global config to your project directory in an SCM tool such as GitHub. This lets other developers pull the project to their local machine and make use of the defined configuration. Zowe CLI commands that you issue from within the project directory automatically use the project's config scheme.
- Enable test automation and CI/CD, letting your pipelines make use of the project configuration.

## Example configurations

In this example configuration, the settings are accessing multiple services directly on multiple LPARs that share the same username and password.

```javascript
{
    "$schema": "./zowe.schema.json",
    "profiles": {
        "lpar1": {
            "properties": {
                "host": "example1.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 443
                    }
                },
                "tso": {
                    "type": "tso",
                    "properties": {
                        "account": "ACCT#",
                        "codePage": "1047",
                        "logonProcedure": "IZUFPROC"
                    }
                },
                "ssh": {
                    "type": "ssh",
                    "properties": {
                        "port": 22
                    }
                }
            }
        },
        "lpar2": {
            "properties": {
                "host": "example2.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 1443
                    }
                }
            }
        },
        "my_base": {
            "type": "base",
            "properties": {
                "rejectUnauthorized": true
            }
        }
    },
    "defaults": {
        "zosmf": "lpar2.zosmf",
        "tso": "lpar1.tso",
        "ssh": "lpar1.ssh",
        "base": "my_base"
    },
    "plugins": [],
    "secure": [
        "profiles.my_base.properties.user",
        "profiles.my_base.properties.password"
    ]
}
```
In this example configuration, the settings are accessing multiple services via the API ML (where MFA/SSO is achievable via token-based authorization).
```javascript
{
    "$schema": "./zowe.schema.json",
    "profiles": {
        "my_zosmf": {
            "type": "zosmf",
            "properties": {
                "basePath": "my_zosmf/api/v1"
            }
        },
        "my_cics": {
            "type": "cics",
            "properties": {
                "basePath": "my_cics/api/v1"
            }
        },
        "my_base": {
            "type": "base",
            "properties": {
                "host": "example1.com",
                "port": 443,
                "rejectUnauthorized": true
            }
        }
    },
    "defaults": {
        "zosmf": "my_zosmf",
        "cics": "my_cics",
        "base": "my_base"
    },
    "plugins": [],
    "secure": [
        "profiles.my_base.properties.authToken"
    ]
}
```
In this example configuration, the settings are accessing multiple services directly on LPAR1 and LPAR2 where username and password varies between the LPAR1 and LPAR2 services. This example is identical to first example except for the secure array at the end.
```javascript
{
    "$schema": "./zowe.schema.json",
    "profiles": {
        "lpar1": {
            "properties": {
                "host": "example1.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 443
                    }
                },
                "tso": {
                    "type": "tso",
                    "properties": {
                        "account": "ACCT#",
                        "codePage": "1047",
                        "logonProcedure": "IZUFPROC"
                    }
                },
                "ssh": {
                    "type": "ssh",
                    "properties": {
                        "port": 22
                    }
                }
            }
        },
        "lpar2": {
            "properties": {
                "host": "example2.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 1443
                    }
                }
            }
        },
        "my_base": {
            "type": "base",
            "properties": {
                "rejectUnauthorized": true
            }
        }
    },
    "defaults": {
        "zosmf": "lpar2.zosmf",
        "tso": "lpar1.tso",
        "ssh": "lpar1.ssh",
        "base": "my_base"
    },
    "plugins": [],
    "secure": [
        "profiles.lpar1.properties.user",
        "profiles.lpar1.properties.password",
        "profiles.lpar2.properties.user",
        "profiles.lpar2.properties.password"
    ]
}
```

In this example configuration, API ML is leveraged to access production services but services on a dev-test environment can be accessed directly.
```javascript
{
    "$schema": "./zowe.schema.json",
    "profiles": {
        "prod": {
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "basePath": "my_zosmf/api/v1"
                    }
                },
                "cics": {
                    "type": "cics",
                    "properties": {
                        "basePath": "my_cics/api/v1"
                    }
                }
            }
        },
        "dev": {
            "properties": {
                "host": "example1.com"
            },
            "profiles": {
                "zosmf": {
                    "type": "zosmf",
                    "properties": {
                        "port": 443
                    }
                },
                "tso": {
                    "type": "tso",
                    "properties": {
                        "account": "ACCT#",
                        "codePage": "1047",
                        "logonProcedure": "IZUFPROC"
                    }
                },
                "ssh": {
                    "type": "ssh",
                    "properties": {
                        "port": 22
                    }
                }
            }
        },
        "my_base": {
            "type": "base",
            "properties": {
                "host": "example1.com",
                "port": 443,
                "rejectUnauthorized": true
            }
        }
    },
    "defaults": {
        "zosmf": "prod.zosmf",
        "cics": "prod.cics",
        "tso": "dev.tso",
        "ssh": "dev.ssh",
        "base": "my_base"
    },
    "plugins": [],
    "secure": [
        "profiles.dev.properties.user",
        "profiles.dev.properties.password",
        "profiles.my_base.properties.authToken"
    ]
}
```

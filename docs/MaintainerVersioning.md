# Versioning
This article describes the versioning scheme used by Zowe CLI and Imperative CLI Framework. We highly recommend that consumers adhere to the [requirements](#requirements), [tentative release schedule](#tentative-release-schedule) and [tag usage](#tag-usage) for versioning.

## Version Number Format and Terminology
The version number contains the following format:
```
BreakingChange.Enhancement.Patch-PrereleaseString
```
Frequently referred to as `"major.minor.patch"`

**Example:**
```
1.2.5-next.201806291712
```

We used the following terms for the three digits (instead of `major.minor.patch`) to reinforce the semantic versioning strategy that we use.

* **BreakingChange**

    This number will change when the product introduces a modification that is **non**-backward-compatible with previous releases.

* **Enhancement**

    This number will change when one or more new backward-compatible features are introduced.

* **Patch**

    This number will change when one or more bug fixes are made available. All modifications within a patch are limited to bug fixes.

* **PrereleaseString**

    This string is a frequently changing text indicator which indicates that a new version of a yet-to-be-released version of the product was available for early validation. In this case, the `BreakingChange.Enhancement.Patch` numbers represent the version number of the product that will be used after the up-coming set of features are delivered as a supported release.

## Tag Names
We tag two releases of our product in an NPM registry. The tag names are as follows:

* **latest**

   This tag points to the latest supported version of the product.
* **next**

   This tag points to a pre-release snapshot of the next version of the product. It is available for validation.

## Requirements
Our versioning scheme contains the following requirements:

* New features will not be introduced for bug fixes.
* Support two stable releases (`@latest` and a previous `@latest`) and our planned `@next`.
* The oldest `@latest` (for example, exactly two stable releases behind) will no longer be tagged `@latest`.
* Each release must be supported for at minimum one calendar year.

## Tentative Release Schedule
The following table shows a tentative Zowe CLI release schedule:

| Zowe CLI Version | Validation Begin | Validation End | Begin Support | End Support |
| ------------------ | ---------------- | -------------- | ------------- | ----------- |
| 1.0.x              | n/a              | n/a            | 05-30-2018    | 05-31-2019  |
| 1.1.x  (or 2.0.x)  | 11-30-2018       | 12-30-2018     | 12-30-2018    | 12-31-2019  |
| TBD                | TBD              | TBD            | TBD           | TBD         |

**Note:** The Date format is `MM-DD-YYYY`.

## Tag Usage
The latest stable supported version contains the following tags:

`npm install -g @brightside/core`

The community edition builds contain the following tags:

`npm install -g @brightside/core@next`

## Version Schema
The following table shows examples of how patches would update version numbers and tags:

| Starting Version    | Tag                      | Support Patch  | New Version           | Tag             |
| ------------------- | -------------------------| -------------- | ----------------------| --------------- |
| 1.0.3               | n/a (back-level support) | On-Demand      | 1.0.4                 | n/a             |
| 1.1.0               | was @latest              | On-Demand      | 1.1.1                 | becomes @latest |
| 1.2.0-next.20180615 | was @next                | Daily Update   | 1.2.0-next.20180616   | becomes @next   |

**Important!** The rows in the above tables refer to a respective stable release of Zowe CLI. The major and minor versions can increment at different cadences than displayed.

## Specifying Compatible Versions in package.json Files
NPM packages typically depend on multiple other NPM packages. For example, Zowe CLI depends on our Imperative framework (@brightside/imperative). Similarly, Zowe CLI plug-ins depend on both Zowe CLI and Imperative (@brightside/core and @brightside/imperative).

For each NPM package on which it depends, an application specifies the version number with which it is compatible. The version specifier can be one specific version number (for example, `1.2.3`), but it does not have to be specific. If the version is too specific, application developers can be burdened with frequent updates to their package.json file to stay up-to-date with every patch produced by the dependent package. If the version is too broad, applications might be paired with a version of the dependent package that has new changes, which can break the application.

## Versions for Zowe CLI Dependencies within Plug-ins
A plug-in specifies the versions of Zowe CLI and Imperative with which it is compatible within the peerDependencies property of its package.json file.

When you install a plug-in into Zowe CLI, the plug-in (always) uses the version of Zowe CLI APIs that are part of the installed application. It also uses the version of Imperative APIs that were installed as part of the Zowe CLI application. Plug-ins never get a different version of Zowe CLI or Imperative, regardless of the versions specified by the plug-in. However, the Zowe CLI plug-in installation program compares the versions specified by the plug-in with the actual versions of Zowe CLI and Imperative. It will issue warnings when incompatible versions were specified. This gives the end user and the plug-in developer notice that corrective action is required to help ensure that the plug-in works reliably with Zowe CLI.

We anticipate that plug-ins will have similar tiers of supported releases and pre-releases as described above.

We recommend the following scheme for specifying Zowe CLI dependencies within plug-ins.

## Recommendation for Supported Versions of Plug-ins
In a supported release, plug-ins should specify that it wants versions of Zowe CLI and Imperative that remain backward-compatible with the versions that were in use when the plug-in reached its supported state. This can be expressed using the following format for both Zowe CLI and Imperative:
```
BreakingChangeUpdate.x
```
**Example:**
```
1.x
```

At the time that this document was published, Zowe CLI was at version `1.0.3` and Imperative was at `1.0.2`. Both packages' peerDependencies versions in a supported plug-in can be specified as `1.x`. This indicates that we anticipate that the plug-in will work with all upcoming bug fixes and with all new features that do not break backward-compatibility, such as `1.1.0`, or `1.4.6`, but not with `2.0.0` or greater). By specifying a version of `1.x`, the plug-in does not have to update its version string and republish frequently just to avoid compatibility warnings when patches and backward-compatible enhancements of Zowe CLI or Imperative are published. For a supported plug-in, this ties the plug-in to a reasonable range of un-breaking changes in Zowe CLI and Imperative. By the time that the next feature release of the plug-in is to be published, either Zowe CLI or Imperative might be specified as `2.x` and you would lock in that level of releases for the life of that supported version of the plug-in.

## Recommendation for Pre-release Versions of plug-ins

An upcoming release of a plug-in might need new features that are currently under development in Zowe CLI or Imperative. Such a plug-in should give itself a pre-release version number of its own. It should also specify the pre-release version of Zowe CLI or Imperative with which the plug-in works correctly. The plug-in should deliver its own pre-releases from the master source code branch for the plug-in using its own pre-release-style version number. For example:

```
BreakingChange.Enhancement.Patch-PrereleaseString
```
**Example:**
```
3.1.0-next.20180827
```
**Note:** You can use any text that you want after the dash for your plug-in's pre-release string.

Such a plug-in must specify that it wants a Zowe CLI or Imperative version with a pre-release tag. NPM requires that all three digits of a dependency version number must be identical to the dependent's version number to use a pre-release-tag dependency.

You can specify pre-release versions for plug-ins using one of the following methods:
* The plug-in can specify the exact Zowe CLI or Imperative pre-release version in its peerDependencies property.

    **Example:**

    ```
    @brightside/imperative": "1.1.0-next.201808241438"
    ```
    Such a version matches only this one snapshot of the Zowe CLI or Imperative pre-release. The plug-in will have to change the version string with each new pre-release snapshot. This requires frequent updates to the plug-in's package.json file, but helps to ensure that the plug-in will never be accidentally compatible with a later stable version of that dependency.

* The plug-in can specify that it wants any version of the peerDependency starting with the earliest version of the current pre-release and any later version for all eternity.

    **Example:**

    ```
    @brightside/imperative": ">=1.1.0-0
    ```
    Such a version matches every pre-release snapshot of `1.1.0`. However, it also matches every new feature release of the dependency (for example, `1.2.0`, `2.5.3`, `14.3.8`, and so on). A plug-in developer never has to change that version string during the pre-release development stage of the plug-in. However, the plug-in developer must remember to change the dependency version to a string such as `1.x` before publishing the supported release of the plug-in to avoid unintended compatibility with future versions of the dependent package.

In either of these methods, plug-in developers must change their desired version more frequently and at critical milestones, which is an acceptable approach because the plug-in itself is in pre-release mode. The plug-in should stay in lockstep with Zowe CLI until the plug-in pre-release becomes a supported release.
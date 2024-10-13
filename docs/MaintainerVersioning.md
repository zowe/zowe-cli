# Versioning

This article describes the versioning scheme used by Zowe CLI and Imperative CLI Framework, and provides examples on how the scheme works.

We highly recommend that consumers adhere to the [requirements](#requirements), [tentative release schedule](#tentative-release-schedule), and [tag usage](#tag-usage) for versioning.

## Version Number Format and Terminology

The version number has following format:

```
BreakingChange.Enhancement.Patch-PrereleaseString
```

This format is frequently referred to as `"major.minor.patch"`

**Example:**

```
2.3.5-daily.201806291712
```

We use the following terms for the three digits (instead of `major.minor.patch`) to reinforce our [semantic versioning](https://semver.org/) strategy.

* **BreakingChange**

    This number changes when the product introduces a modification that is **non**-backward-compatible with previous releases.

* **Enhancement**

    This number changes when one or more new backward-compatible features are introduced.

* **Patch**

    This number changes when one or more bug fixes are made available. All modifications within a patch are limited to bug fixes.

* **PrereleaseString**

    This string is a text indicator that changes frequently. The indicator represents a yet-to-be-released version of the product that is available for early validation. In this case, the `BreakingChange.Enhancement.Patch` numbers represent the version number of the product that will be used as a supported release after the up-coming set of features are delivered.

## NPM Tag Names

We tag various releases of our product in an NPM registry. End users install the product using these tags. The tag names are as follows:

* **`next`**

   This tag points to the most recent pre-release snapshot (alpha version) of the product. It is available for validation until the next snapshot is taken after a feature completion or bug fix.

   **Note:** This version (what the tag points to) is pre-release. It may be unstable and is published sporadically. Breaking changes can be introduced to this version at any time.

* **`latest`**

   This tag points to the "Active Development" version of the CLI. Breaking changes can be introduced to this version at any time.

* **`zowe-v2-lts`**

   This tag points to the current Long Term Support (LTS) version of the product.

   **Note:** This version (what the tag points to) will be updated to introduce backward-compatible enhancements and bug fixes, but *not* breaking changes.

* **`zowe-v1-lts`**

   This tag points to the stable Long Term Support (LTS) version of the product.

   **Note:** This version (what the tag points to) will be updated to introduce backward-compatible bug fixes, but *not* enhancements or breaking changes.

* **`lts-incremental` *DEPRECATED***

   This tag points to a previous Long Term Support (LTS) version of the product.

   **Note:** This version (what the tag points to) will only be updated to provide bug fixes.

* **`lts-stable` *DEPRECATED***

  This tag is deprecated.

* **`daily` *DEPRECATED***

   This tag is deprecated.

## Requirements

Our versioning scheme has the following requirements:

* New features are not introduced for bug fixes.
* Support two stable releases: `@zowe-v2-lts` and `@zowe-v1-lts`
* Each release must be supported for a minimum of one calendar year.

## Tentative Release Schedule

See the [Zowe Community Release Schedule](https://github.com/zowe/community/blob/master/Project%20Management/Schedule/Zowe%20PI%20%26%20Sprint%20Cadence.md#Releases)

## Tag Usage

The following is a list of commands that users issue to install product versions:

* To obtain the most current version:

  `npm install -g @zowe/cli` OR `npm install -g @zowe/cli@latest`

* To obtain the supported active LTS version:

  `npm install -g @zowe/cli@zowe-v2-lts`

* To obtain the supported stable version:

  `npm install -g @zowe/cli@zowe-v1-lts`

## Specifying Compatible Versions in package.json Files

NPM packages typically depend on multiple other NPM packages. For example, Zowe CLI depends on our Imperative CLI Framework (@zowe/imperative). Similarly, Zowe CLI plug-ins can depend on both Zowe CLI and Imperative CLI Frameworks (@zowe/core-for-zowe-sdk and @zowe/imperative).

For each NPM package on which Zowe depends, an application specifies the version number with which it is compatible. The version specifier can be one specific version number (for example, `1.2.3`), but it does not have to be specific. If the version is too specific, application developers can be burdened with frequent updates to their package.json file to stay up-to-date with every patch produced by the dependent package. If the version is too broad, applications might be paired with a version of the dependent package that has new changes, which can break the application.

## Versions for Zowe CLI Dependencies within Plug-ins

In the `peerDependencies` property of a plug-in's `package.json` file, the plug-in specifies the versions of the Imperative CLI Framework with which it is compatible.

When you install a plug-in into Zowe CLI, the plug-in always uses the version of Zowe CLI APIs that are part of the installed application. It also uses the version of Imperative APIs that were installed as part of the Zowe CLI application. Plug-ins never get a different version of Zowe CLI or Imperative, regardless of the versions specified by the plug-in. However, the Zowe CLI plug-in installation program compares the versions specified by the plug-in with the actual versions of Zowe CLI and Imperative. It will issue warnings when incompatible versions were specified. This notifies the end user and the plug-in developer that corrective action is required to ensure that the plug-in works reliably with Zowe CLI.

We anticipate that plug-ins will have similar tiers of supported releases and pre-releases as described above.

We recommend the following scheme for specifying Zowe CLI dependencies within plug-ins:

## Recommendation for Supported Versions of Plug-ins

In a supported release, a plug-in should specify that it wants versions of Imperative that remain backward-compatible with the versions that were in use when the plug-in reached its supported state. This can be expressed using the following format for Imperative:

```
BreakingChangeUpdate.x OR BreakingChangeUpdate.Enhancement.x
```

**Example:**

```
2.x OR 2.2.x
```

At the time that this document was published, Imperative was at version `1.0.8`. Imperative's `peerDependencies` version in a supported plug-in can be specified as `1.x`. This indicates that we anticipate that the plug-in will work with all upcoming bug fixes and with all new features that do not break backward-compatibility, such as `1.1.0`, or `1.4.6`, but not with `2.0.0` or greater. By specifying a version of `1.x`, the plug-in does not have to update its version string and republish frequently just to avoid compatibility warnings when patches and backward-compatible enhancements of Imperative are published. For a supported plug-in, this ties the plug-in to a reasonable range of non-breaking changes in Zowe CLI and Imperative. By the time that the next feature release of the plug-in is published, Imperative might be specified as `2.x` and you would lock in that level of releases for the life of that supported version of the plug-in.

## Recommendation for Pre-release Versions of plug-ins

An upcoming release of a plug-in might require new features that are currently under development in Zowe CLI or Imperative. Such a plug-in should give itself a pre-release version number of its own. It should also specify the pre-release version of Zowe CLI or Imperative with which the plug-in works correctly. The plug-in should deliver its own pre-releases from the master source code branch for the plug-in using its own pre-release-style version number. For example:

```
BreakingChange.Enhancement.Patch-PrereleaseString
```

**Example:**

```
3.1.0-alpha.201808271259
```

**Note:** You can choose to use any text after the dash for your plug-in's pre-release string.

In this case, a plug-in must specify that it wants a Zowe CLI or Imperative version with a pre-release tag. NPM requires that all three digits of a dependency version number must be identical to the dependent's version number to use a pre-release-tag dependency.

You can specify pre-release versions for plug-ins using one of the following methods:

* The plug-in can specify the exact Zowe CLI or Imperative pre-release version in its peerDependencies property.

    **Example:**

    ```
    "@zowe/imperative": "8.0.0-next-202408131445"
    ```

    Such a version matches only this one snapshot of the Zowe CLI or Imperative pre-release. The plug-in will have to change the version string with each new pre-release snapshot. This requires frequent updates to the plug-in's package.json file, but helps to ensure that the plug-in will never be accidentally compatible with a later stable version of that dependency.

* The plug-in can specify that it wants any version of the `peerDependency` starting with the earliest version of the current pre-release and any later version going forward. This includes all GA versions of the `peerDependency` with the same major version, starting at 8.0.0:

    **Example:**

    ```
    "@zowe/imperative": ">=8.0.0-next-202408131445 <9.0.0"
    ```

    Such a version matches every pre-release snapshot of `8.0.0`. However, it also matches every new feature release of the dependency (for example, `8.1.0`, `8.1.1`, and so on). A plug-in developer never has to change that version string during the pre-release development stage of the plug-in. However, the plug-in developer must remember to change the dependency version to a string such as `^8.0.0` before publishing the supported release of the plug-in to avoid unintended compatibility with future versions of the dependent package, or declared compatibility with a pre-release.

In either of these methods, plug-in developers must change their desired version more frequently and at critical milestones, which is an acceptable approach because the plug-in itself is in pre-release mode. The plug-in should stay in lockstep with Zowe CLI until the plug-in pre-release becomes a supported release.

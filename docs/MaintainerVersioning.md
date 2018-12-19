# Versioning

This article describes the versioning scheme used by Zowe CLI and Imperative CLI Framework, and provides [examples](#example-timeline) on how such scheme will work.

We highly recommend that consumers adhere to the [requirements](#requirements), [tentative release schedule](#tentative-release-schedule) and [tag usage](#tag-usage) for versioning.

## Version Number Format and Terminology

The version number contains the following format:

```
BreakingChange.Enhancement.Patch-PrereleaseString
```

Frequently referred to as `"major.minor.patch"`

**Example:**

```
2.3.5-beta.201806291712
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

We tag various releases of our product in an NPM registry. The tag names are as follows:

* **`daily`**

   This tag points to the most recent pre-release snapshot (alpha version) of the product. It is available for validation.

* **`beta`**

   This tag points to the yet-to-become-community-edition version of the product. This pre-release snapshot is avalilable for validation.

* **`latest`**

   This tag points to the latest community edition version of the product. This version is intended for public consumption.

* **`lts-incremental-v<MAJOR>`**

   This tag points to a Long Term Support (LTS) Incremental version of the product.
   
   The `<MAJOR>` indicator is a number which matches the supported new-feature-friendly version of the product. For example: `lts-incremental-v2`

   **Note:** This version (what the tag points to) can and will be updated to introduce new backward-compatible enhancements as well as bug fixes.

* **`lts-stable-v<MAJOR>.<MINOR>`**

  This tag points to a Long Term Support (LTS) Stable version of the product.

  The `<MAJOR>.<MINOR>` indicator is a number which matches the supported no-feature-chaging version of the product. For example: `lts-stable-v2.1`

  **Note:** This version (what the tag points to) can and will be updated only when there are bug fixes.

* **`next` *DEPRECATED***

  This tag is deprecated and will not be changing.

See the [example timeline](#example-timeline) for examples on when the above versions will likely get updated.

## Requirements

Our versioning scheme contains the following requirements:

* New features will not be introduced for bug fixes.
* Support two stable releases, `@lts-incremental-vX` and `@lts-stable-vX.Y`
* Each release must be supported for at minimum one calendar year.

## Tentative Release Schedule

The following table shows a tentative Zowe CLI release schedule:

| Zowe CLI Version | Validation Begin | Validation End | Begin Support | End Support |
| ----- | ----------- | ----------- | ----------- | ------------ |
| 1.0.x | n/a         | n/a         | 05-30-2018  | **07-31-2019 |
| 2.x.x | n/a         | 01-21-2019  | 01-22-2019  | 01-22-2020   |
| 3.x.x | 01-22-2019  | *07-30-2019 | *07-31-2019 | *07-31-2020  |
| 4.x.x | *07-31-2019 | *01-30-2020 | *01-31-2020 | *01-31-2021  |
| 5.x.x | *01-31-2020 | *07-30-2020 | *07-31-2020 | *07-31-2021  |
| TBD   | TBD         | TBD         | TBD         | TBD          |

**(`*`)** This is a rough calculation.

**(`**`)** This is an attempt to normalize the release schedule.

**Note:** The Date format is `MM-DD-YYYY`.

**Note:** This release schedule is subject to change.

## Tag Usage

* To obtain the beta validation version:

  `npm install -g @brightside/core@beta`

* To obtain the most current community edition version:

  `npm install -g @brightside/core` OR `npm install -g @brightside/core@latest`

* To obtain the supported incremental version:

  `npm install -g @brightside/core@lts-incrementsl.v<MAJOR>`

* To obtain the supported stable version:

  `npm install -g @brightside/core@lts-stable.v<MAJOR>.<MINOR>`


## Example timeline

The version numbering below is not an exact sequence, it just represents possible sequences to help illustrate how this versioning process will work.

These versions occurred before this proposed scheme was used. The newest patches would have been labeled LTS-stable in the past.

```
- 1.0.0
    - 1.0.1
    - 1.0.2
    - ...
    - 1.0.10  @lts-stable-v1.0
```

A breaking change is a trigger for a new LTS release. Thereafter, the newest non-breaking enhancement or bug fix would have been tagged with LTS-incremental.

```
- 2.0.0
    - 2.0.1
- 2.1.0
    - 2.1.1
    - 2.1.2
    - 2.1.3
- 2.2.0
    - 2.2.1
    - 2.2.2
    - 2.2.3
    - 2.2.4  @lts-incremental-v2
```

Product Management (and the passing of another calendar year) determined that 1.0 should be decommissioned. Version 2.3.0 became LTS-incremental. Version 2.2.2 could have been tagged as LTS-stable. Thereafter, the LTS-stable tag would have moved forward with the newest 2.2.x patch above, and the LTS-incremental tag would have moved forward with the newest 2.x.x version below.

```
- 2.2.0
    - 2.2.1
    - 2.2.2
    - 2.2.3
    - 2.2.4  @lts-stable-v2.2
- 2.3.0
    - 2.3.1
    - 2.3.2
- 2.4.0
- 2.5.0      @lts-incremental-v2
```

Assume that this is our current point in time. Assume that 2.x has been decommissioned, and the 3.2.0 release is tagged as LTS-stable. Only patches (3.2.x) will be delivered for this LTS release. The LTS-stable tag will move to each such new patch release.

```
- 3.0.0
    - 3.0.1
    - 3.0.2
- 3.1.0
    - 3.1.1
    - 3.1.2
- 3.2.0      @LTS-stable-v3.2
```

When 4.0.0 was delivered, it was tagged as LTS-incremental. Thereafter, each new non-breaking enhancement or bug fix was tagged as LTS-incremental. At this point in time, the 4.1.3 version is tagged as LTS-incremental. Additional non-breaking enhancements and bug fixes may be introduced in the future, and LTS-incremental will move to that new version.

```
- 4.0.0
    - 4.0.1
- 4.1.0
    - 4.1.1
    - 4.1.2
    - 4.1.3   @lts-incremental.v4
```

New development is also in progress on a 5.x feature-set which includes breaking changes. With each merge to our master branch, a new alpha version with a pre-release string is published, for example `5.4.0-alpha.201912301259`. It will be tagged as `@daily` to prevent NPM from automatically moving the latest tag to this new version. At the end of each sprint, the newest pre-release version produced in that sprint is tagged as `@beta`, for example `5.4.0-beta.201912301259`.
To provide an opportunity for validation of that new beta release, we wait for one sprint (2 weeks). At the end of each sprint, we republish the previous beta release with no pre-release string (5.6.0 in the example below) and label that release as `@latest`. We then move the `@beta` label to the newest pre-release produced in the just-completed sprint.

```
- 5.0.0
    - Numerous pre-releases
- 5.1.0
    - Numerous pre-releases
    - 5.1.1
- 5.2.0
    - Numerous pre-releases
- 5.3.0
    - Numerous pre-releases
- 5.4.0
    - Numerous pre-releases
- 5.5.0                         @latest - Was assigned at the end of sprint N.
- 5.6.0-FirstDateInSprintN
- 5.6.0-SecondDateInSprintN
- 5.6.0-DateAtEndOfSprintN      @beta - Was assigned at end of sprint N.
- 5.7.0-FirstDateInSprintN+1
- 5.7.0-SecondDateInSprintN+1
- 5.7.0-DateAtEndOfSprintN+1    Now move @beta to 5.7.0-DateAtEndOfSprintN+1
- 5.6.0                         Version 5.6.0 is published at the end of sprint N+1
                                Now move @latest to 5.6.0
```

## Specifying Compatible Versions in package.json Files

NPM packages typically depend on multiple other NPM packages. For example, Zowe CLI depends on our Imperative framework (@brightside/imperative). Similarly, Zowe CLI plug-ins depend on both Zowe CLI and Imperative (@brightside/core and @brightside/imperative).

For each NPM package on which it depends, an application specifies the version number with which it is compatible. The version specifier can be one specific version number (for example, `1.2.3`), but it does not have to be specific. If the version is too specific, application developers can be burdened with frequent updates to their package.json file to stay up-to-date with every patch produced by the dependent package. If the version is too broad, applications might be paired with a version of the dependent package that has new changes, which can break the application.

## Versions for Zowe CLI Dependencies within Plug-ins

A plug-in specifies the versions of Zowe CLI and Imperative with which it is compatible within the peerDependencies property of its package.json file.

**Note:** `peerDependencies` will not be a requirement in the future once **[issue 99](https://github.com/zowe/imperative/issues/99)** is resolved.

When you install a plug-in into Zowe CLI, the plug-in (always) uses the version of Zowe CLI APIs that are part of the installed application. It also uses the version of Imperative APIs that were installed as part of the Zowe CLI application. Plug-ins never get a different version of Zowe CLI or Imperative, regardless of the versions specified by the plug-in. However, the Zowe CLI plug-in installation program compares the versions specified by the plug-in with the actual versions of Zowe CLI and Imperative. It will issue warnings when incompatible versions were specified. This gives the end user and the plug-in developer notice that corrective action is required to help ensure that the plug-in works reliably with Zowe CLI.

We anticipate that plug-ins will have similar tiers of supported releases and pre-releases as described above.

We recommend the following scheme for specifying Zowe CLI dependencies within plug-ins.

## Recommendation for Supported Versions of Plug-ins

In a supported release, plug-ins should specify that it wants versions of Zowe CLI and Imperative that remain backward-compatible with the versions that were in use when the plug-in reached its supported state. This can be expressed using the following format for both Zowe CLI and Imperative:

```
BreakingChangeUpdate.x OR BreakingChangeUpdate.Enhancement.x
```

**Example:**

```
2.x OR 2.2.x
```

At the time that this document was published, Zowe CLI was at version `1.0.7` and Imperative was at `1.0.8`. Both packages' peerDependencies versions in a supported plug-in can be specified as `1.x`. This indicates that we anticipate that the plug-in will work with all upcoming bug fixes and with all new features that do not break backward-compatibility, such as `1.1.0`, or `1.4.6`, but not with `2.0.0` or greater). By specifying a version of `1.x`, the plug-in does not have to update its version string and republish frequently just to avoid compatibility warnings when patches and backward-compatible enhancements of Zowe CLI or Imperative are published. For a supported plug-in, this ties the plug-in to a reasonable range of un-breaking changes in Zowe CLI and Imperative. By the time that the next feature release of the plug-in is to be published, either Zowe CLI or Imperative might be specified as `2.x` and you would lock in that level of releases for the life of that supported version of the plug-in.

## Recommendation for Pre-release Versions of plug-ins

An upcoming release of a plug-in might need new features that are currently under development in Zowe CLI or Imperative. Such a plug-in should give itself a pre-release version number of its own. It should also specify the pre-release version of Zowe CLI or Imperative with which the plug-in works correctly. The plug-in should deliver its own pre-releases from the master source code branch for the plug-in using its own pre-release-style version number. For example:

```
BreakingChange.Enhancement.Patch-PrereleaseString
```

**Example:**

```
3.1.0-alpha.201808271259
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
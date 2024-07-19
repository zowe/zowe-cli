# Zowe CLI Releases

Zowe follows a regular release schedule with major versions released every two years and minor versions approximately every six weeks. Full details regarding the Zowe release schedule are available on [zowe.org](https://www.zowe.org/download#timeline) and the Zowe Community [Github](https://github.com/zowe/community/blob/master/Technical-Steering-Committee/release.md).

## Zowe Release Schedule

### Zowe v3.x LTS Releases
|  Version | Release Date |  Status    | Release Notes |
|:--------:|:------------:|:----------:|:-------------:|
| v3.0.0 | 2024-07-19 | **Active** | [Release Notes](https://docs.zowe.org/stable/whats-new/release-notes/v3_0_0) |    |

### Major Release Timeline

![Zowe Major Releases](https://raw.githubusercontent.com/zowe/zowe.github.io/master/assets/img/major_releases.webp)

### Version Timeframes

- **Active**: Each major version remains in this phase for 2 years, receiving regular updates and new features.
- **Maintenance**: Following the Active phase, each major version remains in this phase for an additional 2.5 years, receiving only critical fixes and security patches.
- **Under Development**: The pre-Active phase where the next major version is prepared. This phase varies in length and is not available for general consumption.

### Guarantees

- **Critical Defects Fixes**: The community will fix critical defects. The criteria for what constitutes a critical defect can be found [here](https://github.com/zowe/community/blob/master/Technical-Steering-Committee/release.md#active-release).
- **Extender Conformance**: Extenders achieving Zowe conformance for the long-term support version will not need to modify their product to remain functional when Zowe updates are provided within the same major version.

### Recommendations

- **Production**: Use **Active** or **Maintenance** releases for production due to the guaranteed stability and the community’s commitment to fixing critical defects.
- **Nightly Builds**: Available for integration testing. Use at your own risk.

## Zowe Release Process

### Short Summary

1. Code Freeze date is hit.
2. Each [squad](https://github.com/zowe/community/blob/master/Technical-Steering-Committee/squads.md) provides a version of the code to integrate into the Release Candidate (RC).
3. RC is built and tested with an automatic test suite.
4. RC is deployed and tested by squads.
5. RC is approved by the TSC vote.
6. Release is published.
7. Documentation is published.
8. Release retrospective is held.

### Release Numbering

Releases follow [semantic versioning](https://semver.org/) guidelines (MAJOR.MINOR.PATCH).

- **MAJOR**: Incompatible API changes.
- **MINOR**: Backwards-compatible functionality additions.
- **PATCH**: Backwards-compatible bug fixes.

### Release Content

The following [components of the release](https://github.com/zowe/community/blob/master/Technical-Steering-Committee/release.md#release-content) are managed by the CLI squad:

- **CLI Component**
  - CLI Core
  - CLI Plugins
- **Client SDKs**
  - Node.js Client SDK
  - Python Client SDK


## Zowe CLI Squad

- [@gejohnston](https://github.com/gejohnston) - Gene Johnston
- [@zFernand0](https://github.com/zFernand0) - Fernando Rijo Cedeno
- [@t1m0thyj](https://github.com/t1m0thyj) - Timothy Johnson
- [@awharn](https://github.com/awharn) - Andrew W. Harn
- [@ATorrise](https://github.com/ATorrise) - Amber Torrise
- [@traeok](https://github.com/traeok) - Trae Yelovich
- [@jace-roell](https://github.com/jace-roell) - Jace Roell

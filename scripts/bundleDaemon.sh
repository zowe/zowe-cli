#!/bin/bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
repoRoot=$PWD
daemonVersion=$(cd zowex && cargo metadata --no-deps --format-version 1 | jq -er .packages[0].version)
releaseTag="native-v$daemonVersion"
repository=zowe/zowe-cli

export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

stagingDir=$(mktemp -d)
trap 'rm -rf "$stagingDir"' EXIT
cd "$stagingDir"

# Wait up to 30 minutes for the release to be published.
for attempt in {1..60}; do
    if gh release view "$releaseTag" --repo "$repository" --json isDraft,isImmutable \
        > release.json 2> release-error.log && jq -e '.isDraft == false' release.json >/dev/null; then
        break
    fi
    echo "Waiting for Rust CLI Publish workflow to complete..."
    sleep 30
done
jq -e '.isDraft == false and .isImmutable == true' release.json >/dev/null || {
    cat release-error.log >&2
    echo "$releaseTag must be published with release immutability enabled" >&2
    exit 1
}

releaseUrl="https://github.com/$repository/releases/download/$releaseTag"

for platform in linux macos windows; do
    curl -fsSL -o "zowe-$platform.tgz" "$releaseUrl/zowe-$platform.tgz"
    gh release verify-asset "$releaseTag" "zowe-$platform.tgz" --repo "$repository"
    gh attestation verify "zowe-$platform.tgz" --repo "$repository" \
        --signer-workflow "$repository/.github/workflows/rust-cli-publish.yml" \
        --deny-self-hosted-runners
done

# Fetch metadata from the immutable release tag.
for file in Cargo.toml Cargo.lock; do
    curl -fsSL -o "$file" "https://raw.githubusercontent.com/$repository/$releaseTag/zowex/$file"
done

# No package files are touched until every archive has passed verification.
mkdir -p "$repoRoot/packages/cli/prebuilds"
mv zowe-linux.tgz zowe-macos.tgz zowe-windows.tgz Cargo.toml Cargo.lock \
    "$repoRoot/packages/cli/prebuilds/"

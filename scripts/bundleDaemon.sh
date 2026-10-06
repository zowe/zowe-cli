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
curl -fsSL -o SHA256SUMS "$releaseUrl/SHA256SUMS"

# Bind the manifest to the requested release and verify its source commit.
sourceCommit=$(sed -n '2s/^# source //p' SHA256SUMS)
[[ $(head -n 1 SHA256SUMS) == "# $releaseTag" && "$sourceCommit" =~ ^[0-9a-f]{40}$ ]] || {
    echo "Invalid checksum manifest for $releaseTag" >&2
    exit 1
}
gh attestation verify SHA256SUMS --repo "$repository" \
    --signer-workflow "$repository/.github/workflows/rust-cli-publish.yml" \
    --source-digest "$sourceCommit" --deny-self-hosted-runners

for platform in linux macos windows; do
    curl -fsSL -o "zowe-$platform.tgz" "$releaseUrl/zowe-$platform.tgz"
    # Check only expected filenames, requiring a pinned digest for each archive.
    grep -E "^[0-9a-f]{64}  zowe-$platform\.tgz$" SHA256SUMS | sha256sum --strict -c -
done

# Fetch metadata from the attested commit.
for file in Cargo.toml Cargo.lock; do
    curl -fsSL -o "$file" "https://raw.githubusercontent.com/$repository/$sourceCommit/zowex/$file"
done

# No package files are touched until every archive has passed verification.
mkdir -p "$repoRoot/packages/cli/prebuilds"
mv zowe-linux.tgz zowe-macos.tgz zowe-windows.tgz Cargo.toml Cargo.lock \
    "$repoRoot/packages/cli/prebuilds/"

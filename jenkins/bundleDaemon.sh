#!/bin/bash
# Usage: bash bundleDaemon.sh <daemonVersion> [githubAuthHeader]
set -ex

daemonVersion=$1
githubAuthHeader=$2

until [[ $(curl -fs https://$githubAuthHeader@api.github.com/repos/zowe/zowe-cli/releases/tags/native-v$daemonVersion |
    jq -r '.assets | length') == "3" ]]; do
    echo "Waiting for Rust CLI Publish workflow to complete..."
    sleep 30
done

cd "$(git rev-parse --show-toplevel)"
rm -rf prebuilds
mkdir prebuilds && cd prebuilds

for platform in linux macos windows; do
    curl -fsLOJ https://github.com/zowe/zowe-cli/releases/download/native-v$daemonVersion/zowe-$platform.tgz
done

cd ..
mv prebuilds packages/cli/

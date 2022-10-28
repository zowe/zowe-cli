#!/bin/bash
set -ex

cd "$(git rev-parse --show-toplevel)"
daemonVersion=$(cd zowex && cargo metadata --no-deps | jq -r .packages[0].version)

until [[ $(curl -fs https://$GITHUB_TOKEN@api.github.com/repos/zowe/zowe-cli/releases/tags/native-v$daemonVersion |
    jq -r '.assets | length') == "3" ]]; do
    echo "Waiting for Rust CLI Publish workflow to complete..."
    sleep 30
done

rm -rf prebuilds
mkdir prebuilds && cd prebuilds

for platform in linux macos windows; do
    curl -fsLOJ https://github.com/zowe/zowe-cli/releases/download/native-v$daemonVersion/zowe-$platform.tgz
done

curl -fsLOJ https://raw.githubusercontent.com/zowe/zowe-cli/native-v$daemonVersion/zowex/Cargo.toml
curl -fsLOJ https://raw.githubusercontent.com/zowe/zowe-cli/native-v$daemonVersion/zowex/Cargo.lock

cd ..
mkdir -p packages/cli/prebuilds
mv prebuilds/* packages/cli/prebuilds/

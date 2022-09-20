#!/bin/bash
set -ex

cd "$(git rev-parse --show-toplevel)"
keytarVersion=$(jq -r .version node_modules/keytar/package.json)

rm -rf prebuilds
mkdir prebuilds && cd prebuilds

curl -fs https://$GITHUB_TOKEN@api.github.com/repos/atom/node-keytar/releases/tags/v$keytarVersion |
    jq -r '.assets[] | select (.browser_download_url) | .browser_download_url' | tr -d '\r' |
    while read -r bdu; do curl -fsLOJ $bdu; done

tar -czvf ../keytar-prebuilds.tgz *
cd ..
mkdir -p packages/cli/prebuilds
mv prebuilds/* packages/cli/prebuilds/

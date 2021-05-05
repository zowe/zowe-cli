#!/bin/bash
# Usage: bash bundleKeytar.sh <keytarVersion> [githubAuthHeader]
set -ex

keytarVersion=$1
githubAuthHeader=$2

cd "$(git rev-parse --show-toplevel)"
rm -rf prebuilds
mkdir prebuilds && cd prebuilds

curl -fs https://$githubAuthHeader@api.github.com/repos/atom/node-keytar/releases/tags/v$keytarVersion |
    jq -r '.assets[] | select (.browser_download_url) | .browser_download_url' |
    while read -r bdu; do curl -fsLOJ $bdu; done

tar -czvf ../keytar-prebuilds.tgz *
cd ..

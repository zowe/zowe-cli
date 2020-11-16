#!/bin/bash
# Usage: bash bundleKeytar.sh [githubAuthHeader]
# Requires "jq" binary to be on your PATH or in packages/cli/node_modules/.bin
set -ex

cd packages/cli
githubAuthHeader=$1

rm -rf prebuilds
mkdir prebuilds && cd prebuilds

dos2unix="tr -d '\r'"
jqBin=`which jq || echo "npx jq"`
keytarVersion=`node -e "console.log(require('../package.json').dependencies.keytar)"`

curl -fs https://$githubAuthHeader@api.github.com/repos/atom/node-keytar/releases/tags/v$keytarVersion |
    $jqBin -c '.assets[] | select (.name | contains("node"))' |
    $jqBin -cr 'select (.browser_download_url) | .browser_download_url' |
    $dos2unix |
    while read -r bdu; do curl -fsL -o `echo -n $(echo -n $bdu | md5sum | cut -c1-6)'-'$(basename $bdu)` $bdu; done

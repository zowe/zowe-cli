#!/bin/bash
set -ex

cd "$(git rev-parse --show-toplevel)"
sed -i "s/join(__dirname, 'keyring/join(__dirname, 'prebuilds', 'keyring/g" index.js
sed -i "s|require('./keyring|require('./prebuilds/keyring|g" index.js
targets=("aarch64-apple-darwin"
         "aarch64-pc-windows-msvc"
         "aarch64-unknown-linux-gnu"
         "aarch64-unknown-linux-musl"
         "armv7-unknown-linux-gnueabihf"
         "i686-pc-windows-msvc"
         "i686-unknown-linux-gnu"
         "x86_64-apple-darwin"
         "x86_64-pc-windows-msvc"
         "x86_64-unknown-linux-gnu"
         "x86_64-unknown-linux-musl")
rm -rf prebuilds && mkdir -p prebuilds
for target in "${targets[@]}"; do
  gh run download --dir prebuilds --name "bindings-$target"
done

#!/bin/bash
set -ex
rm -rf prebuilds && mkdir -p prebuilds
gh run download --dir prebuilds --pattern "bindings-*"
mv prebuilds/*/* prebuilds && rm -r prebuilds/*/
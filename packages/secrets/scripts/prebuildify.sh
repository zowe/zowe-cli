#!/bin/bash
set -ex
rm -rf prebuilds && mkdir -p prebuilds
SECRETS_BRANCH="${SECRETS_BRANCH:-master}"
SECRETS_WORKFLOW_ID=$(gh run list -b $SECRETS_BRANCH --limit 1 --status success --workflow "Secrets SDK CI" --json databaseId --jq ".[0].databaseId")
echo "Downloading Secrets SDK prebuilds from $SECRETS_BRANCH branch..."
gh run download $SECRETS_WORKFLOW_ID --dir prebuilds --pattern "bindings-*"
mv prebuilds/*/* prebuilds && rm -r prebuilds/*/
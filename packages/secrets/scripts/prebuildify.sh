#!/bin/bash
set -ex
rm -rf prebuilds && mkdir -p prebuilds
if [ -z "$SECRETS_BRANCH" ]; then
    SECRETS_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi
# Restrict to push-triggered runs; pull_request runs can come from forks under any branch name.
SECRETS_WORKFLOW_ID=$(gh run list -b "$SECRETS_BRANCH" -e push --limit 1 --status success --workflow "Secrets SDK CI" --json databaseId --jq ".[0].databaseId")
if [ -z "$SECRETS_WORKFLOW_ID" ]; then
    echo "No successful push-triggered Secrets SDK CI run found for branch $SECRETS_BRANCH" >&2
    exit 1
fi
echo "Downloading Secrets SDK prebuilds from $SECRETS_BRANCH branch..."
gh run download "$SECRETS_WORKFLOW_ID" --dir prebuilds --pattern "bindings-*"
mv prebuilds/*/* prebuilds && rm -r prebuilds/*/

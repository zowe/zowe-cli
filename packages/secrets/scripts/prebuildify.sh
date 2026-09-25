#!/bin/bash
set -ex
rm -rf prebuilds && mkdir -p prebuilds

REPO=zowe/zowe-cli
SECRETS_BRANCH=${SECRETS_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}

# pull_request runs can come from forks under any branch name; only trust runs from this repo.
SECRETS_RUN_ID=$(gh api --method GET "repos/$REPO/actions/workflows/secrets-sdk.yml/runs" \
    -f branch="$SECRETS_BRANCH" -f status=success -f per_page=100 \
    --jq "[.workflow_runs[] | select(.head_repository.full_name == \"$REPO\")][0].id")

if [[ -n "$SECRETS_RUN_ID" ]] && gh run download "$SECRETS_RUN_ID" --dir prebuilds --pattern "bindings-*"; then
    mv prebuilds/*/* prebuilds && rm -r prebuilds/*/
    exit 0
fi

# No usable CI run for this branch - fall back to the currently published version
rm -rf prebuilds && mkdir -p prebuilds
PKG_SPEC=$(node -p "require('./package.json').name + '@' + require('./package.json').version")
TMP=$(mktemp -d)
npm pack "$PKG_SPEC" --pack-destination "$TMP" --silent
tar -xzf "$TMP"/*.tgz -C "$TMP"
mv "$TMP"/package/prebuilds/*.node prebuilds/

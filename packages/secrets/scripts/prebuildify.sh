#!/bin/bash
set -euo pipefail
set -x

rm -rf prebuilds && mkdir -p prebuilds

if [ -z "${SECRETS_BRANCH:-}" ]; then
    SECRETS_BRANCH=$(git rev-parse --abbrev-ref HEAD)
fi

if [ -z "${SECRETS_COMMIT:-}" ]; then
    SECRETS_COMMIT=$(git rev-parse HEAD)
fi

echo "Looking for Secrets SDK prebuilds for branch '${SECRETS_BRANCH}' (commit ${SECRETS_COMMIT})..."

RUNS_JSON=$(gh run list --workflow "Secrets SDK CI" --status success --limit 50 --json databaseId,headSha,headBranch)
SECRETS_WORKFLOW_ID=$(echo "$RUNS_JSON" | jq -r --arg sha "$SECRETS_COMMIT" 'map(select(.headSha == $sha)) | .[0].databaseId // empty')

if [ -z "${SECRETS_WORKFLOW_ID}" ]; then
    echo "Unable to find a successful 'Secrets SDK CI' workflow run for commit ${SECRETS_COMMIT}."
    echo "Please trigger the workflow for this ref (e.g. 'gh workflow run secrets-sdk.yml --ref ${SECRETS_BRANCH}') before publishing."
    exit 1
fi

echo "Downloading Secrets SDK prebuilds from workflow run ${SECRETS_WORKFLOW_ID}..."
gh run download "${SECRETS_WORKFLOW_ID}" --dir prebuilds --pattern "bindings-*"
mv prebuilds/*/* prebuilds && rm -r prebuilds/*/

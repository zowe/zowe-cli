#!/bin/bash
FORCE_COLOR=0
OUTPUT="$(imperative-test-cli profiles create secured-profile $2 --info "Not a secret" --secret "$1" --ow)"
RC=$?
if [ $RC -ne 0 ]
then
    echo "Create profile command returned a non-zero RC: $?" 1>&2
    echo "$OUTPUT"
    exit $RC
fi
imperative-test-cli profiles list secured-profiles --show-contents
RC=$?
if [ $RC -ne 0 ]
then
    echo "List profiles command returned a non-zero RC: $?" 1>&2
    exit $RC
fi
exit $?
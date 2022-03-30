#!/bin/bash
set -e

echo "========= Z/OS FILES UPLOAD FROM STDIN ========="
cat << ___ENDCAT | zowe zos-files upload stdin-to-data-set --host fakehost --user fakeuser --pw fakepass $*
This text was uploaded through standard input on
`date`
___ENDCAT

if [ $? -gt 0 ]
then
    exit $?
fi

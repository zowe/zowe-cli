#!/bin/bash
set -e
zosFile=$1
shift

echo "========= Z/OS FILES UPLOAD FROM STDIN ========="
cat << ___ENDCAT | bright zos-files upload stdin-to-data-set "$zosFile" $*
This text was uploaded through standard input on
`date`
___ENDCAT

if [ $? -gt 0 ]
then
    exit $?
fi

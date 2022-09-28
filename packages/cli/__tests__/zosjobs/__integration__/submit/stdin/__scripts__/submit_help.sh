set -e

zowe zos-jobs submit stdin -h
if [ $? -gt 0 ]
then
    exit $?
fi

zowe zos-jobs submit stdin --help --response-format-json
exit $?
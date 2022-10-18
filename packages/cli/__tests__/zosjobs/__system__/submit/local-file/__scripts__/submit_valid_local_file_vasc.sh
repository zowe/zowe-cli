#!/bin/bash
 # pass the data set name as an argument to the script
zowe zos-jobs submit local-file "$1" $2
exit $?
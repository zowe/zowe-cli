#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
zowe zos-tso start app --app-key "test2" --startup "EXEC 'CUST009.PUBLIC.REXX(TESTADRS)'" --account $account --host $host --port $port --user $user --password $password --ru $ru
exit $?

#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
servletKey=$7
queueID=$8
file=$9
zowe zos-tso start app --app-key "test2" --startup "EXEC '$file'" --servlet-key $servletKey --queue-id $queueID --account $account --host $host --port $port --user $user --password $password --ru $ru
exit $?

#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
ussName=$7
encoding=$8

zowe zos-files view uf $ussName --binary $binary --host $host --port $port --user $user --password $password --ru $ru
exit $?
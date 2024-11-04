#!/bin/bash
account=$1
host=$2
port=$3
user=$4
password=$5
ru=$6
inputFile=$7
ussName=$8
binary=$9

zowe zos-files upload file-to-uss $inputFile $ussName --binary $binary --host $host --port $port --user $user --password $password --ru $ru
exit $?
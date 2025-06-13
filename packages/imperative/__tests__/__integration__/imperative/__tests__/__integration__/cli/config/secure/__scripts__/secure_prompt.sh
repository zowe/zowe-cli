#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
value1="anotherFakeValue"
value2="undefined"
expect -c "
        spawn imperative-test-cli config secure $1
        expect "?:"
        send \"$value1\r\"
        expect "?:"
        send \"$value2\r\"
        expect eof"
exit $?

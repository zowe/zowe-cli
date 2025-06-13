#!/bin/bash

FORCE_COLOR=0

mkdir -p test
cd test
value1="fakeValue"
value2="undefined"
expect -c "
        spawn imperative-test-cli config init $1
        expect "?:"
        send \"$value1\r\"
        expect "?:"
        send \"$value2\r\"
        expect eof"
exit $?

#!/bin/bash
cmd-cli respond with-data-object --mfr "this should fail" --da "invalid json!"
exit $?
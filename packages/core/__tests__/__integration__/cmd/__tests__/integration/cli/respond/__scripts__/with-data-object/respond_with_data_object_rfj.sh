#!/bin/bash
cmd-cli respond with-data-object --mfr "this should succeed" --da '{"the": "data object"}' --rfj
exit $?
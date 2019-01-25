#!/bin/bash
bright zos-jobs submit data-set "$1" --rfj
exit $?
#!/bin/bash

# Execute list data set with a dataset name containing a pound sign (#)
# using direct-basic with an APIML base path.
dsname=$1

zowe zos-files list data-set "$dsname"
exit $?

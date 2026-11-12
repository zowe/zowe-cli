#!/bin/bash

# Execute view data set with a dataset name containing a pound sign (#)
# using direct-basic with an APIML base path. The data set name is part of the
# URI path (not a query parameter), so the pound sign is not encoded for direct-*.
dsname=$1

zowe zos-files view data-set "$dsname"
exit $?

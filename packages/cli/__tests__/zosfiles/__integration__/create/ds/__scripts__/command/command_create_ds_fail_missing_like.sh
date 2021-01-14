#!/bin/bash
set -e

echo "================Z/OS FILES CREATE DS==============="
zowe files create data-set my.data.copy --host fakehost --user fakeuser --pw fakepassif [ $? -gt 0 ]
then
    exit $?
fi

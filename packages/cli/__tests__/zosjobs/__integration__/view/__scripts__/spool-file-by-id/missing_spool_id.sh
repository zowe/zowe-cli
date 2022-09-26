#!/bin/bash
zowe zos-jobs view sfbi J123 --host fakehost --user fakeuser --password fakepass
exit $?
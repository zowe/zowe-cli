#!/bin/bash

node --require ts-node/register $1 plugins install test --registry ";touch test.txt;" --login &
sleep 10
kill "$!"
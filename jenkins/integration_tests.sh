#!/usr/bin/env bash

# Unlock the keyring
echo 'jenkins' | gnome-keyring-daemon --unlock

# Run the tests
npm run test:integration
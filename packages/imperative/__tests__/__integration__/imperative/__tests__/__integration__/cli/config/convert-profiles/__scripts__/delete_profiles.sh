#!/bin/sh

# Delete all available profiles, but leave the profile type definitions
for profile in profiles/base/test.yaml profiles/secured/test.yaml profiles/v1profile/myv1profile.yaml; do
    if [ -e $profile ]; then
        rm $profile
    fi
done

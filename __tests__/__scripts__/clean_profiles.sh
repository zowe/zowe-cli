#! /bin/sh

# run this from the root of the project (where the packages/, __tests__, and node_modules, directories, .gitignore are)
# clean up temporary test profiles
# these can stick around if you kill the tests before the afterAll hook is run
# however this script is dependent on you not deleting the __tests__/__results__/data/ directory
# if that is deleted, you will have to delete the credentials manually
# if you have no stranded credentials in your manager or after running this script successfully,
# you can feel free to delete the data directory

echo "Cleaning up profiles created by automated tests that failed to clean up automatically..."

dir_contents="$(ls)"

if [[  "$dir_contents" =~ "packages" ]]; then
    # we are in the correct directory
    echo "In the root directory of the zowe cli repository as expected: $(pwd)"
else
    echo "Make sure to run this script from the root directory of the zowe cli repository! You ran from $(pwd)"
    exit 1
fi

data_dir="$(pwd)/__tests__/__results__/data/"
cd "$data_dir"
NEWLINE=$'\n'
failed_profile_deletes=""
while read -r directory;
do
    echo "----------------------"
    echo "Cleaning profiles in $directory"
    export ZOWE_CLI_HOME="$data_dir$directory"
    echo "Set home to $ZOWE_CLI_HOME"
    while read -r profile;
    do
        if [[ ! -z "$profile" ]];
        then
            echo "raw profile $profile"
            suffix=" (default)"
            profile=${profile%$suffix} # remove (default) suffix if any
            echo "Deleting $profile"
            delete_output="$(zowe profiles delete zosmf "$profile" --force 2>&1)"
            if [[ $? -gt 0 ]]; then
                echo "delete profile failed!:"
                failed_profile_deletes="$failed_profile_deletes $NEWLINE $profile in directory $ZOWE_CLI_HOME $NEWLINE Failed delete output: $delete_output $NEWLINE $NEWLINE"
                delete_output=""
            fi

            echo "" #newline
        fi
    done <<< "$(zowe profiles list zosmf)"
    
done <<<  "$(ls -l | grep ^d | sed 's:.*\ ::g')" # list temporary directories in the data/ dir

echo "Finished cleaning profiles"
if [[ ! -z "$failed_profile_deletes" ]]; then
    echo "The following profiles failed to delete"
    echo "$failed_profile_deletes"
    exit 1
fi
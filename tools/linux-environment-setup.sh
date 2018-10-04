#!/bin/bash

#######################################################
# SCRIPT PROMPT DEFAULTS                              #
#                                                     #
# Default values for all prompts are in this section. #
#######################################################

# Default npm prefix that will be used
DEFAULT_DIRECTORY=~/.npm-global

# The default profile that will be used
DEFAULT_PROFILE=~/.profile

#######################################################
# GLOBALS                                             #
#######################################################
# COLORS
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
LPURPLE='\033[1;35m'
NC='\033[0m' # No Color

# BOOLEANS
FALSE=0
TRUE=1

# STRINGS
PRODUCT_NAME="Zowe CLI"

#######################################################
# WELCOME TEXT                                        #
#######################################################

echo
echo "This script will prepare your node/npm environment so that $PRODUCT_NAME can be installed properly."
echo

#######################################################
# PRE-REQ CHECK                                       #
#######################################################
echo "Checking for prerequisites"
echo

PREREQ_MET=$TRUE

# Checks that a command exists and outputs errors acccoringly
checkForCommand()
{
  COMMAND=$1
  NAME=$2

  echo -n "${NAME}..."
  
  # Checks that the command passed in exists and print ok if it does.
  # If the command doesn't exist then we go into the statements after
  # the double bar, which will mark the PREREQ_MET variable as false
  command -v $COMMAND >/dev/null 2>&1 && echo -e "${GREEN}OK${NC}" || {
    echo -e "${RED}NOT OK${NC}"
    echo -e >&2 "  ${RED}${NAME} installation not found.${NC}"
    PREREQ_MET=$FALSE
  }  
}

# Simple check to see if the commands exists. We do not currently validate the versions
checkForCommand node "Node.js"
checkForCommand npm "Node Package Manager (npm)"
checkForCommand python "Python"
checkForCommand gcc "C/C++ Compilier (gcc)"

echo

# Check if all the PREREQUISITES were met, I.E not one check failed
if [ "$PREREQ_MET" == "$TRUE" ]; then
  echo "All dependencies were found"
  echo
else
  # A check failed so we will exit accordingly
  echo
  echo >&2 "One or more dependency was not found. $PRODUCT_NAME will not install properly without all listed dependencies."
  echo >&2 "Please fix any errors mentioned before proceeding."
  echo
  echo -e >&2 "${RED}ABORTING!${NC}"
  echo >&2 ""
  exit 1
fi

#######################################################
# NPM PREFIX MODIFICATIONS (PART 1)                   #
#                                                     #
# Prompt the user for the new prefix and get the      #
# current prefix determined by npm                    #
#######################################################
# First get the current value of the prefix
CURRENT_DIRECTORY=`npm config get prefix`
echo -e "Current npm global install directory: ${CYAN}${CURRENT_DIRECTORY}${NC}"

# Next get the directory that they wish to install to
echo -n -e "Enter new npm global install directory (${LPURPLE}${DEFAULT_DIRECTORY}${NC}):"

read INPUT_DIRECTORY

if [ "$INPUT_DIRECTORY" == "" ]; then
  TMP_VAR=$DEFAULT_DIRECTORY
else
  TMP_VAR=$INPUT_DIRECTORY
fi

# Well let's make everything absolute. I know this looks ugly but the only other
# alternative was to use INSTALL_DIRECTORY=$(eval echo "$TMP_VAR"). I'll let you
# figure out why the alternative is bad, I don't gots the time to explain. Hint
# it's very insecure and potentially dangerous if wielded by the wrong hands
NEW_INSTALL_DIRECTORY=$(python -c "import os,sys; print os.path.abspath(os.path.expanduser(sys.argv[1]))" $TMP_VAR)

#######################################################
# CREATE THE FOLDER                                   #
#                                                     #
# This section will create the folder structure       #
# necessary for the new prefix. It also doubles as a  #
# check to see if the user can actually access the    #
# location specified.                                 #
#######################################################
echo

echo -n "Creating Directory..."
if [ -d "$NEW_INSTALL_DIRECTORY" ]; then
  echo -e "${GREEN}FOUND${NC}"
else
  mkdir -p $NEW_INSTALL_DIRECTORY || {
    echo -e "${RED}NOT OK${NC}"
    echo
    echo -e >&2 "Failed to create the new install directory. It might be possible that you do not have access to ${CYAN}${NEW_INSTALL_DIRECTORY}${NC}. Please check the path and try again."
    echo >&2 ""
    echo -e >&2 "${RED}ABORTING!${NC}"
    echo >&2 ""
    exit 1
  }
  echo -e "${GREEN}OK${NC}"
fi
echo

#######################################################
# NPM PREFIX MODIFICATIONS (PART 2)                   #
#                                                     #
# Perform the prefix modification accordingly         #
#######################################################
if [ "$CURRENT_DIRECTORY" != "$NEW_INSTALL_DIRECTORY" ]; then
  # Modify the npm prefix now
  npm config set prefix $NEW_INSTALL_DIRECTORY

  echo -e "New npm global install location set to: ${CYAN}${NEW_INSTALL_DIRECTORY}${NC}"
else
  echo -e "npm global install location unchanged."
fi
echo

#######################################################
# GLOBAL PROFILE MODIFICATIONS                        #
#                                                     #
# This section will blow away any previous settings   #
# and will overwrite with any new stuff needed.       #
#######################################################

# This simply will create the profile file if it doesn't yet exist
touch DEFAULT_PROFILE

# Eyecatchers that we can use to properly keep the profile clean
SECTION_START="####################BRIGHTSIDE SETUP START#####################"
SECTION_END="####################BRIGHTSIDE SETUP END#######################"

# This is the bin directory specified by npm
NPM_BIN="bin"

# Blow away all the old settings for now (come back to this later)
sed -i.bak "/${SECTION_START}/,/${SECTION_END}/d" $DEFAULT_PROFILE

PROFILE_CONTENTS="$SECTION_START
export PATH=\"$NEW_INSTALL_DIRECTORY/$NPM_BIN:\$PATH\"
$SECTION_END"

# Determine if we need to add a spacing new line to the file
isblank=$(tail -1 $DEFAULT_PROFILE)
if [ "$isblank" != "" ]; then
   PROFILE_CONTENTS="
$PROFILE_CONTENTS"
fi

# Write back to the profile
echo "$PROFILE_CONTENTS" >> $DEFAULT_PROFILE

# Refresh any system variables
source ~/.profile

echo "Environment successfully updated. $PRODUCT_NAME should now be installable using the following command."
echo -e "${LPURPLE}npm install -g @brightside/core${NC}"
echo
echo -e "You should see it installed to: ${CYAN}${NEW_INSTALL_DIRECTORY}${NC}."
echo
echo -e "If it doesn't install to that directory then please check that ${CYAN}${NEW_INSTALL_DIRECTORY}/${NPM_BIN}${NC} is in your \$PATH environmental variable."
echo "Please see the $PRODUCT_NAME documentation on docops.ca.com."

_ZOWE_COMPLETION() 
{
    local cur prev opts zowe zoweout rc debug logfile usage
    #logfile="log"

    if [ ! -z "$logfile" ]; then 
        rm -f $logfile ; touch $logfile
    fi

    #skip
    zowe="${COMP_WORDS[0]}"
    #zowe="/home/vlcvi01/node_modules/.bin/zowe"
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"        
    zowe="$zowe ${COMP_WORDS[@]:1:${COMP_CWORD}-1} --help"
    zoweout=$(sh -c "${zowe} 2> /dev/null")
    rc=$?
    if [ $rc -ne 0 ] ; then        
        zowe="$zowe ${COMP_WORDS[@]:1:${COMP_CWORD}-2} --help"
        zoweout=$(sh -c "${zowe} 2> /dev/null")
        rc="${rc}/$?"
    fi
    
    #opts="$(sh -c "$zowe ${COMP_WORDS[@]:1:${#COMP_WORDS[@]}-1} --help" | awk '/GROUPS/,/OPTIONS/' | grep  '^  ' | awk '{print $1}') $(sh -c "$zowe ${COMP_WORDS[@]:1:${#COMP_WORDS[@]}-1} --help" | grep '^   --' | awk '{print $1}')"
    opts="$( echo "$zoweout" | awk '/(COMMANDS|GROUPS)/,/OPTIONS/' | grep  '^  ' | awk '{print $1}' ; echo "" ;  echo "$zoweout" | grep '^   --' | awk '{print $1}' )"
    
    #check if USAGE part contains keyword in <>
    #  if <localFile>  generate list of local files
    usage="$(echo "$zoweout" | grep -A 4 '^ USAGE'  | grep -oP "${prev}\s+\K[^ ]*" )"
    if [ ! -z "$usage" ] ; then
        #zowe zos-jobs submit local-file <localFile> [options]
        if [ "$usage" = "<localFile>" ]; then
            COMPREPLY=( $(compgen -f ${cur}) )
            return 0
        fi        
        #zowe zos-files upload dir-to-pds <inputdir> <dataSetName> [options]
        if [ "$usage" = "<inputDir>" ]; then
            COMPREPLY=( $(compgen -f ${cur}) )
            return 0
        fi
        #zowe profiles update zosmf-profile <profileName> [options]

        #zowe zos-files download data-set <dataSetName> [options]
        if [ "$usage" = "<dataSetName>" ]; then            
            COMPREPLY=( $(compgen -W "$(zowe zos-files list data-set $(whoami) 2> /dev/null )" -- ${cur} ) )
            return 0
        fi
        opts="$opts $usage"
    fi

    if [ ! -z "$logfile" ]; then 
        echo "!${zoweout}!" >>$logfile    
        echo "usage:~$usage~" >> $logfile
        echo "cli:~${zowe}~" >>$logfile
        echo "rc:~${rc}~" >>$logfile
        echo "opts:~${opts}~" >>$logfile
        echo "cur:~${cur}~last:${prev}~" >>$logfile
        echo "COMP_WORDS:${COMP_WORDS[@]}~${COMP_CWORD}~" >>$logfile
        echo "~~~~~~~~~~~~~~~~~~~~"  >>$logfile
    fi

    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
}

complete -F _ZOWE_COMPLETION zowe
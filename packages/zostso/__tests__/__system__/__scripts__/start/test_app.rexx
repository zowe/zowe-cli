/* REXX hello world application */

mainRc=0

PARSE ARG oMsgType iMsgType msgQueueId . /* Pick up 3 input parms.   */

say 'HELLOW exec processing has started.'

say 'UNIX message queue id = 'msgQueueId
say 'Input message type = 'iMsgType
say 'Output message type = 'oMsgType
iMsgType = D2C(iMsgType, 4)
oMsgType = D2C(oMsgType, 4)

if syscalls('ON')>3 then
  do
    say 'Unable to establish the UNIX SYSCALL environment.'
    mainRc=-1
  end

/* Perform a blocking read on the message queue to get the application
   input.
*/
if mainRc=0 then
  do
    say 'Reading application input from the UNIX message queue.'
    ADDRESS SYSCALL 'msgrcv (msgQueueId) iMsg 999 0 iMsgType'
    if rc<>0 then
      do
        say 'Error reading input.  ''msgrcv'' rc = 'mainrc
        mainRc=-1
      end
    else
      do
        iMsg = atoe(iMsg)     /* Convert input from ASCII to EBCDIC. */
        say 'Application input = 'iMsg
      end
  end


do while iMsg \== 'EXIT'
    /* Generate the application response.                        */
    if mainRc=0 then
      do
        select
            when iMsg = 'RANDOM' then
              do
                oMsg = randomString()
                oMsg = etoa(oMsg)
  ADDRESS SYSCALL 'msgsnd (msgQueueId) oMsg' length(oMsg) '0 oMsgType'
                oMsg = '"READY "'
                oMsg = etoa(oMsg)
  ADDRESS SYSCALL 'msgsnd (msgQueueId) oMsg' length(oMsg) '0 oMsgType'
                mainRc = 0
                leave
              end
            when SUBSTR(iMsg,1,4) = 'LONG' then
              do
                PARSE VAR iMsg "LONG" N
                N = N+ 0
                do i = 0 to N
                  say i
                end

                say "READY "
                oMsg = '"READY "'
                oMsg = etoa(oMsg)
  ADDRESS SYSCALL 'msgsnd (msgQueueId) oMsg' length(oMsg) '0 oMsgType'
                mainRc = 0
                leave
              end
            otherwise
              oMsg = '"' || MVSVAR(iMsg) || '"'
        end
        if oMsg = '' then
          oMsg = 'No information returned'
        /*oMsg = '"Hello 'iMsg'!"'       */
        say 'Response = 'oMsg

        /* Write the response to the UNIX message queue.    */
        oMsg = etoa(oMsg)    /* Convert EBCDIC to ASCII.       */
        say 'Writing response to the UNIX message queue.'
  ADDRESS SYSCALL 'msgsnd (msgQueueId) oMsg' length(oMsg) '0 oMsgType'
        if rc<>0 then
          do
         say 'Error writing response to the UNIX message queue.  ',
                '''msgsnd'' rc = 'rc'.'
            mainRc=-1
            leave
          end
      end
  say 'Reading application input from the UNIX message queue2.'
  ADDRESS SYSCALL 'msgrcv (msgQueueId) iMsg 999 0 iMsgType'
  if rc<>0 then
    do
      say 'Error reading input.  ''msgrcv'' rc = 'mainrc
      mainRc=-1
    end
  else
    do
      iMsg = atoe(iMsg)    /* Convert input from ASCII to EBCDIC. */
      say 'Application input2 = 'iMsg
    end
end

say 'HELLOW exec processing is complete with rc = 'mainRc'.'

return mainRc


/* Convert an ASCII string to EBCDIC.                                 */
atoe:
  parse arg msg                     /*                                */
  msg = convertstring('ATOE' msg)   /*                                */
  return msg                        /*                                */
/* Convert an EBCDIC string to ASCII.                                 */
etoa:
  parse arg msg                     /*                                */
  msg = convertstring('ETOA' msg)   /*                                */
  return msg                        /*                                */

/*
   Convert ASCII to EBCDIC and EBCDIC to ASCII.  Use the UNIX iconv
   command.  Positional input parameters:

   1 -- conversion type, either "ATOE" or "ETOA"
   2 -- string to be converted.
*/
convertstring:
   parse arg conv msg
   /* Create temporary file names. */
   fn = '/tmp/' || USERID() || '.' || TIME('L')
   ifn = fn || '.i'  /* Name of file to contain input text. */
   ofn = fn || '.o'  /* Name of file to contain output text. */
   address syscall 'creat (ifn) 700'
   fd=retval
   if retval=-1 then
     do
       say 'Error creating temporary file 'ifn'. ',
           'errno: 'errno' errnojr: 'errnojr
       return -1
     end
   /* Write the input text to the temporary file. */
   address syscall 'write (fd) msg' length(msg)
   address syscall 'close (fd)'
   /*
      Call iconv to read the temp file containg intput text, and write
      the converted text to the output file.
   */
   select                           /* Which conversion was requested?*/
     when conv = 'ATOE' then        /* ASCII to EBCDIC?               */
       retcode=bpxwunix('iconv -f ISO8859-1 -t IBM-1047 'ifn' > 'ofn)
     when conv = 'ETOA' then        /* EBCDIC to ASCII?               */
       retcode=bpxwunix('iconv -f IBM-1047 -t ISO8859-1 'ifn' > 'ofn)
     otherwise
        do
          say 'Unknown conversion type: "'conv'".  ',
              'Acceptable values are "ATOE" or "ETOA".'
          return -1
        end
   end
   if retcode<>0 then
     do
       say conv' iconv failed with rc = 'retcode'.'
       return -1
     end
   /* Read the converted text from the output file. */
   address syscall 'open (ofn)' o_rdonly
   fd=retval
   if retval=-1 then
     do
       say 'Open failed for file 'ofn'. ',
           'errno: 'errno' errnojr: 'errnojr
       return -1
     end
   address syscall 'fstat (fd) st.' /* Get file status, to get size.  */
   address syscall 'read (fd) msg' st.st_size /* Read entire file.    */
   address syscall 'close (fd)'
   /* Delete the temporary files. */
   address syscall 'unlink (ofn)'
   address syscall 'unlink (ifn)'
   return msg                       /* Return the converted string.   */

longOutput:
    do i = 0 to 4000
    say i
    end

randomString:
    randomChars = ''
    numChars = 10

    /* Loop to generate random characters */
    DO i = 1 TO numChars
        /* Generate a random number between 65 and 90 for (A-Z) */
        randomNum = RANDOM(65, 90)

        /* Convert the random character using the C2D function */
        randomChar = C2D(randomNum)

        /* Concatenate the random character to the string */
        randomChars = randomChars || randomChar
    END

    /* Display the result */
    return 'Random Characters: ' randomChars

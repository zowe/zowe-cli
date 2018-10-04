//{{JOBNAME}} JOB ({{ACCOUNT}}),
//             CLASS={{JOBCLASS}}{{TYPERUNPARM}}
/*JOBPARM SYSAFF={{SYSAFF}}
//* Comments
//TSOSTEP EXEC PGM=IKJEFT1B
//SYSEXEC DD UNIT=SYSALLDA,SPACE=(80,(5,1)),
//        DSN=&SYSEXEC,
//        AVGREC=K,DSNTYPE=LIBRARY,
//        RECFM=FB,LRECL=80,DSORG=PO
//SYSUT2  DD DISP=(OLD,PASS),VOL=REF=*.SYSEXEC,
//        DSN=&SYSEXEC(REXXSAMP)
//SYSIN DD DATA,DLM='¬¬'
/* REXX */
Say "looping until cancelled..."
Call SYSCALLS('ON')    
Address SYSCALL
Say "Sleeping..."
"SLEEP" 10               
Call SYSCALLS 'OFF'  
Exit
¬¬
//*
//SYSTSPRT DD SYSOUT=*
//SYSTSIN DD *
repro infile(SYSIN) outfile(SYSUT2)
%REXXSAMP
//*
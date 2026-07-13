//T@#$-EST JOB (IZUACCT),'Hello World',CLASS=A,MSGCLASS=X,
//             MSGLEVEL=(1,1)
//*
//* Run an inline USS shell script to say hello world
//*
//SAYHELLO EXEC PGM=BPXBATCH,REGION=0M
//STDPARM  DD   *
SH echo "hello world"; date
/*
//STDOUT   DD   SYSOUT=*
//STDERR   DD   SYSOUT=*

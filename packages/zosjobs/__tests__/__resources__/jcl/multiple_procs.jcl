//{{JOBNAME}} JOB {{ACCOUNT}},CLASS={{JOBCLASS}}                  
//*                                               
//REXXPRC1 PROC                                   
//TSOSTEP1 EXEC PGM=IKJEFT1B                      
//SYSEXEC DD UNIT=SYSALLDA,SPACE=(80,(5,1)),      
//        DSN=&SYSEXEC,                           
//        AVGREC=K,DSNTYPE=LIBRARY,               
//        RECFM=FB,LRECL=80,DSORG=PO              
//SYSUT2  DD DISP=(OLD,PASS),VOL=REF=*.SYSEXEC,   
//        DSN=&SYSEXEC(REXXSAMP)                  
//SYSIN DD DATA,DLM='¬¬'                          
/* REXX */                                        
Say "OUTPUT FROM PROC1"                           
Exit                                              
¬¬                                                
//*                                               
//SYSTSPRT DD SYSOUT=*                          
//SYSTSIN DD *                                  
repro infile(SYSIN) outfile(SYSUT2)             
%REXXSAMP                                       
//*                                             
//           PEND                               
//*                                             
//REXXPRC2 PROC                                 
//TSOSTEP2 EXEC PGM=IKJEFT1B                    
//SYSEXEC DD UNIT=SYSALLDA,SPACE=(80,(5,1)),    
//        DSN=&SYSEXEC,                         
//        AVGREC=K,DSNTYPE=LIBRARY,             
//        RECFM=FB,LRECL=80,DSORG=PO            
//SYSUT2  DD DISP=(OLD,PASS),VOL=REF=*.SYSEXEC, 
//        DSN=&SYSEXEC(REXXSAMP)                
//SYSIN1 DD DATA,DLM='¬¬'                        
/* REXX */                            
Say "OUTPUT FROM PROC2"               
Exit                                  
¬¬                                    
//*                                   
//SYSTSPRT DD SYSOUT=*                
//SYSTSIN DD *                        
repro infile(SYSIN1) outfile(SYSUT2)   
%REXXSAMP                             
//*                                   
//           PEND                     
//*                                   
//STEP1      EXEC REXXPRC1            
//*                                   
//STEP2      EXEC REXXPRC2            
//*      
                             
/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { IJob, IJobError, IJobFile } from "@zowe/zos-jobs-for-zowe-sdk";

/**
 * Static class for GetJobs data
 * @export
 * @class GetJobsData
 */
export class GetJobsData {

    /**
     * Sample job
     * @static
     * @type {IJob}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_COMPLETE_JOB: IJob = {
        "jobid": "TSUxxx",
        "jobname": "IBMUSER$",
        "subsystem": "JES2",
        "owner": "IBMUSER",
        "status": "OUTPUT",
        "type": "job",
        "class": "A",
        "retcode": "CC 0000",
        "url": "www.nowhere.com/restjobs/jobs",
        "files-url": "www.nowhere.com/restjobs/jobs/files",
        "job-correlator": "123545asdfadf",
        "phase": 88,
        "phase-name": "testagain"
    };

    /**
     * Another sample job
     * @static
     * @type {IJob}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_COMPLETE_JOB_AGAIN: IJob = {
        "jobid": "JOBxxx",
        "jobname": "CAUSER$",
        "subsystem": "JES2",
        "owner": "CAUSER",
        "status": "OUTPUT",
        "type": "job",
        "class": "A",
        "retcode": "CC 0000",
        "url": "www.nowhere.com/restjobs/jobs",
        "files-url": "www.nowhere.com/restjobs/jobs/files",
        "job-correlator": "123545asdfadf",
        "phase": 88,
        "phase-name": "testagain"
    };

    /**
     * Array of jobs returned
     * @static
     * @type {IJob[]}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_JOBS: IJob[] = [GetJobsData.SAMPLE_COMPLETE_JOB, GetJobsData.SAMPLE_COMPLETE_JOB_AGAIN];

    /**
     * Active job
     * @static
     * @type {IJob}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_ACTIVE_JOB: IJob = {
        "retcode": null,
        "jobname": "KELDA16$",
        "status": "INPUT",
        "job-correlator": "J0003781USILDAMDD3CE8146.......:",
        "class": "A",
        "type": "JOB",
        "jobid": "JOB03781",
        "url": "https://tso1:443/zosmf/restjobs/jobs/J0003781USILDAMDD3CE8146.......%3A",
        "phase-name": "Job is actively converting",
        "owner": "KELDA16",
        "subsystem": "JES2",
        "files-url": "https://tso1:443/zosmf/restjobs/jobs/J0003781USILDAMDD3CE8146.......%3A/files",
        "phase": 130
    };

    /**
     * Wrong URI error response
     * @static
     * @type {IJobError}
     * @memberof GetJobsData
     */
    public static readonly WRONG_JOBS_URI: IJobError = {
        rc: 4,
        reason: 7,
        stack: "JesException: CATEGORY_SERVICE rc=4 reason=7 message=" +
        "No match for method GET and pathInfo='/owner=TCPIP*'\n\tat com" +
        ".ibm.zoszmf.restjobs.util.JesException.serviceException(" +
        "JesException.java:183)\n\tat com.ibm.zoszmf.restjobs.servlet." +
        "JesServlet.doGet(JesServlet.java:270)\n\tat javax.servlet.http." +
        "HttpServlet.service(HttpServlet.java:575)\n\tat com.ibm.zoszmf." +
        "restjobs.servlet.JesServlet.service(JesServlet.java:168)\n\tat jav" +
        "ax.servlet.http.HttpServlet.service(HttpServlet.java:668)\n\tat com" +
        ".ibm.ws.webcontainer.servlet.ServletWrapper.service(ServletWrapper." +
        "java:1255)\n\tat com.ibm.ws.webcontainer.servlet.ServletWrapper." +
        "handleRequest(ServletWrapper.java:743)\n\tat com.ibm.ws.webcontainer" +
        ".servlet.ServletWrapper.handleRequest(ServletWrapper.java:440)\n\tat " +
        "com.ibm.ws.webcontainer.filter.WebAppFilterChain.invokeTarget" +
        "(WebAppFilterChain.java:147)\n\tat com.ibm.ws.webcontainer.filter." +
        "WebAppFilterChain.doFilter(WebAppFilterChain.java:89)\n\tat com.ibm." +
        "zoszmf.util.data.ActivityFilter.doFilter(ActivityFilter.java:100)\n\ta" +
        "t com.ibm.ws.webcontainer.filter.FilterInstanceWrapper.doFilter(Filter" +
        "InstanceWrapper.java:201)\n\tat com.ibm.ws.webcontainer.filter.WebApp" +
        "FilterChain.doFilter(WebAppFilterChain.java:86)\n\tat com.ibm.zoszmf." +
        "util.auth.CSRFwithWLFilter.doFilter(CSRFwithWLFilter.java:192)\n\tat " +
        "com.ibm.ws.webcontainer.filter.FilterInstanceWrapper.doFilter(FilterIn" +
        "stanceWrapper.java:201)\n\tat com.ibm.ws.webcontainer.filter.WebAppFilt" +
        "erChain.doFilter(WebAppFilterChain.java:86)\n\tat com.ibm.ws.webcontain" +
        "er.filter.WebAppFilterManager.doFilter(WebAppFilterManager.java:995)\n\t" +
        "at com.ibm.ws.webcontainer.filter.WebAppFilterManager.invokeFilters(" +
        "WebAppFilterManager.java:1124)\n\tat com.ibm.ws.webcontainer.filter." +
        "WebAppFilterManager.invokeFilters(WebAppFilterManager.java:1004)\n\ta" +
        "t com.ibm.ws.webcontainer.servlet.CacheServletWrapper.handleRequest(Ca" +
        "cheServletWrapper.java:76)\n\tat com.ibm.ws.webcontainer.WebContainer." +
        "handleRequest(WebContainer.java:921)\n\tat com.ibm.ws.webcontainer.osgi" +
        ".DynamicVirtualHost$2.run(DynamicVirtualHost.java:281)\n\tat com.ibm.ws" +
        ".http.dispatcher.internal.channel.HttpDispatcherLink$TaskWrapper.run(Htt" +
        "pDispatcherLink.java:960)\n\tat com.ibm.ws.zos.wlm.internal.WlmHttpWork" +
        "Classifier$WlmExecutor.wlmRunWork(WlmHttpWorkClassifier.java:309)\n\tat c" +
        "om.ibm.ws.zos.wlm.internal.WlmHttpWorkClassifier$WlmExecutor.execute(Wlm" +
        "HttpWorkClassifier.java:299)\n\tat com.ibm.ws.http.dispatcher.internal." +
        "channel.HttpDispatcherLink.wrapHandlerAndExecute(HttpDispatcherLink.java:" +
        "357)\n\tat com.ibm.ws.http.dispatcher.internal.channel.HttpDispatcherLink." +
        "ready(HttpDispatcherLink.java:321)\n\tat com.ibm.ws.http.channel.internal." +
        "inbound.HttpInboundLink.handleDiscrimination(HttpInboundLink.java:499)\n\ta" +
        "t com.ibm.ws.http.channel.internal.inbound.HttpInboundLink.handleNewRequest" +
        "(HttpInboundLink.java:433)\n\tat com.ibm.ws.http.channel.internal.inbound." +
        "HttpInboundLink.processRequest(HttpInboundLink.java:313)\n\tat com.ibm.ws." +
        "http.channel.internal.inbound.HttpInboundLink.ready(HttpInboundLink.java:" +
        "284)\n\tat com.ibm.ws.channel.ssl.internal.SSLConnectionLink.determineNext" +
        "Channel(SSLConnectionLink.java:1029)\n\tat com.ibm.ws.channel.ssl.internal" +
        ".SSLConnectionLink.readyInboundPostHandshake(SSLConnectionLink.java:695" +
        ")\n\tat com.ibm.ws.channel.ssl.internal.SSLConnectionLink$MyHandshakeComp" +
        "letedCallback.complete(SSLConnectionLink.java:383)\n\tat com.ibm.ws.channel" +
        ".ssl.internal.SSLUtils.handleHandshake(SSLUtils.java:947)\n\tat com.ibm" +
        ".ws.channel.ssl.internal.SSLHandshakeIOCallback.complete(SSLHandshakeIO" +
        "Callback.java:85)\n\tat com.ibm.ws.tcpchannel.internal.WorkQueueManager." +
        "requestComplete(WorkQueueManager.java:503)\n\tat com.ibm.ws.tcpchannel." +
        "internal.WorkQueueManager.attemptIO(WorkQueueManager.java:573)\n\tat com" +
        ".ibm.ws.tcpchannel.internal.WorkQueueManager.workerRun(WorkQueueManager." +
        "java:928)\n\tat com.ibm.ws.tcpchannel.internal.WorkQueueManager$Worker." +
        "run(WorkQueueManager.java:1017)\n\tat java.util.concurrent.ThreadPoolEx" +
        "ecutor.runWorker(ThreadPoolExecutor.java:1160)\n\tat java.util.concurren" +
        "t.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)\n\tat java." +
        "lang.Thread.run(Thread.java:811)\n",
        category: 6,
        message: "No match for method GET and pathInfo='/owner=TCPIP*'"
    };

    /**
     * Sample IEFBR14 JCL
     * @static
     * @type {string}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_IEFBR14_JCL: string =
    "//RUNMAIN  JOB 105300000,                                               JOB07172" +
        "// USER=KELDA16" +
        "//* test" +
        "//EXEC     EXEC PGM=IEFBR14,REGION=200M,MEMLIMIT=3G";

    /**
     * Sample job files
     * @static
     * @type {IJobFile[]}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_SPOOL_FILES: IJobFile[] =
    [
        {
            "recfm": "UA",
            "records-url": "https://tso1:443/zosmf/restjobs/jobs/J0007172USILDAMDD41B4773.......%3A/files/2/records",
            "stepname": "JES2",
            "subsystem": "JES2",
            "job-correlator": "J0007172USILDAMDD41B4773.......:",
            "byte-count": 1297,
            "lrecl": 133,
            "jobid": "JOB07172",
            "ddname": "JESMSGLG",
            "id": 2,
            "record-count": 19,
            "class": "Z",
            "jobname": "RUNMAIN",
            "procstep": null
        },
        {
            "recfm": "V",
            "records-url": "https://tso1:443/zosmf/restjobs/jobs/J0007172USILDAMDD41B4773.......%3A/files/3/records",
            "stepname": "JES2",
            "subsystem": "JES2",
            "job-correlator": "J0007172USILDAMDD41B4773.......:",
            "byte-count": 223,
            "lrecl": 136,
            "jobid": "JOB07172",
            "ddname": "JESJCL",
            "id": 3,
            "record-count": 4,
            "class": "Z",
            "jobname": "RUNMAIN",
            "procstep": null
        },
        {
            "recfm": "VA",
            "records-url": "https://tso1:443/zosmf/restjobs/jobs/J0007172USILDAMDD41B4773.......%3A/files/4/records",
            "stepname": "JES2",
            "subsystem": "JES2",
            "job-correlator": "J0007172USILDAMDD41B4773.......:",
            "byte-count": 3195,
            "lrecl": 137,
            "jobid": "JOB07172",
            "ddname": "JESYSMSG",
            "id": 4,
            "record-count": 42,
            "class": "Z",
            "jobname": "RUNMAIN",
            "procstep": null
        }
    ];

    /**
     * Sample job files
     * @static
     * @type {IJobFile[]}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_SPOOL_FILES_WITH_PROCSTEP: IJobFile[] =
    [
        {
            "recfm": "UA",
            "records-url": "https://tso1:443/zosmf/restjobs/jobs/J0007172USILDAMDD41B4773.......%3A/files/2/records",
            "stepname": "JES2",
            "subsystem": "JES2",
            "job-correlator": "J0007172USILDAMDD41B4773.......:",
            "byte-count": 1297,
            "lrecl": 133,
            "jobid": "JOB07172",
            "ddname": "JESMSGLG",
            "id": 2,
            "record-count": 19,
            "class": "Z",
            "jobname": "RUNMAIN",
            "procstep": "PROC1"
        },
        {
            "recfm": "V",
            "records-url": "https://tso1:443/zosmf/restjobs/jobs/J0007172USILDAMDD41B4773.......%3A/files/3/records",
            "stepname": "JES2",
            "subsystem": "JES2",
            "job-correlator": "J0007172USILDAMDD41B4773.......:",
            "byte-count": 223,
            "lrecl": 136,
            "jobid": "JOB07172",
            "ddname": "JESJCL",
            "id": 3,
            "record-count": 4,
            "class": "Z",
            "jobname": "RUNMAIN",
            "procstep": "PROC2"
        },
        {
            "recfm": "VA",
            "records-url": "https://tso1:443/zosmf/restjobs/jobs/J0007172USILDAMDD41B4773.......%3A/files/4/records",
            "stepname": "JES2",
            "subsystem": "JES2",
            "job-correlator": "J0007172USILDAMDD41B4773.......:",
            "byte-count": 3195,
            "lrecl": 137,
            "jobid": "JOB07172",
            "ddname": "JESYSMSG",
            "id": 4,
            "record-count": 42,
            "class": "Z",
            "jobname": "RUNMAIN",
            "procstep": "PROC3"
        }
    ];

    /**
     * Sample job file
     * @static
     * @type {IJobFile}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_JOB_FILE: IJobFile =
    {
        "recfm": "UA",
        "records-url": "https://tso1:443/zosmf/restjobs/jobs/J0007172USILDAMDD41B4773.......%3A/files/2/records",
        "stepname": "JES2",
        "subsystem": "JES2",
        "job-correlator": "J0007172USILDAMDD41B4773.......:",
        "byte-count": 1297,
        "lrecl": 133,
        "jobid": "JOB07172",
        "ddname": "JESMSGLG",
        "id": 2,
        "record-count": 19,
        "class": "Z",
        "jobname": "RUNMAIN",
        "procstep": null
    };

    /**
     * Sample job content data
     * @static
     * @type {string}
     * @memberof GetJobsData
     */
    public static readonly SAMPLE_JES_MSG_LG: string =
    "    1                   J E S 2  J O B  L O G  --  S Y S T E M  X A D 1  --  N O D E  U S I L D A M D" +
        "    0" +
        " 08.26.22 JOB01544 ---- MONDAY,    02 APR 2018 ----" +
        " 08.26.22 JOB01544  TSS7000I KELDA16 Last-Used 02 Apr 18 08:25 System=XAD1 Facility=TSO" +
        " 08.26.22 JOB01544  TSS7001I Count=00411 Mode=Fail Locktime=None Name=KELOSKY, DANIEL L" +
        " 08.26.22 JOB01544  $HASP373 RUNMAIN  STARTED - WLM INIT  - SRVCLASS BATSTWLM - SYS XAD1" +
        " 08.26.22 JOB01544  IEF403I RUNMAIN - STARTED - TIME=08.26.22" +
        " 08.26.22 JOB01544  CAJR250I STEPNAME STEP   PGM=   CCODE  EST-COST   EXCPS     ELAPSED     TOT-CPU PAGE-IN PAGE-OT SWAP-IN SWAP-OT" +
        " 08.26.22 JOB01544  CAJR251I EXEC        1 IEFBR14  0000      $ .00       0 00:00:00.00 00:00:00.00       0       0       0       0" +
        " 08.26.22 JOB01544  IEF404I RUNMAIN - ENDED - TIME=08.26.22" +
        " 08.26.22 JOB01544  CAJR252I JOB ENDED. TOTAL EST-COST        $ .00      TOTAL CPU TIME 00:00:00.00" +
        " 08.26.22 JOB01544  $HASP395 RUNMAIN  ENDED - RC=0000" +
        "0------ JES2 JOB STATISTICS ------" +
        "-  02 APR 2018 JOB EXECUTION DATE" +
        "-            6 CARDS READ" +
        "-           73 SYSOUT PRINT RECORDS" +
        "-            0 SYSOUT PUNCH RECORDS" +
        "-            8 SYSOUT SPOOL KBYTES" +
        "-         0.00 MINUTES EXECUTION TIME";

}

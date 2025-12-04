/*
 * Copyright (c) 2025 Broadcom.  All Rights Reserved.  The term
 * "Broadcom" refers to Broadcom Inc. and/or its subsidiaries.
 *
 * This software and all information contained therein is
 * confidential and proprietary and shall not be duplicated,
 * used, disclosed, or disseminated in any way except as
 * authorized by the applicable license agreement, without the
 * express written permission of Broadcom.  All authorized
 * reproductions must be marked with this language.
 *
 * EXCEPT AS SET FORTH IN THE APPLICABLE LICENSE AGREEMENT, TO
 * THE EXTENT PERMITTED BY APPLICABLE LAW, BROADCOM PROVIDES THIS
 * SOFTWARE WITHOUT WARRANTY OF ANY KIND, INCLUDING WITHOUT
 * LIMITATION, ANY IMPLIED WARRANTIES OF MERCHANTABILITY OR
 * FITNESS FOR A PARTICULAR PURPOSE.  IN NO EVENT WILL BROADCOM
 * BE LIABLE TO THE END USER OR ANY THIRD PARTY FOR ANY LOSS OR
 * DAMAGE, DIRECT OR INDIRECT, FROM THE USE OF THIS SOFTWARE,
 * INCLUDING WITHOUT LIMITATION, LOST PROFITS, BUSINESS
 * INTERRUPTION, GOODWILL, OR LOST DATA, EVEN IF BROADCOM IS
 * EXPRESSLY ADVISED OF SUCH LOSS OR DAMAGE.
 */

// Todo: replace the example package with the real one when integrating into the REST SDK
// package com.broadcom.restapi.sdk.jfrs;
package org.example;

import lombok.extern.slf4j.Slf4j;

/*****************************************************************************************
 * The following is a new exception to add to the com.ca.ccs.jfrs.exception package
/****************************************************************************************/
/**
 * The pattern of returning results in the com.ca.ccs.jfrs package is to return an
 * FrsResult object. The following exception is thrown in private functions of the
 * JfrsZosWriter class to percolate problems up to public functions of the class.
 * An FrsResult object can be obtained from this exception so that an FrsResult object
 * can then be returned by the public functions.
 */
@Slf4j
public class JfrsSdkRcException extends Exception {
    // todo: Determine valid RC values
    public static final int INVALID_PROPS_RC = 100;
    public static final int REG_PROD_FAILED_RC = 101;
    public static final int Add_FEAT_FAILED_RC = 102;
    public static final int UPDATE_FEAT_FAILED_RC = 103;

    // todo: Determine valid RSN values
    public static final int NULL_RESULT_RSN = 10;
    public static final int JFRS_EXCEPTION_RSN = 11;
    public static final int NULL_EMPTY_BLANK_RSN = 12;
    public static final int PROD_NOT_IN_CATALOG_RSN = 13;
    public static final int INVALID_VERSION_FORMAT_RSN = 14;
    public static final int TOO_LONG_RSN = 15;

    private int rc = 0;
    private int rsn = 0;

    //------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param rc The return code to be recorded in the exception
     * @param rsn The reason code to be recorded in the exception
     * @param message A message associated with this error
     */
    public JfrsSdkRcException(int rc, int rsn, String message) {
        super(message);
        this.rc = rc;
        this.rsn = rsn;
    }

    //------------------------------------------------------------------------
    /**
     * Form an FrsResult from this exception.
     *
     * @return An FrsResult object containing the relevant
     *         return code and reason code.
     */
    public FrsResult getFrsResult() {
        return new FrsResult(this.rc, this.rsn, "".getBytes());
    }

    //------------------------------------------------------------------------
    /**
     * This utility logs information related to a detected problem and then
     * throws an exception in which a return code and reason code are recorded.
     *
     * @param rc The return code to be logged and recorded in the exception
     * @param rsn The reason code to be logged recorded in the exception
     * @param errorText Text to be logged describing the reason for the error
     *
     * @throws JfrsSdkRcException
     */
	public static void logErrThrowRcExcept(int rc, int rsn, String errorText) throws JfrsSdkRcException {
        log.error(
            "logErrThrowRcExcept" +
            "\n    Return code = " + rc +
            "\n    Reason code = " + rsn +
            "\n    Error Msg   = " + errorText
        );
        throw new JfrsSdkRcException(rc, rsn, errorText);
	}
}

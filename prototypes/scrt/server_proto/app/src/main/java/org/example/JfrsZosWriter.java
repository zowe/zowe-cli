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

// Todo: replace the example packages with the real ones when integrating into REST API SDK
// package com.broadcom.restapi.sdk.jfrs;
package org.example;

// import com.ca.ccs.jfrs.JfrsSdkRcException;
import org.example.JfrsSdkRcException;

// import com.broadcom.restapi.sdk.ScrtProps;
import org.example.ScrtProps;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

//************************************************************************
@Slf4j
public class JfrsZosWriter {
    // names for function parameter
    private static final String UPDATE_FEAT_USED = "Update feature used";
    private static final String VALIDATE_PROPS = "Validate JFRS Properties";
    private static final String GET_PROD_TOKEN = "Get product token";
    private static final String GET_FEAT_TOKEN = "Get feature token";

    // we cache the product token for future use
    private static Map<String, byte[]> prodTokenMap = new HashMap<>();
    private static final Object prodTokenMapLock = new Object();

    // A class to hold a feature token and the time that the feature was last updated for SCRT
    private static class FeatTokenInfo {
        public byte[] tokenVal;
        public Instant lastUpdate;

        public FeatTokenInfo(byte[] tokenVal) {
            this.tokenVal = tokenVal;
            lastUpdate = Instant.EPOCH; // not yet updated
        }
    }

    // we cache every feature token for future use
    private static Map<String, FeatTokenInfo> featTokenMap = new HashMap<>();
    private static final Object featTokenMapLock = new Object();

    //------------------------------------------------------------------------
    /**
     * Record the use of the specified feature for SCRT reporting.
     *
     * The following pseudocode shows how a REST service application would call this function.
     *
     *      // This sets your feature using your default product (from your application.yml)
     *      ScrtProps scrtPropVals = new ScrtProps("YourFeatureName");
     *
     *      if (YouWantToOverRideYourDefaultProduct) {
     *          try {
     *              scrtPropVals.setProductInfo(YourProductId, YourProductVersion);
     *          } catch (JfrsSdkRcException except) {
     *              YouHandleTheException();
     *          }
     *      }
     *      FrsResult recordUseResult = new JfrsZosWriter().recordFeatureUse(scrtPropVals);
     *
     * @param ScrtProps scrtPropVals The SCRT property values for recording the use of a feature.
     *
     * @return An FrsResult with a return code and reason code.
     */
    public FrsResult recordFeatureUse(ScrtProps scrtPropVals) {
        try {
            validateProps(scrtPropVals);

            FrsResult updateFeatResult = new FrsResult(0, 0, "".getBytes());
            try {
                FeatTokenInfo featTokenInfo = getFeatTokenInfo(scrtPropVals);
                Instant currentTime = Instant.now();
                synchronized (featTokenMapLock) {
                    String scrtPropsMsg =
                        "\n    " + ScrtProps.PROD_NAME_KW + "\t\t= " + scrtPropVals.getProductName() +
                        "\n    " + ScrtProps.PROD_ID_KW + "\t\t= " + scrtPropVals.getProductId() +
                        "\n    " + ScrtProps.PROD_INST_KW + "\t= " + scrtPropVals.getProductInstance() +
                        "\n    " + ScrtProps.VERSION_KW + "\t\t= " + scrtPropVals.getVersion() +
                        "\n    " + ScrtProps.RELEASE_KW + "\t\t= " + scrtPropVals.getRelease() +
                        "\n    " + ScrtProps.MOD_LEV_KW + "\t\t= " + scrtPropVals.getModLevel() +
                        "\n    " + ScrtProps.FEAT_NAME_KW + "\t\t= " + scrtPropVals.getFeatureName() +
                        "\n    " + ScrtProps.FEAT_DESC_KW + "\t= " + scrtPropVals.getFeatureDescription() +
                        "\n    last update = " + featTokenInfo.lastUpdate + "   current time = " + currentTime;

                    if (currentTime.isAfter(featTokenInfo.lastUpdate.plus(1, ChronoUnit.DAYS))) {
                        // do another update since it has been over a day since our last update
                        updateFeatResult = FeatureRegistrationServiceWrapper.updateFeature(
                            getProdToken(scrtPropVals), featTokenInfo.tokenVal,
                            FeatureStateOption.FL_STATE_ENABLED, FeatureUsedOption.FL_USED_YES
                        );
                        log.info("Recorded these SCRT properties:" + scrtPropsMsg);
                        featTokenInfo.lastUpdate = currentTime;
                    } else {
                        log.info("These SCRT properties were *NOT* recorded - less than one day:" + scrtPropsMsg);
                    }
                }
            } catch (JFRSException except) {
                logErrThrowRcExcept(
                    UPDATE_FEAT_USED, scrtPropVals,
                    JfrsSdkRcException.UPDATE_FEAT_FAILED_RC, JfrsSdkRcException.JFRS_EXCEPTION_RSN,
                    "FeatureRegistrationService.updateFeature threw an exception: " + except.getMessage()
                );
            }
            if (updateFeatResult == null) {
                logErrThrowRcExcept(
                    UPDATE_FEAT_USED, scrtPropVals,
                    JfrsSdkRcException.UPDATE_FEAT_FAILED_RC, JfrsSdkRcException.NULL_RESULT_RSN,
                    "FeatureRegistrationService.updateFeature returned a null result"
                );
            }
            if (updateFeatResult.getRc() == -1 || updateFeatResult.getRc() > 4 || updateFeatResult.getToken() == null) {
                logErrThrowRcExcept(
                    UPDATE_FEAT_USED, scrtPropVals, updateFeatResult.getRc(), updateFeatResult.getRsn(),
                    "FeatureRegistrationService.updateFeature returned a failing return code"
                );
            }
            return updateFeatResult;
        } catch (JfrsSdkRcException except) {
            return except.getFrsResult();
        }
    }

    //------------------------------------------------------------------------
    /**
     * Validate whether the properties supplied to JfrsZosWriter
     * are valid or not. Messages for invalid properties are logged.
     *
     * @returns True when properties are valid. False otherwise.
     * @throw JfrsSdkRcException
     */
    private void validateProps(ScrtProps scrtPropVals) throws JfrsSdkRcException {
        if (scrtPropVals == null) {
            logErrThrowRcExcept(
                VALIDATE_PROPS, scrtPropVals,
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.NULL_EMPTY_BLANK_RSN,
                "The supplied scrtPropVals parameter is null"
            );
        }

        String invalidProps = "";

        if (scrtPropVals.getProductName() == null || scrtPropVals.getProductName().isBlank()) {
            invalidProps += ScrtProps.PROD_NAME_KW + " ";
        }
        if (scrtPropVals.getProductId() == null || scrtPropVals.getProductId().isBlank()) {
            invalidProps += ScrtProps.PROD_ID_KW + " ";
        }
        if (scrtPropVals.getProductInstance() == null || scrtPropVals.getProductInstance().isBlank()) {
            invalidProps += ScrtProps.PROD_INST_KW + " ";
        }
        if (scrtPropVals.getVersion() == null || scrtPropVals.getVersion().isBlank()) {
            invalidProps += ScrtProps.VERSION_KW + " ";
        }
        if (scrtPropVals.getRelease() == null || scrtPropVals.getRelease().isBlank()) {
            invalidProps += ScrtProps.RELEASE_KW + " ";
        }
        if (scrtPropVals.getModLevel() == null || scrtPropVals.getModLevel().isBlank()) {
            invalidProps += ScrtProps.MOD_LEV_KW + " ";
        }
        if (scrtPropVals.getFeatureName() == null || scrtPropVals.getFeatureName().isBlank()) {
            invalidProps += ScrtProps.FEAT_NAME_KW + " ";
        }
        if (scrtPropVals.getFeatureDescription() == null || scrtPropVals.getFeatureDescription().isBlank()) {
            invalidProps += ScrtProps.FEAT_DESC_KW + " ";
        }

        if (!invalidProps.isEmpty()) {
            logErrThrowRcExcept(
                VALIDATE_PROPS, scrtPropVals,
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.NULL_EMPTY_BLANK_RSN,
                "The following scrtPropVals are null, empty, or blank: " + invalidProps
            );
        }

        // Todo: validate our property values against the product catalog
    }

    //------------------------------------------------------------------------
    /**
     * Get the token for the product from our set of cached prodTokens.
     * If we have not yet cached the token, call the Jfrs registerProduct
     * function to get a token and store the token into our prodTokenMap.
     *
     * @param ScrtProps scrtPropVals The SCRT property values used in getting a product token.
     *
     * @throws JfrsSdkRcException when a token cannot be retrieved
     *
     * @return A byte array representing the product token.
     */
    private static byte[] getProdToken(ScrtProps scrtPropVals) throws JfrsSdkRcException {
        byte[] desiredProdToken = null;
        synchronized (prodTokenMapLock) {
            desiredProdToken = JfrsZosWriter.prodTokenMap.get(scrtPropVals.getProductName());
            if (desiredProdToken == null) {
                FrsResult prodRegResult = new FrsResult(0, 0, "".getBytes());
                try {
                    prodRegResult = FeatureRegistrationServiceWrapper.registerProduct(
                        scrtPropVals.getProductName(), scrtPropVals.getProductInstance(),
                        scrtPropVals.getVersion(), scrtPropVals.getRelease(), scrtPropVals.getModLevel(),
                        RegProdOption.PERSIST
                    );
                } catch (JFRSException except) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, scrtPropVals,
                        JfrsSdkRcException.REG_PROD_FAILED_RC, JfrsSdkRcException.JFRS_EXCEPTION_RSN,
                        "FeatureRegistrationService.registerProduct threw an exception: " + except.getMessage()
                    );
                }
                if (prodRegResult == null) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, scrtPropVals,
                        JfrsSdkRcException.REG_PROD_FAILED_RC, JfrsSdkRcException.NULL_RESULT_RSN,
                        "FeatureRegistrationService.registerProduct returned a null result"
                    );
                }
                if (prodRegResult.getRc() == -1 || prodRegResult.getRc() > 4 || prodRegResult.getToken() == null) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, scrtPropVals, prodRegResult.getRc(), prodRegResult.getRsn(),
                        "FeatureRegistrationService.registerProduct returned a failing return code"
                    );
                }

                // Cache the product token by product name so that we do not have to register the
                // product again each time that we want to use the product in this REST service
                desiredProdToken = prodRegResult.getToken();
                JfrsZosWriter.prodTokenMap.put(scrtPropVals.getProductName(), desiredProdToken);
            }
        }
        return desiredProdToken;
    }

    //------------------------------------------------------------------------
    /**
     * Get the token for the specified feature from our featTokenMap.
     * If the feature is not in our map, call the Jfrs addFeature function
     * to get the token, and cache the token in our map.
     *
     * @param ScrtProps scrtPropVals The SCRT property values used in getting a feature token.
     *
     * @throws JfrsSdkRcException when a token cannot be retrieved
     *
     * @return A FeatTokenInfo object containing the feature's token and last update time.
     */
    private static FeatTokenInfo getFeatTokenInfo(ScrtProps scrtPropVals) throws JfrsSdkRcException {
        FeatTokenInfo featTokenInfo = null;
        synchronized (featTokenMapLock) {
            featTokenInfo = JfrsZosWriter.featTokenMap.get(scrtPropVals.getFeatureName());
            if (featTokenInfo == null) {
                // the feature has never been added, so add it now
                FrsResult addFeatResult = new FrsResult(0, 0, "".getBytes());
                try {
                    final String noLmpKey = "";
                    Feature featObj = new Feature(
                        scrtPropVals.getFeatureName(), scrtPropVals.getFeatureDescription(), noLmpKey,  scrtPropVals.getProductId(),
                        FeatureStateOption.FL_STATE_ENABLED, FeatureSCRTOption.FL_SCRT_USED
                    );
                    addFeatResult = FeatureRegistrationServiceWrapper.addFeature(featObj, getProdToken(scrtPropVals));
                } catch (JFRSException except) {
                    logErrThrowRcExcept(
                        GET_FEAT_TOKEN, scrtPropVals,
                        JfrsSdkRcException.Add_FEAT_FAILED_RC, JfrsSdkRcException.JFRS_EXCEPTION_RSN,
                        "FeatureRegistrationService.addFeature threw an exception: " + except.getMessage()
                    );
                }
                if (addFeatResult == null) {
                    logErrThrowRcExcept(
                        GET_FEAT_TOKEN, scrtPropVals,
                        JfrsSdkRcException.Add_FEAT_FAILED_RC, JfrsSdkRcException.NULL_RESULT_RSN,
                        "FeatureRegistrationService.addFeature returned a null result"
                    );
                }
                if (addFeatResult.getRc() == -1 || addFeatResult.getRc() > 4 || addFeatResult.getToken() == null) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, scrtPropVals, addFeatResult.getRc(), addFeatResult.getRsn(),
                        "FeatureRegistrationService.addFeature returned a failing return code"
                    );
                }

                // Cache the feature token by feature name so that we do not have to add the
                // feature again each time that we want to use the token for this feature.
                featTokenInfo = new FeatTokenInfo(addFeatResult.getToken());
                JfrsZosWriter.featTokenMap.put(scrtPropVals.getFeatureName(), featTokenInfo);
            }
        }
        return featTokenInfo;
    }

    //------------------------------------------------------------------------
    /**
     * This utility logs information related to a detected problem and then
     * throws an exception in which a return code and reason code are recorded.
     *
     * @param rc The return code to be logged and recorded in the exception
     * @param rsn The reason code to be logged recorded in the exception
     * @param function The function name to be logged
     * @param featureName The feature name to be logged
     * @param errorText Text to be logged describing the reason for the error
     *
     * @throws JfrsSdkRcException
     */
	private static void logErrThrowRcExcept(
        String function, ScrtProps scrtPropVals, int rc, int rsn, String errorText
    ) throws JfrsSdkRcException {
        if (scrtPropVals == null) {
            scrtPropVals = new ScrtProps("null_ScrtProps");
        }

        log.error(
            "logErrThrowRcExcept" +
            "\n    Function    = " + function +
            "\n    Error Msg   = " + errorText +
            "\n    Return code = " + rc +
            "\n    Reason code = " + rsn +
            "\n    " + ScrtProps.PROD_NAME_KW + " = " + scrtPropVals.getProductName() +
            "\n    " + ScrtProps.PROD_ID_KW + "   = " + scrtPropVals.getProductId() +
            "\n    " + ScrtProps.VERSION_KW + "     = " + scrtPropVals.getVersion() +
            "\n    " + ScrtProps.RELEASE_KW + "     = " + scrtPropVals.getRelease() +
            "\n    " + ScrtProps.MOD_LEV_KW + "    = " + scrtPropVals.getModLevel() +
            "\n    " + ScrtProps.FEAT_NAME_KW + " = " + scrtPropVals.getFeatureName() +
            "\n    " + ScrtProps.FEAT_DESC_KW + " = " + scrtPropVals.getFeatureDescription()
        );
        throw new JfrsSdkRcException(rc, rsn);
	}
} // end JfrsZosWriter class


/*************************************************************************************************
 * Fake FRS classes to enable this prototype to compile before integrating into the REST API SDK.
*************************************************************************************************/
// Todo: Remove the following fake classes and use the real classes when integrating into the REST SDK API

class JFRSException extends Exception {
    public JFRSException(String msgText) {
        super(msgText);
    }
}

enum RegProdOption {
    PERSIST
}

enum FeatureStateOption {
    FL_STATE_ENABLED
}

enum FeatureUsedOption {
    FL_USED_YES
}

enum FeatureSCRTOption {
    FL_SCRT_USED
}

class Feature {
    public Feature(
        String featureName, String featureDesc, String lmpKey,
        String productId, FeatureStateOption featStateOpt, FeatureSCRTOption featScrtOpt
    ) {
        // Nothing to do for this fake class
    }
}

class FeatureRegistrationServiceWrapper {
    public static FrsResult registerProduct(
        String productName, String prodInstance, String version,
        String release, String modLevel, RegProdOption regProdOpt
    ) throws JFRSException {
        return new FrsResult(0, 0, "registerProduct Token".getBytes());
    }

    public static FrsResult addFeature(Feature featObj, byte[] prodToken) throws JFRSException {
        return new FrsResult(0, 0, "addFeature Token".getBytes());
    }

    public static FrsResult updateFeature(
        byte[] prodToken, byte[] featToken, FeatureStateOption featStateOpt, FeatureUsedOption featUsedOpt
    ) throws JFRSException {
        return new FrsResult(0, 0, "updateFeature result".getBytes());
    }
}

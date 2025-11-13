package org.example;

import java.util.HashMap;
import java.util.Map;

import org.example.ScrtProps;

//************************************************************************
public class JfrsZosWriter {
    // names for function parameter
    private static final String UPDATE_FEAT_USED = "Update feature used";
    private static final String VALIDATE_PROPS = "Validate JFRS Properties";
    private static final String GET_PROD_TOKEN = "Get product token";
    private static final String GET_FEAT_TOKEN = "Get feature token";

    // todo: Determine valid RC values
    private static final int INVALID_PROPS_RC = 100;
    private static final int REG_PROD_FAILED_RC = 101;
    private static final int Add_FEAT_FAILED_RC = 102;
    private static final int UPDATE_FEAT_FAILED_RC = 103;

    // todo: Determine valid RSN values
    private static final int NULL_RESULT_RSN = 10;
    private static final int JFRS_EXCEPTION_RSN = 11;
    private static final int NULL_EMPTY_BLANK_RSN = 12;

    // we cache the product token for future use
    private static Map<String, byte[]> prodTokenMap = new HashMap<>();
    private static final Object prodTokenMapLock = new Object();

    // we cache every feature token for future use
    private static Map<String, byte[]> featTokenMap = new HashMap<>();
    private static final Object featTokenMapLock = new Object();

    //------------------------------------------------------------------------
    /**
     * Record the use of the specified feature.
     *
     * @param ScrtProps scrtPropVals The SCRT property values used in recording the use of a feature.
     *
     * @return An FrsResult with a return code and reason code.
     */
    public FrsResult recordFeatureUse(ScrtProps scrtPropVals) {
        try {
            validateProps(scrtPropVals);

            // Todo: remove print statements when integrating into REST SDK API
            System.out.println("\nrecordFeatureUse: Received these SCRT property values:");
            System.out.println("    " + ScrtProps.PROD_NAME_KW  + "\t\t= " + scrtPropVals.getProdName());
            System.out.println("    " + ScrtProps.PROD_ID_KW + "\t\t= " + scrtPropVals.getProdId());
            System.out.println("    productInstance\t= " + scrtPropVals.getProdInstance());
            System.out.println("    " + ScrtProps.PROD_VER_KW + "\t\t= " + scrtPropVals.getVersion());
            System.out.println("    " + ScrtProps.PROD_REL_KW + "\t\t= " + scrtPropVals.getRelease());
            System.out.println("    " + ScrtProps.PROD_MOD_LEV_KW + "\t\t= " + scrtPropVals.getModLevel());
            System.out.println("    " + ScrtProps.FEAT_NAME_KW + "\t\t= " + scrtPropVals.getFeatName());
            System.out.println("    " + ScrtProps.FEAT_DESC_KW + "\t= " + scrtPropVals.getFeatDesc());

            FrsResult updateFeatResult = new FrsResult(0, 0, "".getBytes());
            try {
                updateFeatResult = FeatureRegistrationServiceWrapper.updateFeature(
                    getProdToken(scrtPropVals), getFeatToken(scrtPropVals),
                    FeatureStateOption.FL_STATE_ENABLED, FeatureUsedOption.FL_USED_YES
                );
            } catch (JFRSException except) {
                logErrThrowRcExcept(
                    UPDATE_FEAT_USED, scrtPropVals, UPDATE_FEAT_FAILED_RC, JFRS_EXCEPTION_RSN,
                    "FeatureRegistrationService.updateFeature threw an exception: " + except.getMessage()
                );
            }
            if (updateFeatResult == null) {
                logErrThrowRcExcept(
                    UPDATE_FEAT_USED, scrtPropVals, UPDATE_FEAT_FAILED_RC, NULL_RESULT_RSN,
                    "FeatureRegistrationService.updateFeature returned a null result"
                );
            }
            if (updateFeatResult.getRc() == -1 || updateFeatResult.getRc() > 4 || updateFeatResult.getToken() == null) {
                logErrThrowRcExcept(
                    UPDATE_FEAT_USED, scrtPropVals, updateFeatResult.getRc(), updateFeatResult.getRsn(),
                    "FeatureRegistrationService.updateFeature returned a failing return code"
                );
            }
            // Todo: remove print statements when integrating into REST SDK API
            System.out.println("\nrecordFeatureUse: Recorded the use of featureName = '" +
                scrtPropVals.getFeatName() + "' for SCRT reporting."
            );
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
                VALIDATE_PROPS, scrtPropVals, INVALID_PROPS_RC, NULL_EMPTY_BLANK_RSN,
                "The supplied scrtPropVals parameter is null"
            );
        }

        String invalidProps = "";

        if (scrtPropVals.getProdName() == null || scrtPropVals.getProdName().isBlank()) {
            invalidProps += ScrtProps.PROD_NAME_KW + " ";
        }
        if (scrtPropVals.getProdId() == null || scrtPropVals.getProdId().isBlank()) {
            invalidProps += ScrtProps.PROD_ID_KW + " ";
        }
        if (scrtPropVals.getProdInstance() == null || scrtPropVals.getProdInstance().isBlank()) {
            invalidProps += "prodInstance ";
        }
        if (scrtPropVals.getVersion() == null || scrtPropVals.getVersion().isBlank()) {
            invalidProps += ScrtProps.PROD_VER_KW + " ";
        }
        if (scrtPropVals.getRelease() == null || scrtPropVals.getRelease().isBlank()) {
            invalidProps += ScrtProps.PROD_REL_KW + " ";
        }
        if (scrtPropVals.getModLevel() == null || scrtPropVals.getModLevel().isBlank()) {
            invalidProps += ScrtProps.PROD_MOD_LEV_KW + " ";
        }
        if (scrtPropVals.getFeatName() == null || scrtPropVals.getFeatName().isBlank()) {
            invalidProps += ScrtProps.FEAT_NAME_KW + " ";
        }
        if (scrtPropVals.getFeatDesc() == null || scrtPropVals.getFeatDesc().isBlank()) {
            invalidProps += ScrtProps.FEAT_DESC_KW + " ";
        }

        if (!invalidProps.isEmpty()) {
            logErrThrowRcExcept(
                VALIDATE_PROPS, scrtPropVals, INVALID_PROPS_RC, NULL_EMPTY_BLANK_RSN,
                "The following scrtPropVals are null, empty, or blank: " + invalidProps
            );
        }
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
            desiredProdToken = JfrsZosWriter.prodTokenMap.get(scrtPropVals.getProdName());
            if (desiredProdToken == null) {
                FrsResult prodRegResult = new FrsResult(0, 0, "".getBytes());
                try {
                    prodRegResult = FeatureRegistrationServiceWrapper.registerProduct(
                        scrtPropVals.getProdName(), scrtPropVals.getProdInstance(),
                        scrtPropVals.getVersion(), scrtPropVals.getRelease(), scrtPropVals.getModLevel(),
                        RegProdOption.PERSIST
                    );
                } catch (JFRSException except) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, scrtPropVals, REG_PROD_FAILED_RC, JFRS_EXCEPTION_RSN,
                        "FeatureRegistrationService.registerProduct threw an exception: " + except.getMessage()
                    );
                }
                if (prodRegResult == null) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, scrtPropVals, REG_PROD_FAILED_RC, NULL_RESULT_RSN,
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
                JfrsZosWriter.prodTokenMap.put(scrtPropVals.getProdName(), desiredProdToken);
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
     * @return A byte array representing the product token.
     */
    private static byte[] getFeatToken(ScrtProps scrtPropVals) throws JfrsSdkRcException {
        byte[] desiredFeatToken = null;
        synchronized (featTokenMapLock) {
            desiredFeatToken = JfrsZosWriter.featTokenMap.get(scrtPropVals.getFeatName());
            if (desiredFeatToken == null) {
                FrsResult addFeatResult = new FrsResult(0, 0, "".getBytes());
                try {
                    final String noLmpKey = "";
                    Feature featObj = new Feature(
                        scrtPropVals.getFeatName(), scrtPropVals.getFeatDesc(), noLmpKey,  scrtPropVals.getProdId(),
                        FeatureStateOption.FL_STATE_ENABLED, FeatureSCRTOption.FL_SCRT_USED
                    );
                    addFeatResult = FeatureRegistrationServiceWrapper.addFeature(featObj, getProdToken(scrtPropVals));
                } catch (JFRSException except) {
                    logErrThrowRcExcept(
                        GET_FEAT_TOKEN, scrtPropVals, Add_FEAT_FAILED_RC, JFRS_EXCEPTION_RSN,
                        "FeatureRegistrationService.addFeature threw an exception: " + except.getMessage()
                    );
                }
                if (addFeatResult == null) {
                    logErrThrowRcExcept(
                        GET_FEAT_TOKEN, scrtPropVals, Add_FEAT_FAILED_RC, NULL_RESULT_RSN,
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
                desiredFeatToken = addFeatResult.getToken();
                JfrsZosWriter.featTokenMap.put(scrtPropVals.getFeatName(), desiredFeatToken);
            }
        }
        return desiredFeatToken;
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
            scrtPropVals = new ScrtProps("null_ScrtProps", "null_ScrtProps");
        }

        // ToDo: Replace with CommonMessageService.getInstance().createApiMessage
        System.out.println(
            "\nlogErrThrowRcExcept:" +
            "\n    Error Msg   = " + errorText +
            "\n    Return code = " + rc +
            "\n    Reason code = " + rsn +
            "\n    Function    = " + function +
            "\n    prodName    = " + scrtPropVals.getProdName() +
            "\n    prodId      = " + scrtPropVals.getProdId() +
            "\n    version     = " + scrtPropVals.getVersion() +
            "\n    release     = " + scrtPropVals.getRelease() +
            "\n    modLevel    = " + scrtPropVals.getModLevel() +
            "\n    FeatName    = " + scrtPropVals.getFeatName() +
            "\n    FeatDesc    = " + scrtPropVals.getFeatDesc()
        );
        throw new JfrsSdkRcException(rc, rsn);
	}
} // end JfrsZosWriter class


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
class JfrsSdkRcException extends Exception {
    private int rc = 0;
    private int rsn = 0;

    /**
     * Constructor.
     *
     * @param rc The return code to be recorded in the exception
     * @param rsn The reason code to be recorded in the exception
     */
    public JfrsSdkRcException(int rc, int rsn) {
        super();
        this.rc = rc;
        this.rsn = rsn;
    }

    /**
     * Form an FrsResult from this exception.
     *
     * @return An FrsResult object containing the relevant
     *         return code and reason code.
     */
    public FrsResult getFrsResult() {
        return new FrsResult(this.rc, this.rsn, "".getBytes());
    }
}


/*************************************************************************************************
 * Fake FRS classes to enable this prototype to compile before integrating into the REST API SDK.
*************************************************************************************************/
// Todo: Remove the following classes and use the real classes when integrating into the REST SDK API
class FrsResult {
    private int rc = 0;
    private int rsn = 0;

    public FrsResult(int rc, int rsn,  byte[] token) {
        this.rc = rc;
        this.rsn = rsn;
    }
    public int getRc() {
        return this.rc;
    }
    public int getRsn() {
        return this.rsn;
    }
    public byte[] getToken() {
        return "Token from FrsResult".getBytes();
    }
}

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

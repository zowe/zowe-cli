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
    private static byte[] prodToken = null;
    private static final Object prodTokenLock = new Object();

    // we cache every feature token for future use
    private static Map<String, byte[]> featTokenMap = new HashMap<>();
    private static final Object featTokenMapLock = new Object();

    private static String prodInstance;

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
            System.out.println("___________________________________");
            System.out.println("frsZosWriter.recordFeatureUse:");
            System.out.println("\nUsing these SCRT property values:");
            System.out.println("prodName = " + scrtPropVals.getProdName());
            System.out.println("prodId = " + scrtPropVals.getProdId());
            System.out.println("prodId used as prodInstance = " + JfrsZosWriter.prodInstance);
            System.out.println("version = " + scrtPropVals.getVersion());
            System.out.println("release = " + scrtPropVals.getRelease());
            System.out.println("modLevel = " + scrtPropVals.getModLevel());
            System.out.println("featName = " + scrtPropVals.getFeatName());
            System.out.println("featDesc = " + scrtPropVals.getFeatDesc());

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
            System.out.println("\nRecorded the use of featureName = '" + scrtPropVals.getFeatName() +
                "' for SCRT reporting."
            );
            System.out.println("___________________________________");
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
            invalidProps += " prodName";
        }
        if (scrtPropVals.getProdId() == null || scrtPropVals.getProdId().isBlank()) {
            invalidProps += " prodId";
        } else {
            // Todo: determine if this is right: JfrsZosWriter always uses the product ID as the product instance
            JfrsZosWriter.prodInstance = scrtPropVals.getProdId();
        }
        if (scrtPropVals.getVersion() == null || scrtPropVals.getVersion().isBlank()) {
            invalidProps += " version";
        }
        if (scrtPropVals.getRelease() == null || scrtPropVals.getRelease().isBlank()) {
            invalidProps += " release";
        }
        if (scrtPropVals.getModLevel() == null || scrtPropVals.getModLevel().isBlank()) {
            invalidProps += " modLevel";
        }
        if (scrtPropVals.getFeatName() == null || scrtPropVals.getFeatName().isBlank()) {
            invalidProps += " featName";
        }
        if (scrtPropVals.getFeatDesc() == null || scrtPropVals.getFeatDesc().isBlank()) {
            invalidProps += " featDesc";
        }

        if (!invalidProps.isEmpty()) {
            logErrThrowRcExcept(
                VALIDATE_PROPS, scrtPropVals, INVALID_PROPS_RC, NULL_EMPTY_BLANK_RSN,
                "The following properties are null, empty, or blank:" + invalidProps
            );
        }
    }

    //------------------------------------------------------------------------
    /**
     * Get the token for the product from our cached prodToken property.
     * If we have not yet cached the token, call the Jfrs registerProduct
     * function to get a token and store the token into our prodToken property.
     * 
     * @param ScrtProps scrtPropVals The SCRT property values used in getting a product token.
     * 
     * @throws JfrsSdkRcException when a token cannot be retrieved
     * 
     * @return A byte array representing the product token.
     */
    private static byte[] getProdToken(ScrtProps scrtPropVals) throws JfrsSdkRcException {
        synchronized (prodTokenLock) {
            if (JfrsZosWriter.prodToken == null) {
                FrsResult prodRegResult = new FrsResult(0, 0, "".getBytes());
                try {
                    prodRegResult = FeatureRegistrationServiceWrapper.registerProduct(
                        scrtPropVals.getProdName(), JfrsZosWriter.prodInstance, 
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

                // cache the product token for future use.
                JfrsZosWriter.prodToken = prodRegResult.getToken();
            }
        }
        return JfrsZosWriter.prodToken;
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
        String prodName = scrtPropVals.getProdName();
        String prodId = scrtPropVals.getProdId();
        String version = scrtPropVals.getVersion();
        String release = scrtPropVals.getRelease();
        String modLevel = scrtPropVals.getModLevel();
        String featName = scrtPropVals.getFeatName();
        String featDesc = scrtPropVals.getFeatDesc();

        // ToDo: Replace with CommonMessageService.getInstance().createApiMessage
        System.out.println(
            "\n_________________________________________________" +
            "\nlogErrThrowRcExcept:" +
            "\nError Msg = " + errorText +
            "\nReturn code = " + rc +
            "\nReason code = " + rsn +
            "\nFunction = " + function +
            "\nProdName = " + (prodName == null ? "null_prodName" : prodName) +
            "\nprodId = " + (prodId == null ? "null_prodId" : prodId) +
            "\nVersion = " + (version == null ? "null_version" : version) + "." + 
                (release == null ? "null_release": release) + "." + 
                (modLevel == null ? "null_modLevel" : modLevel) +
            "\nFeatName = " + (featName == null ? "null_featName" : featName) +
            "\nFeatDesc = " + (featDesc == null ? "null_featDesc" : featDesc) +
            "\n_________________________________________________"
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


package org.example;

import java.util.HashMap;
import java.util.Map;

//************************************************************************
public class JfrsZosWriter {
    // names for function parameter
    private static final String INCR_FEAT_COUNT = "Increment feature count";
    private static final String VALIDATE_PROPS = "Validate JFRS Properties";
    private static final String GET_PROD_TOKEN = "Get product token";
    private static final String GET_FEAT_TOKEN = "Get feature token";
    
    // todo: Determine valid RC values
    private static final int INVALID_PROPS_RC = 100;
    private static final int REG_PROD_FAILED_RC = 101;
    private static final int Add_FEAT_FAILED_RC = 102;
    private static final int INCR_FEAT_FAILED_RC = 103;

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

    // Todo: get the real properties from application.yaml
    private static String productName = "OPS/MVS REST Service"; // from application.yaml serviceName
    private static String productId = "OPSREST";                // from application.yaml productId
    
    // Todo: get the real properties from manifest ImplementationVersion
    private static String version = "14";
    private static String release = "2";
    private static String modLevel = "3";

    private static String prodInstance = JfrsZosWriter.productId;

    //------------------------------------------------------------------------
    /**
     * Increment the use count for the specified feature.
     * 
     * @return An FrsResult with a return code and reason code.
     */
    public FrsResult incrementFeatCount(String featureName, String featureDesc) {
        // Todo: remove print statements when integrating into REST SDK API
        System.out.println("___________________________________\nJfrsZosWriter.incrementCount:");
        System.out.println("productName = " + JfrsZosWriter.productName);
        System.out.println("productId = " + JfrsZosWriter.productId);
        System.out.println("prodId used as prodInstance = " + JfrsZosWriter.prodInstance);
        System.out.println("version = " + JfrsZosWriter.version);
        System.out.println("release = " + JfrsZosWriter.release);
        System.out.println("modLevel = " + JfrsZosWriter.modLevel);
        System.out.println("featureName = " + featureName);
        System.out.println("featuredesc = " + featureDesc);

        try {
            // Todo: Remove this block when integrating into REST API SDK 
            /* Uncomment this block to test exception handling in validateProps()
            productName = "";
            productId = null;
            featureName = "   ";
            featureDesc = null;
            JfrsZosWriter.version = "   ";
            JfrsZosWriter.modLevel = null;
            */

            validateProps(featureName, featureDesc);

            FrsResult incFeatResult = new FrsResult(0, 0, "".getBytes());
            try {
                incFeatResult = FeatureRegistrationServiceWrapper.incrementFeature(
                    getProdToken(), getFeatToken(featureName, featureDesc), 1
                );
            } catch (JFRSException except) {
                logErrThrowRcExcept(
                    INCR_FEAT_COUNT, featureName, INCR_FEAT_FAILED_RC, JFRS_EXCEPTION_RSN,
                    "FeatureRegistrationService.incrementFeature threw an exception: " + except.getMessage()
                );
            }
            if (incFeatResult == null) {
                logErrThrowRcExcept(
                    INCR_FEAT_COUNT, featureName, INCR_FEAT_FAILED_RC, NULL_RESULT_RSN,
                    "FeatureRegistrationService.incrementFeature returned a null result"
                );
            }
            if (incFeatResult.getRc() == -1 || incFeatResult.getRc() > 4 || incFeatResult.getToken() == null) {
                logErrThrowRcExcept(
                    INCR_FEAT_COUNT, featureName, incFeatResult.getRc(), incFeatResult.getRsn(),
                    "FeatureRegistrationService.incrementFeature returned a failing return code"
                );
            }
            System.out.println("featureName = '" + featureName + "' usage count was incremented by one.");
            System.out.println("___________________________________");
            return incFeatResult;
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
    private void validateProps(String featureName, String featureDesc) throws JfrsSdkRcException {
        String invalidProps = "";
        
        if (JfrsZosWriter.productName == null || JfrsZosWriter.productName.isBlank()) {
            invalidProps += " productName";
            JfrsZosWriter.productName = "productName_is_null/empty/blank";
        }
        if (JfrsZosWriter.productId == null || JfrsZosWriter.productId.isBlank()) {
            invalidProps += " productId";
            JfrsZosWriter.productId = "productId_is_null/empty/blank";
        }
        if (JfrsZosWriter.prodInstance == null || JfrsZosWriter.prodInstance.isBlank()) {
            invalidProps += " prodInstance";
            JfrsZosWriter.prodInstance = "prodInstance_is_null/empty/blank";
        }
        if (JfrsZosWriter.version == null || JfrsZosWriter.version.isBlank()) {
            invalidProps += " version";
            JfrsZosWriter.version = "version_is_null/empty/blank";
        }
        if (JfrsZosWriter.release == null || JfrsZosWriter.release.isBlank()) {
            invalidProps += " release";
            JfrsZosWriter.release = "release_is_null/empty/blank";
        }
        if (JfrsZosWriter.modLevel == null || JfrsZosWriter.modLevel.isBlank()) {
            invalidProps += " modLevel";
            JfrsZosWriter.modLevel = "modLevel_is_null/empty/blank";
        }
        if (featureName == null || featureName.isBlank()) {
            invalidProps += " featureName";
            featureName = "featureName_is_null/empty/blank";
        }
        if (featureDesc == null || featureDesc.isBlank()) {
            invalidProps += " featureDesc";
            featureDesc = "featureDesc_is_null/empty/blank";
        }

        if (!invalidProps.isEmpty()) {
            logErrThrowRcExcept(
                VALIDATE_PROPS, featureName, INVALID_PROPS_RC, NULL_EMPTY_BLANK_RSN,
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
     * @throws JfrsSdkRcException when a token cannot be retrieved
     * 
     * @return A byte array representing the product token.
     */
    private static byte[] getProdToken() throws JfrsSdkRcException {
        synchronized (prodTokenLock) {
            if (JfrsZosWriter.prodToken == null) {
                FrsResult prodRegResult = new FrsResult(0, 0, "".getBytes());
                try {
                    prodRegResult = FeatureRegistrationServiceWrapper.registerProduct(
                        JfrsZosWriter.productName, JfrsZosWriter.prodInstance, 
                        JfrsZosWriter.version, JfrsZosWriter.release, JfrsZosWriter.modLevel, RegProdOption.PERSIST
                    );
                } catch (JFRSException except) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, "No Feature", REG_PROD_FAILED_RC, JFRS_EXCEPTION_RSN,
                        "FeatureRegistrationService.registerProduct threw an exception: " + except.getMessage()
                    );
                }
                if (prodRegResult == null) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, "No Feature", REG_PROD_FAILED_RC, NULL_RESULT_RSN,
                        "FeatureRegistrationService.registerProduct returned a null result"
                    );
                }
                if (prodRegResult.getRc() == -1 || prodRegResult.getRc() > 4 || prodRegResult.getToken() == null) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, "No Feature", prodRegResult.getRc(), prodRegResult.getRsn(),
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
     * @param featureName The name of the desired feature
     * @param featureDesc The description of the desired feature
     * 
     * @throws JfrsSdkRcException when a token cannot be retrieved
     * 
     * @return A byte array representing the product token.
     */
    private static byte[] getFeatToken(String featureName, String featureDesc) throws JfrsSdkRcException {
        byte[] desiredFeatToken = null;
        synchronized (featTokenMapLock) {
            desiredFeatToken = JfrsZosWriter.featTokenMap.get(featureName);
            if (desiredFeatToken == null) {
                FrsResult addFeatResult = new FrsResult(0, 0, "".getBytes());
                try {
                    final String noLmpKey = "";
                    Feature featObj = new Feature(
                        featureName, featureDesc, noLmpKey,  JfrsZosWriter.productId,
                        FeatureStateOption.FL_STATE_ENABLED, FeatureSCRTOption.FL_SCRT_USED
                    );
                    addFeatResult = FeatureRegistrationServiceWrapper.addFeature(featObj, getProdToken());
                } catch (JFRSException except) {
                    logErrThrowRcExcept(
                        GET_FEAT_TOKEN, featureName, Add_FEAT_FAILED_RC, JFRS_EXCEPTION_RSN,
                        "FeatureRegistrationService.addFeature threw an exception: " + except.getMessage()
                    );
                }
                if (addFeatResult == null) {
                    logErrThrowRcExcept(
                        GET_FEAT_TOKEN, featureName, Add_FEAT_FAILED_RC, NULL_RESULT_RSN,
                        "FeatureRegistrationService.addFeature returned a null result"
                    );
                }
                if (addFeatResult.getRc() == -1 || addFeatResult.getRc() > 4 || addFeatResult.getToken() == null) {
                    logErrThrowRcExcept(
                        GET_PROD_TOKEN, "No Feature", addFeatResult.getRc(), addFeatResult.getRsn(),
                        "FeatureRegistrationService.addFeature returned a failing return code"
                    );
                }

                // Cache the feature token by feature name so that we do not have to add the
                // feature again each time that we want to use the token for this feature.
                desiredFeatToken = addFeatResult.getToken();
                JfrsZosWriter.featTokenMap.put(featureName, desiredFeatToken);
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
        String function, String featureName, int rc, int rsn, String errorText
    ) throws JfrsSdkRcException {
        // ToDo: Replace with CommonMessageService.getInstance().createApiMessage
        System.out.println(
            "\n_________________________________________________" +
            "\nlogErrThrowRcExcept:" +
            "\nFunction = " + function +
            "\nProductName = " + JfrsZosWriter.productName + 
            "\nFeatureName = " + featureName +
            "\nVersion = " + version + "." + release + "." + modLevel +
            "\nReturn code = " + rc +
            "\nReason code = " + rsn +
            "\nError Msg = " + errorText +
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

   public static FrsResult incrementFeature(byte[] prodToken, byte[] featToken, int count) throws JFRSException {
        return new FrsResult(0, 0, "incrementFeature result".getBytes());
    }
}


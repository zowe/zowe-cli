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

// Todo: replace the example package wit the real one when integrating into the REST SDK
// package com.broadcom.restapi.sdk.jfrs;
package org.example;

// Todo: replace the example package with the real one when integrating into REST API SDK
// import com.ca.ccs.jfrs.JfrsSdkRcException;
import org.example.JfrsSdkRcException;

import lombok.extern.slf4j.Slf4j;

/**
 * This class holds the set of SCRT properties required for recording
 * the use of a feature.
 */
@Slf4j
public class ScrtProps {
    // SCRT property keywords. Some are used in the
    // Zowe-SCRT-client-feature header. Some are just for logging messages.
    public static final String FEAT_NAME_KW = "featureName";
    public static final String FEAT_DESC_KW = "featureDescription";
    public static final String PROD_ID_KW = "productId";
    public static final String PROD_NAME_KW = "productName";
    public static final String PROD_INST_KW = "productInstance";
    public static final String PROD_VER_KW = "productVersion";
    public static final String VERSION_KW = "version";
    public static final String RELEASE_KW = "release";
    public static final String MOD_LEV_KW = "modLevel";

    // Todo: get the real default productId property from application.yaml
    // server.scrt.productId
    private static final String dfltProductId = "pIdYaml";

    // Todo: get the real default productVersion property from application.yaml
    // server.scrt.productVersion
    private static final String dfltProductVersion = "1111.2222.33333";

    private String featureName;     // used for featureName and featureDescription
    private String productName;     // retrieved from product catalog using product Id
    private String productId;       // used for productId and productInstance and
    private String version;         // first 2 digits of productVersion
    private String release;         // middle 2 digits of productVersion
    private String modLevel;        // last 2 digits of productVersion

    //*********************************************************************
    /**
     * The constructor requires that feature name be explicitly supplied.
     *
     * @param featureName Name of the feature
     *
     * @throws JfrsSdkRcException when the default productId cannot be found in the product catalog.
     */
    ScrtProps(String featureName) throws JfrsSdkRcException {
        ensureNotNullEmptyOrBlank(featureName, this.FEAT_NAME_KW);

        final int MAX_FEATURE_NAME_LEN = 48;
        if (featureName.length() > MAX_FEATURE_NAME_LEN) {
            JfrsSdkRcException.logErrThrowRcExcept(
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.TOO_LONG_RSN,
                "The supplied featureName '" + featureName +
                "' is longer than " + MAX_FEATURE_NAME_LEN + " bytes"
            );
        }
        this.featureName = featureName;

        // assign default product properties until explicitly overridden.
        setProductInfo(dfltProductId, dfltProductVersion);
    }

    //*********************************************************************
    /**
     * Specify SCRT product properties to be used. They will replace
     * the default product values configured by the REST service.
     *
     * @param productId         Product ID
     * @param productVersion    Product version (vv.rr.mm)
     *
     * @throws JfrsSdkRcException when productId cannot be found in the product catalog.
     */
    public void setProductInfo(String productId, String productVersion) throws JfrsSdkRcException {
        ensureNotNullEmptyOrBlank(productId, this.PROD_ID_KW);

        final int MAX_PRODUCT_ID_LEN = 8;
        if (productId.length() > MAX_PRODUCT_ID_LEN) {
            JfrsSdkRcException.logErrThrowRcExcept(
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.TOO_LONG_RSN,
                "The supplied productId '" + productId +
                "' is longer than " + MAX_PRODUCT_ID_LEN + " bytes"
            );
        }
        this.productId = productId;
        this.productName = this.getProdNameFromProdCatalog(productId);

        ensureNotNullEmptyOrBlank(productVersion, this.PROD_VER_KW);
        this.extractValuesFromFullProdVersion(productVersion);
    }

    //*********************************************************************
    /**
     * Get the product name from the product catalog, using the productId
     * as the key.
     *
     * @param productId Product ID to look up in the product catalog.
     *
     * @throws JfrsSdkRcException when productId cannot be found in the product catalog.
     *
     * @return The product name found in the catalog.
     */
    private String getProdNameFromProdCatalog(String productId) throws JfrsSdkRcException {
        // Todo: replace with real retrieval from the product catalog
        boolean successFromProdCatalog = true;
        if (!successFromProdCatalog) {
            JfrsSdkRcException.logErrThrowRcExcept(
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.PROD_NOT_IN_CATALOG_RSN,
                PROD_ID_KW + " = '" + productId + "' was not found in the product catalog"
            );
        }
        return "ProductName_from_product_catalog_for_productId = " + productId;
    }

    //*********************************************************************
    /**
     * Extract individual SCRT version properties from a full product version number.
     *
     * @param fullProdVersion The full product version number (version.release.modLevel).
     *
     * @throws JfrsSdkRcException when fullProdVersion does not have 3 parts or is not numeric.
     */
    private void extractValuesFromFullProdVersion(String fullProdVersion) throws JfrsSdkRcException {
        if (fullProdVersion == null) {
            JfrsSdkRcException.logErrThrowRcExcept(
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.NULL_EMPTY_BLANK_RSN,
                "The supplied fullProdVersion is null"
            );
        }
        String[] versionParts = fullProdVersion.split("[.]");
        if (versionParts.length < 3) {
            JfrsSdkRcException.logErrThrowRcExcept(
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.INVALID_VERSION_FORMAT_RSN,
                "The supplied fullProdVersion '" + fullProdVersion + "' has less than 3 components"
            );
        }
        try {
            this.version  = String.valueOf(new VersionRegex(versionParts[0]).parse());
            this.release  = String.valueOf(new VersionRegex(versionParts[1]).parse());
            this.modLevel = String.valueOf(new VersionRegex(versionParts[2]).parse());
        } catch (Exception except) {
            JfrsSdkRcException.logErrThrowRcExcept(
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.INVALID_VERSION_FORMAT_RSN,
                "A component of fullProdVersion '" + fullProdVersion + "' is not numeric."
            );
        }
    }

    //*********************************************************************
    /**
     * Determine is the supplied string is null empty or blank.
     */
    private void ensureNotNullEmptyOrBlank(String strToTest, String nameForString) throws JfrsSdkRcException {
        if (strToTest == null || strToTest.isBlank()) {
            JfrsSdkRcException.logErrThrowRcExcept(
                JfrsSdkRcException.INVALID_PROPS_RC, JfrsSdkRcException.NULL_EMPTY_BLANK_RSN,
                "The supplied " + nameForString + " = '" + strToTest + "' cannot be null, empty, or blank"
            );
        }
    }

    //*********************************************************************
    /**
     * Get the SCRT feature name.
     */
    public String getFeatureName() {
        return this.featureName;
    }

    //*********************************************************************
    /**
     * Get the SCRT feature description. FeatureDescription is never
     * displayed in SCRT reports. So, we also use the featureName for
     * for featureDescription.
     */
    public String getFeatureDescription() {
        return this.featureName;
    }

    //*********************************************************************
    /**
     * Get the SCRT product name.
     */
    public String getProductName() {
        return this.productName;
    }

    //*********************************************************************
    /**
     * Get the SCRT product id.
     */
    public String getProductId() {
        return this.productId;
    }

    //*********************************************************************
    /**
     * Get the SCRT product instance. We always use the productId as
     * the productInstance.
     */
    public String getProductInstance() {
        return this.productId;
    }
    //*********************************************************************
    /**
     * Get the SCRT version.
     */
    public String getVersion() {
        return this.version;
    }

    //*********************************************************************
    /**
     * Get the SCRT release.
     */
    public String getRelease() {
        return this.release;
    }

    //*********************************************************************
    /**
     * Get the SCRT modLevel.
     */
    public String getModLevel() {
        return this.modLevel;
    }
}
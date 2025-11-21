/*
 * Copyright (c) 2024 Broadcom.  All Rights Reserved.  The term
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

// Todo: replace package when integrating into the REST SDK
// package com.broadcom.restapi.sdk.config;
package org.example;

/**
 * This class holds the set of SCRT properties required for recording
 * the use of a feature.
 */
public class ScrtProps {
    // SCRT property keywords that can be in the Zowe-SCRT-client-feature header
    public static final String FEAT_NAME_KW = "featureName";
    public static final String FEAT_DESC_KW = "featureDescription";
    public static final String PROD_NAME_KW = "productName";
    public static final String PROD_ID_KW = "productId";
    public static final String PROD_VER_KW = "version";
    public static final String PROD_REL_KW = "release";
    public static final String PROD_MOD_LEV_KW = "modLevel";

    // Todo: get the real default properties from application.yaml
    // from application.yaml serviceName
    private static String dfltProdName = "Product name from application.yaml";
    // from application.yaml productId
    private static String dfltProdId = "Product ID from application.yaml";

    // Todo: get the real default properties from manifest ImplementationVersion
    private static String dfltVersion = "1_from_application.yaml";
    private static String dfltRelease = "2_from_application.yaml";
    private static String dfltModLevel = "3_from_application.yaml";

    private String featName;
    private String featDesc;
    private String prodName;
    private String prodId;
    private String prodInstance;
    private String version;
    private String release;
    private String modLevel;

    //*********************************************************************
    /**
     * The constructor requires that feature properties be explicitly supplied.
     *
     * @param featName Name of the feature
     * @param featDesc Description of the feature
     *
     */
    ScrtProps(String featName, String featDesc) {
        this.featName = featName;
        this.featDesc = featDesc;

        // assign default product properties until explicitly overridden.
        setProductInfo(dfltProdName, dfltProdId, dfltVersion, dfltRelease, dfltModLevel);
        this.prodInstance = dfltProdId;
    }

    //*********************************************************************
    /**
     * Specify product properties to be used instead of the default product
     * values configured by the REST service.
     *
     * @param prodName  Product name
     * @param prodId    Product ID
     * @param version   Product version
     * @param release   Product release
     * @param modLevel  Product modification level
     */
    public void setProductInfo(
        String prodName,
        String prodId,
        String version,
        String release,
        String modLevel
    ) {
        this.prodName = prodName;
        this.prodId = prodId;
        this.version = version;
        this.release = release;
        this.modLevel = modLevel;
        this.prodInstance = prodId;
    }

    //*********************************************************************
    /**
     * Get the SCRT feature name.
     */
    public String getFeatName() {
        return this.featName;
    }

    //*********************************************************************
    /**
     * Get the SCRT feature description.
     */
    public String getFeatDesc() {
        return this.featDesc;
    }

    //*********************************************************************
    /**
     * Get the SCRT product name.
     */
    public String getProdName() {
        return this.prodName;
    }

    //*********************************************************************
    /**
     * Get the SCRT product id.
     */
    public String getProdId() {
        return this.prodId;
    }

    //*********************************************************************
    /**
     * Get the SCRT product instance.
     */
    public String getProdInstance() {
        return this.prodInstance;
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
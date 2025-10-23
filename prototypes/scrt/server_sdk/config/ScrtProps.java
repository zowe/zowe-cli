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
    private String featName;
    private String featDesc;
    private String prodName;
    private String prodId;
    private String version;
    private String release;
    private String modLevel;

    //*********************************************************************
    /**
     * The constructor accepts the minimum required properties for a feature.
     * 
     * @param featName Name of the feature
     * @param featDesc Description of the feature
     * 
     */
    ScrtProps(String featName, String featDesc) {
        this.featName = featName;
        this.featDesc = featDesc;
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
    public void addProductInfo(
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
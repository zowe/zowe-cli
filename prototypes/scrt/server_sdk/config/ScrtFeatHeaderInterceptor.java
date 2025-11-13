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

// for parsing header text
import org.apache.hc.core5.http.HeaderElement;
import org.apache.hc.core5.http.message.BasicHeaderValueParser;
import org.apache.hc.core5.http.message.ParserCursor;
import org.apache.hc.core5.util.CharArrayBuffer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

import org.springframework.lang.NonNull;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.*;

import org.example.JfrsZosWriter;
import org.example.ScrtProps;

/**
 * Interceptor class that extracts feature information from a custom header and
 * records that data for SCRT reporting.
 *
 * The existence of the application.yml property server.jfrs.serviceName enables
 * this inteceptor.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "server.jfrs", name = "serviceName")
public class ScrtFeatHeaderInterceptor implements HandlerInterceptor {

    // Todo: replace with the desired URL string
    public static final String ONLY_RECORD_SCRT_URL = "/apiv1/scrt";

    //------------------------------------------------------------------------
    /**
     * Interception point before the execution of a handler. Called after
     * HandlerMapping determined an appropriate handler object, but before
     * HandlerAdapter invokes the handler.
     *
     * This interceptor detects whether the request has a Zowe-SCRT-client-feature
     * header. If so, it parses the content of the header, validates that required
     * prpoerties were contained in the header, and then calls the Jfrs function
     * to increment the use count of the client feature supplied in the header.
     *
     * @param request  current HTTP request
     * @param response current HTTP response
     * @param handler  chosen handler to execute, for type and/or instance evaluation
     *
     * @return {@code true} if the execution chain should proceed with the
     * next interceptor or the handler itself. Else, DispatcherServlet assumes
     * that this interceptor has already dealt with the response itself.
     *
     * @throws Exception in case of errors
     */
    @Override
    public boolean preHandle(
        HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull Object handler
    ) throws Exception {
        // Todo: remove these diagnostic print statements
        System.out.println(
            "\npreHandle: Received these request properties:\n" +
            "    getContextPath = '" + request.getContextPath() + "'\n" +
            "    getServletPath = '" + request.getServletPath() + "'\n" +
            "    getRequestURI  = '" + request.getRequestURI() + "'\n" +
            "    getRequestURL  = '" + request.getRequestURL() + "'"
        );

        // When the request does not have the header, or if the header
        // does not have required fields, we do nothing.
        String scrtHeaderText = request.getHeader("Zowe-SCRT-client-feature");
        if (scrtHeaderText != null) {
            ScrtProps scrtPropsForFeat = extractHeaderProps(scrtHeaderText);
            if (scrtPropsForFeat != null) {
                // Todo: Remove these comments when integrating into REST API SDK.
                // Uncomment this one line to test exception handling in validateProps().
                // scrtPropsForFeat = null;
                new JfrsZosWriter().recordFeatureUse(scrtPropsForFeat);
            }
        }
        // test for the URL designed to only record SCRT data
        if (request.getServletPath().equalsIgnoreCase(ONLY_RECORD_SCRT_URL)) {
            // Do not send this request on to a servlet component
            // Todo: Form a response and remove the print statement
            System.out.println("preHandle: This request is not sent to any REST service.");
            return false;
        }

        // let this request proceed to the appropriate servlet component
        // Todo: Remove the print statement
        System.out.println("preHandle: This request is being sent to the product REST service.");
        return HandlerInterceptor.super.preHandle(request, response, handler);
    }

    //------------------------------------------------------------------------
    /**
     * This utility parses and extracts name-value properties from the
     * Zowe-SCRT-client-feature header.
     *
     * The format of the header follows the specification of the
     * org.apache.hc.core5.http.message.BasicHeaderValueParser class.
     *
     * The subset of this formatting specification used for the
     * Zowe-SCRT-client-feature header is:
     *
     *      featName = "Your feature name", featDesc = "Your feature description",
     *      prodName = "Your product name", prodId = "Your product ID",
     *      version = "Your product version", release = "Your product release",
     *      modLevel = "Your product modeLevel"
     *
     * @param scrtHeaderText The text content of the header
     *
     * @returns An ScrtProps object when all required properties were
     *          supplied in the header. It returns null otherwise.
     */
	private static ScrtProps extractHeaderProps(String scrtHeaderText) {
        String featName = null;
        String featDesc = null;
        String prodName = null;
        String prodId = null;
        String version = null;
        String release = null;
        String modLevel = null;

        // ParserCursor requires a CharArrayBuffer
        CharArrayBuffer buffer = new CharArrayBuffer(scrtHeaderText.length());
        buffer.append(scrtHeaderText);
        ParserCursor cursor = new ParserCursor(0, buffer.length());

        // parse the properties winthin the header text
        BasicHeaderValueParser parser = BasicHeaderValueParser.INSTANCE;
        HeaderElement[] elements = parser.parseElements(buffer, cursor);

        // iterate through each property that we can find and record its value
        for (HeaderElement nextProp : elements) {
            String nextPropName = nextProp.getName();
            if (nextPropName.equalsIgnoreCase(ScrtProps.FEAT_NAME_KW)) {
                featName = nextProp.getValue();
            }
            if (nextPropName.equalsIgnoreCase(ScrtProps.FEAT_DESC_KW)) {
                featDesc = nextProp.getValue();
            }
            if (nextPropName.equalsIgnoreCase(ScrtProps.PROD_NAME_KW)) {
                prodName = nextProp.getValue();
            }
            if (nextPropName.equalsIgnoreCase(ScrtProps.PROD_ID_KW)) {
                prodId = nextProp.getValue();
            }
            if (nextPropName.equalsIgnoreCase(ScrtProps.PROD_VER_KW)) {
                version = nextProp.getValue();
            }
            if (nextPropName.equalsIgnoreCase(ScrtProps.PROD_REL_KW)) {
                release = nextProp.getValue();
            }
            if (nextPropName.equalsIgnoreCase(ScrtProps.PROD_MOD_LEV_KW)) {
                modLevel = nextProp.getValue();
            }
        }

        // the header must contain at least feature name and feature description
        String missingPropErrMsg = "";
        if (featName == null || featName.isEmpty()) {
            missingPropErrMsg += ScrtProps.FEAT_NAME_KW + " ";
        }
        if (featDesc == null || featDesc.isEmpty()) {
            missingPropErrMsg += ScrtProps.FEAT_DESC_KW + " ";
        }
        if (!missingPropErrMsg.isEmpty()) {
            // Todo: Replace print with REST API SDK logging method
            System.out.println(
                "\nextractHeaderProps: The following supplied header text:\n    " + scrtHeaderText +
                "\n    does not contain the following feature properties: " + missingPropErrMsg
            );
            return null;
        }

        // record which product properties have not been supplied in the header
        int prodPropCount = 0;
        missingPropErrMsg = "";
        if (prodName == null || prodName.isEmpty()) {
            missingPropErrMsg += ScrtProps.PROD_NAME_KW + " ";
        } else {
            prodPropCount++;
        }
        if (prodId == null || prodId.isEmpty()) {
            missingPropErrMsg += ScrtProps.PROD_ID_KW + " ";
        } else {
            prodPropCount++;
        }
        if (version == null || version.isEmpty()) {
            missingPropErrMsg += ScrtProps.PROD_VER_KW + " ";
        } else {
            prodPropCount++;
        }
        if (release == null || release.isEmpty()) {
            missingPropErrMsg += ScrtProps.PROD_REL_KW + " ";
        } else {
            prodPropCount++;
        }
        if (modLevel == null || modLevel.isEmpty()) {
            missingPropErrMsg += ScrtProps.PROD_MOD_LEV_KW + " ";
        } else {
            prodPropCount++;
        }

        // create the set of SCRT properties that we will use
        ScrtProps scrtPropsToUse = new ScrtProps(featName, featDesc);

        // Either all product properties must be supplied or none should be supplied.
        if (prodPropCount == 0) {
            return scrtPropsToUse;
        }

        final int maxProdPropCount = 5;
        if (prodPropCount == maxProdPropCount) {
            scrtPropsToUse.setProductInfo(prodName, prodId, version, release, modLevel);
            return scrtPropsToUse;
        }

        // Todo: Replace print with REST API SDK logging method
        System.out.println(
            "\nextractHeaderProps: The following supplied header text:\n    " + scrtHeaderText +
            "\n    does not contain the following product properties: " + missingPropErrMsg
        );
        return null;
    }
}

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
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.stream.Collectors;

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

    // Todo: Replace the following with -> import static com.broadcom.restapi.sdk.CommonMessages.*;
    private static final String BAD_REQUEST = "com.broadcom.common.rest.badRequest";

    // Todo: obtain objMapper in standard way when integrated into REST API SDK
    private final ObjectMapper objMapper = new ObjectMapper();

    // Todo: replace with the desired URL string
    public static final String ONLY_RECORD_SCRT_URL = "/apiv1/scrt";

    private static final String SCRT_HEADER = "Zowe-SCRT-client-feature";

    //------------------------------------------------------------------------
    /**
     * Interception point before the execution of a handler. Called after
     * HandlerMapping determined an appropriate handler object, but before
     * HandlerAdapter invokes the handler.
     *
     * This interceptor detects whether the request has a Zowe-SCRT-client-feature
     * header. If so, it parses the content of the header, validates that required
     * properties were contained in the header, and then calls the Jfrs function
     * to record the use of the client feature supplied in the header. The request
     * is then forwarded to its intended target component of the REST service.
     *
     * When the interceptor recognizes that the servlet path is the well-known
     * ONLY_RECORD_SCRT_URL path, we only record SCRT data, and prevent the
     * request from being further processed.
     *
     * @param request  current HTTP request
     * @param response current HTTP response
     * @param handler  chosen handler to execute, for type and/or instance evaluation
     *
     * @return {@code true} if the execution chain should proceed with the
     * next interceptor or the handler itself. Else, DispatcherServlet assumes
     * that this interceptor has already dealt with the response itself.
     */
    @Override
    public boolean preHandle(
        HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull Object handler
    ) {
        boolean weShouldRecordFeat = true;
        ScrtProps scrtPropsForFeat = null;
        String errResponseText = null;

        log.debug("preHandle:  ServletPath = " + request.getServletPath());
        boolean onlyRecordScrt = request.getServletPath().equalsIgnoreCase(ONLY_RECORD_SCRT_URL);

        String scrtHeaderText = request.getHeader(SCRT_HEADER);
        if (scrtHeaderText == null) {
            // no SCRT header was supplied. That is ok except for URL for only SCRT.
            if (onlyRecordScrt) {
                // form text for an HTTP response
                errResponseText = "The URL '" + ONLY_RECORD_SCRT_URL +
                    "' requires the '" + SCRT_HEADER + "' header.";
            }
        } else {
            // header text was supplied. extractHeaderProps will log its own errors.
            scrtPropsForFeat = extractHeaderProps(scrtHeaderText, onlyRecordScrt);
            if (scrtPropsForFeat == null) {
                // the header text was invalid
                if (onlyRecordScrt) {
                    // form text for an HTTP response
                    errResponseText = "The header '" + SCRT_HEADER +
                        "' had bad values for URL '" + ONLY_RECORD_SCRT_URL + "'";
                }
            } else {
                // We extracted valid values from the header. Record the use of the feature.
                new JfrsZosWriter().recordFeatureUse(scrtPropsForFeat);
            }
        }

        boolean sendRequestToApp = true;
        if (onlyRecordScrt) {
            // We return an HTTP response only for the URL that ONLY records SCRT data
            if (errResponseText == null) {
                // Send a successful response (200)
                // Even though we return no content, set the type in case the client tries to get the empty content.
                response.setStatus(HttpServletResponse.SC_OK);
                response.setContentType(MediaType.TEXT_PLAIN_VALUE);
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                ApiMessage apiMsg = CommonMessageService.getInstance().createApiMessage(BAD_REQUEST, errResponseText);
                log.error(apiMsg.getMessages().get(0).toReadableText());
                try {
                    this.objMapper.writeValue(response.getWriter(), apiMsg);
                } catch (Exception except) {
                    log.error("Failed to write HTTP response.\n    Reason = " + except.getMessage());
                }
            }
            // prevent the request from being processed further
            sendRequestToApp = false;
        } else {
            // For all other URLs, we let this request proceed to the appropriate servlet component
            try {
                sendRequestToApp = HandlerInterceptor.super.preHandle(request, response, handler);
            } catch (Exception except) {
                log.error("SpringFramework HandlerInterceptor.preHandle crashed.\n    Reason = " +
                    except.getMessage()
                );
                sendRequestToApp = true;
            }
        }

        return sendRequestToApp;
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
     * @param requireAllProps Indicates if all SCRT properties are required in the header
     *
     * @returns An ScrtProps object when the required properties are
     *          supplied in the header. It returns null otherwise.
     */
	private static ScrtProps extractHeaderProps(String scrtHeaderText, boolean requireAllProps) {
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

        // parse the properties within the header text
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
            log.error(
                "The following '" + SCRT_HEADER + "' header text is invalid:" +
                "\n    Header = " + scrtHeaderText +
                "\n    It does not contain these feature properties: " + missingPropErrMsg
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
        if (prodPropCount == 0 && !requireAllProps) {
            return scrtPropsToUse;
        }

        final int maxProdPropCount = 5;
        if (prodPropCount == maxProdPropCount) {
            // we have all required properties
            scrtPropsToUse.setProductInfo(prodName, prodId, version, release, modLevel);
            return scrtPropsToUse;
        }

        // we are missing required properties
        log.error(
            "The following '" + SCRT_HEADER + "' header text is invalid:" +
            "\n    Header = " + scrtHeaderText +
            "\n    It does not contain these product properties: " + missingPropErrMsg
        );
        return null;
    }
}


/*************************************************************************************************
 * Fake classes to enable this prototype to compile before integrating into the REST API SDK.
*************************************************************************************************/
// Todo: Remove the following fake classes and use the real classes when integrating into the REST SDK API
class ApiMessage {
    List<Msg> messages = new ArrayList<Msg>();

    class Msg {
        String message;

        public String getMessage() {
            return this.message;
        }

        public void setMessage(String msgVal) {
            this.message = msgVal;
        }

        public String toReadableText() {
            return this.message;
        }
    }

    public ApiMessage(String msgText) {
        Msg newMsg = new Msg();
        newMsg.setMessage(msgText);
        messages.add(newMsg);
    }

    public List<Msg> getMessages() {
        return messages;
    }

}

class MessageService {
    public ApiMessage createApiMessage(String key, Object... parameters) {
        String msgText;
        msgText = key + " -- ";
        for (Object parm : parameters) {
            msgText += parm + " ";
        }
        return new ApiMessage(msgText);
    }
}

class CommonMessageService {
    private static MessageService msgSvc = null;

    public static MessageService getInstance() {
        if (msgSvc == null) {
            msgSvc = new MessageService();
        }
        return msgSvc;
    }
}

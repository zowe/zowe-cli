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

import lombok.RequiredArgsConstructor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.core.Ordered;

/**
 * Configure an interceptor to gain control when a Zowe-SCRT-client-feature
 * header is attached to the request.
 */
@Configuration
// Todo: restore the @RequiredArgsConstructor annoatation when integrating into REST API SDK.
/* Cannot successfully resolve the lombok dependency for my local prototype gradle build.
@RequiredArgsConstructor
*/
@ConditionalOnProperty(prefix = "server.jfrs", name = "serviceName")
public class ScrtFeatHeaderConfig implements WebMvcConfigurer {

    // Todo: remove initialization after restoring the @RequiredArgsConstructor annoatation
    private final ScrtFeatHeaderInterceptor featHeaderInterceptor = new ScrtFeatHeaderInterceptor();

    /**
     * Register our interceptor routine to handle the custom header that supplies a client featue.
     *
     * @param registry The <code>InterceptorRegistry</code> object that contains
     *                 the list of registered interceptor methods.
     */
    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(featHeaderInterceptor)
            .addPathPatterns("/api/**")
            .order(Ordered.LOWEST_PRECEDENCE);
    }
}

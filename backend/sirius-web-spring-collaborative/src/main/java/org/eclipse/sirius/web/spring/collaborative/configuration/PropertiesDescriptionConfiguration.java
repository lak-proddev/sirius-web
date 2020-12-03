/*******************************************************************************
 * Copyright (c) 2019, 2020 Obeo.
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     Obeo - initial API and implementation
 *******************************************************************************/
package org.eclipse.sirius.web.spring.collaborative.configuration;

import java.util.List;

import org.eclipse.sirius.web.api.configuration.IPropertiesDescriptionRegistryConfigurer;
import org.eclipse.sirius.web.api.configuration.IRepresentationDescriptionRegistryConfigurer;
import org.eclipse.sirius.web.spring.collaborative.representations.PropertiesDescriptionRegistry;
import org.eclipse.sirius.web.spring.collaborative.representations.PropertiesDescriptionService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The configuration used to provide the services related to the properties descriptions.
 *
 * @author hmarchadour
 */
@Configuration
public class PropertiesDescriptionConfiguration {

    @Bean
    public PropertiesDescriptionService propertiesDescriptionService(List<IRepresentationDescriptionRegistryConfigurer> representationConfigurers,
            List<IPropertiesDescriptionRegistryConfigurer> propertiesConfigurers) {
        PropertiesDescriptionRegistry registry = new PropertiesDescriptionRegistry();
        propertiesConfigurers.forEach(configurer -> configurer.addPropertiesDescriptions(registry));
        return new PropertiesDescriptionService(registry);
    }
}

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
package org.eclipse.sirius.web.collaborative.forms.api;

import java.util.Objects;
import java.util.UUID;

import org.eclipse.sirius.web.collaborative.api.services.IRepresentationConfiguration;

/**
 * The configuration used to create a form event processor.
 *
 * @author sbegaudeau
 * @author hmarchadour
 */
public class FormConfiguration implements IRepresentationConfiguration {

    private final UUID formId;

    public FormConfiguration(UUID formId) {
        this.formId = Objects.requireNonNull(formId);
    }

    @Override
    public UUID getId() {
        return this.formId;
    }

}

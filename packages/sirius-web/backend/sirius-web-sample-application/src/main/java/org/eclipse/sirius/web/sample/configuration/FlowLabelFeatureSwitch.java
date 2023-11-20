/*******************************************************************************
 * Copyright (c) 2019, 2023 Obeo.
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
package org.eclipse.sirius.web.sample.configuration;

import com.nividous.studio.sirius.model.basicprocess.BasicprocessPackage;
import com.nividous.studio.sirius.model.basicprocess.Diagram;
import com.nividous.studio.sirius.model.basicprocess.util.BasicprocessSwitch;

import org.eclipse.emf.ecore.EAttribute;
import org.eclipse.emf.ecore.EObject;

/**
 * Specific {@link FlowSwitch} returning the {@link EAttribute} to use as label for an {@link EObject}.
 *
 * @author arichard
 */
public class FlowLabelFeatureSwitch extends BasicprocessSwitch<EAttribute> {

    @Override
    public EAttribute caseDiagram(Diagram object) {
        return BasicprocessPackage.eINSTANCE.getDiagram_ProcessFile();
    }
}

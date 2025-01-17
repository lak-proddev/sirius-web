/*******************************************************************************
 * Copyright (c) 2023 Obeo.
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

import { Edge, Node, XYPosition } from 'reactflow';
import { Diagram, NodeData } from '../DiagramRenderer.types';

export interface UseLayoutValue {
  layout: (
    previousLaidoutDiagram: Diagram | null,
    diagramToLayout: Diagram,
    callback: (laidoutDiagram: Diagram) => void
  ) => void;
  autoLayout: (nodes: Node<NodeData>[], edges: Edge[], zoomLevel: number) => Promise<{ nodes: Node<NodeData>[] }>;

  /**
   * Store the reference position in the layout context for a later use, like in the next refresh to position new created node at the reference position stored in the context.
   *
   * The reference position will be reset using resetReferencePosition once it has been used.
   * In other world, the setReferencePosition caller is responsible to also call the resetReferencePosition
   *
   * @param referencePosition The reference position meant to be use in a later use.
   * @param parentId The element id directly under the reference position, null or undefined if it is the diagram.
   */
  setReferencePosition: (referencePosition: XYPosition, parentId: string | null | undefined) => void;

  /**
   * Reset the reference position stored in the layout context.
   *
   * This meant to be used by the caller of setReferencePosition once the reference position has been used.
   */
  resetReferencePosition: () => void;
}

export type Step = 'INITIAL_STEP' | 'BEFORE_LAYOUT' | 'LAYOUT' | 'AFTER_LAYOUT';

export interface UseLayoutState {
  hiddenContainer: HTMLDivElement | null;
  currentStep: Step;
  previousDiagram: Diagram | null;
  diagramToLayout: Diagram | null;
  laidoutDiagram: Diagram | null;
  onLaidoutDiagram: (laidoutDiagram: Diagram) => void;
}

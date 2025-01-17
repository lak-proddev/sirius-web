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

import { Node } from 'reactflow';
import { Diagram, NodeData } from '../DiagramRenderer.types';
import { ListNodeData } from '../node/ListNode.types';
import { DiagramNodeType } from '../node/NodeTypes.types';
import { ILayoutEngine, INodeLayoutHandler } from './LayoutEngine.types';
import { getBorderNodeExtent } from './layoutBorderNodes';
import {
  computeNodesBox,
  findNodeIndex,
  getEastBorderNodeFootprintHeight,
  getNodeOrMinHeight,
  getNodeOrMinWidth,
  getNorthBorderNodeFootprintWidth,
  getSouthBorderNodeFootprintWidth,
  getWestBorderNodeFootprintHeight,
  setBorderNodesPosition,
} from './layoutNode';

export class ListNodeLayoutHandler implements INodeLayoutHandler<ListNodeData> {
  public canHandle(node: Node<NodeData, DiagramNodeType>) {
    return node.type === 'listNode';
  }

  public handle(
    layoutEngine: ILayoutEngine,
    previousDiagram: Diagram | null,
    node: Node<ListNodeData, 'listNode'>,
    visibleNodes: Node<NodeData, DiagramNodeType>[],
    directChildren: Node<NodeData, DiagramNodeType>[],
    newlyAddedNode: Node<NodeData, DiagramNodeType> | undefined,
    forceWidth?: number
  ) {
    const nodeIndex = findNodeIndex(visibleNodes, node.id);
    const nodeElement = document.getElementById(`${node.id}-listNode-${nodeIndex}`)?.children[0];
    const borderWidth = nodeElement ? parseFloat(window.getComputedStyle(nodeElement).borderWidth) : 0;

    if (directChildren.length > 0) {
      this.handleParentNode(
        layoutEngine,
        previousDiagram,
        node,
        visibleNodes,
        directChildren,
        newlyAddedNode,
        borderWidth,
        forceWidth
      );
    } else {
      this.handleLeafNode(previousDiagram, node, visibleNodes, borderWidth, forceWidth);
    }
  }

  handleLeafNode(
    _previousDiagram: Diagram | null,
    node: Node<ListNodeData, 'listNode'>,
    visibleNodes: Node<NodeData, DiagramNodeType>[],
    borderWidth: number,
    forceWidth?: number
  ) {
    const labelElement = document.getElementById(`${node.id}-label-${findNodeIndex(visibleNodes, node.id)}`);

    const nodeWidth = (labelElement?.getBoundingClientRect().width ?? 0) + borderWidth * 2;
    const nodeHeight = (labelElement?.getBoundingClientRect().height ?? 0) + borderWidth * 2;
    node.width = forceWidth ?? getNodeOrMinWidth(nodeWidth);
    node.height = getNodeOrMinHeight(nodeHeight);
  }

  private handleParentNode(
    layoutEngine: ILayoutEngine,
    previousDiagram: Diagram | null,
    node: Node<ListNodeData, 'listNode'>,
    visibleNodes: Node<NodeData, DiagramNodeType>[],
    directChildren: Node<NodeData, DiagramNodeType>[],
    newlyAddedNode: Node<NodeData, DiagramNodeType> | undefined,
    borderWidth: number,
    forceWidth?: number
  ) {
    layoutEngine.layoutNodes(previousDiagram, visibleNodes, directChildren, newlyAddedNode, forceWidth);

    const nodeIndex = findNodeIndex(visibleNodes, node.id);
    const labelElement = document.getElementById(`${node.id}-label-${nodeIndex}`);
    const withHeader: boolean = node.data.label?.isHeader ?? false;

    const borderNodes = directChildren.filter((node) => node.data.isBorderNode);
    const directNodesChildren = directChildren.filter((child) => !child.data.isBorderNode);
    const northBorderNodeFootprintWidth = getNorthBorderNodeFootprintWidth(visibleNodes, borderNodes, previousDiagram);
    const southBorderNodeFootprintWidth = getSouthBorderNodeFootprintWidth(visibleNodes, borderNodes, previousDiagram);

    if (!forceWidth) {
      const widerWidth = Math.max(
        directNodesChildren.reduce<number>(
          (widerWidth, child) => Math.max(child.width ?? 0, widerWidth),
          labelElement?.getBoundingClientRect().width ?? 0
        ),
        northBorderNodeFootprintWidth,
        southBorderNodeFootprintWidth
      );

      layoutEngine.layoutNodes(previousDiagram, visibleNodes, directNodesChildren, newlyAddedNode, widerWidth);
    }

    directNodesChildren.forEach((child, index) => {
      // Hide children node borders to prevent a 'bold' aspect.
      child.data.style = {
        ...child.data.style,
        borderTop: 'transparent',
        borderLeft: 'transparent',
        borderRight: 'transparent',
      };

      if (index === directNodesChildren.length - 1) {
        child.data.style = {
          ...child.data.style,
          borderBottom: 'transparent',
        };
      }

      child.position = {
        x: borderWidth,
        y: borderWidth + (withHeader ? labelElement?.getBoundingClientRect().height ?? 0 : 0),
      };
      const previousSibling = directNodesChildren[index - 1];
      if (previousSibling) {
        child.position = { ...child.position, y: previousSibling.position.y + (previousSibling.height ?? 0) };
      }
    });

    const childrenContentBox = computeNodesBox(visibleNodes, directNodesChildren);

    const labelOnlyWidth = labelElement?.getBoundingClientRect().width ?? 0;
    const nodeWidth = Math.max(childrenContentBox.width, labelOnlyWidth) + borderWidth * 2;

    const directChildrenAwareNodeHeight = childrenContentBox.y + childrenContentBox.height + borderWidth;

    const eastBorderNodeFootprintHeight = getEastBorderNodeFootprintHeight(visibleNodes, borderNodes, previousDiagram);
    const westBorderNodeFootprintHeight = getWestBorderNodeFootprintHeight(visibleNodes, borderNodes, previousDiagram);

    const nodeHeight = Math.max(
      directChildrenAwareNodeHeight,
      eastBorderNodeFootprintHeight,
      westBorderNodeFootprintHeight
    );

    node.width = forceWidth ?? getNodeOrMinWidth(nodeWidth);
    node.height = getNodeOrMinHeight(nodeHeight);

    // Update border nodes positions
    borderNodes.forEach((borderNode) => {
      borderNode.extent = getBorderNodeExtent(node, borderNode);
    });
    setBorderNodesPosition(borderNodes, node, previousDiagram);
  }
}

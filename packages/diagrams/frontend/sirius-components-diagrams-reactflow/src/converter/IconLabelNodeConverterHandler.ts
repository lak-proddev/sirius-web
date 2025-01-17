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
import { Node, XYPosition } from 'reactflow';
import {
  GQLIconLabelNodeStyle,
  GQLNode,
  GQLNodeStyle,
  GQLViewModifier,
} from '../graphql/subscription/nodeFragment.types';
import { BorderNodePositon } from '../renderer/DiagramRenderer.types';
import { IconLabelNodeData } from '../renderer/node/IconsLabelNode.types';
import { convertLabelStyle } from './convertDiagram';
import { IConvertEngine, INodeConverterHandler } from './ConvertEngine.types';

const defaultPosition: XYPosition = { x: 0, y: 0 };

const toIconLabelNode = (
  gqlNode: GQLNode<GQLIconLabelNodeStyle>,
  gqlParentNode: GQLNode<GQLNodeStyle> | null,
  isBorderNode: boolean
): Node<IconLabelNodeData> => {
  const {
    targetObjectId,
    targetObjectLabel,
    targetObjectKind,
    descriptionId,
    id,
    insideLabel,
    state,
    style,
    labelEditable,
  } = gqlNode;

  const data: IconLabelNodeData = {
    targetObjectId,
    targetObjectLabel,
    targetObjectKind,
    descriptionId,
    style: {
      textAlign: 'left',
      backgroundColor: style.backgroundColor,
    },
    label: undefined,
    isBorderNode: isBorderNode,
    borderNodePosition: isBorderNode ? BorderNodePositon.WEST : null,
    faded: state === GQLViewModifier.Faded,
    labelEditable: labelEditable,
  };

  if (insideLabel) {
    const labelStyle = insideLabel.style;

    data.label = {
      id: insideLabel.id,
      text: insideLabel.text,
      style: {
        ...convertLabelStyle(labelStyle),
      },
      iconURL: labelStyle.iconURL,
    };
  }

  const node: Node<IconLabelNodeData> = {
    id,
    type: 'iconLabelNode',
    data,
    position: defaultPosition,
    hidden: state === GQLViewModifier.Hidden,
  };

  if (gqlParentNode) {
    node.parentNode = gqlParentNode.id;
  }

  return node;
};

export class IconLabelNodeConverterHandler implements INodeConverterHandler {
  canHandle(gqlNode: GQLNode<GQLNodeStyle>) {
    return gqlNode.style.__typename === 'IconLabelNodeStyle';
  }

  handle(
    _convertEngine: IConvertEngine,
    gqlNode: GQLNode<GQLIconLabelNodeStyle>,
    parentNode: GQLNode<GQLNodeStyle> | null,
    isBorderNode: boolean,
    nodes: Node[]
  ) {
    nodes.push(toIconLabelNode(gqlNode, parentNode, isBorderNode));
  }
}

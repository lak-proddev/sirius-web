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
  GQLNode,
  GQLNodeStyle,
  GQLRectangularNodeStyle,
  GQLViewModifier,
} from '../graphql/subscription/nodeFragment.types';
import { BorderNodePositon } from '../renderer/DiagramRenderer.types';
import { RectangularNodeData } from '../renderer/node/RectangularNode.types';
import { IConvertEngine, INodeConverterHandler } from './ConvertEngine.types';
import { convertLabelStyle } from './convertDiagram';
import { AlignmentMap } from './convertDiagram.types';

const defaultPosition: XYPosition = { x: 0, y: 0 };

const toRectangularNode = (
  gqlNode: GQLNode<GQLRectangularNodeStyle>,
  gqlParentNode: GQLNode<GQLNodeStyle> | null,
  isBorderNode: boolean
): Node<RectangularNodeData> => {
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

  const data: RectangularNodeData = {
    targetObjectId,
    targetObjectLabel,
    targetObjectKind,
    descriptionId,
    style: {
      display: 'flex',
      backgroundColor: style.color,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      borderWidth: style.borderSize,
      borderStyle: style.borderStyle,
    },
    label: undefined,
    faded: state === GQLViewModifier.Faded,
    isBorderNode: isBorderNode,
    borderNodePosition: isBorderNode ? BorderNodePositon.EAST : null,
    labelEditable,
  };

  if (insideLabel) {
    const labelStyle = insideLabel.style;
    data.label = {
      id: insideLabel.id,
      text: insideLabel.text,
      isHeader: insideLabel.isHeader,
      displayHeaderSeparator: insideLabel.displayHeaderSeparator,
      style: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        textAlign: 'center',
        ...convertLabelStyle(labelStyle),
      },
      iconURL: labelStyle.iconURL,
    };

    const alignement = AlignmentMap[insideLabel.insideLabelLocation];
    if (alignement.isPrimaryVerticalAlignment) {
      if (alignement.primaryAlignment === 'TOP') {
        if (data.label.displayHeaderSeparator) {
          data.label.style.borderBottom = `${style.borderSize}px ${style.borderStyle} ${style.borderColor}`;
        }
        data.style = { ...data.style, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' };
      }
      if (alignement.secondaryAlignment === 'CENTER') {
        data.style = { ...data.style, alignItems: 'stretch' };
        data.label.style = { ...data.label.style, justifyContent: 'center' };
      }
    }
  }

  const node: Node<RectangularNodeData> = {
    id,
    type: 'rectangularNode',
    data,
    position: defaultPosition,
    hidden: state === GQLViewModifier.Hidden,
  };

  if (gqlParentNode) {
    node.parentNode = gqlParentNode.id;
  }

  return node;
};

export class RectangleNodeConverterHandler implements INodeConverterHandler {
  canHandle(gqlNode: GQLNode<GQLNodeStyle>) {
    return gqlNode.style.__typename === 'RectangularNodeStyle' && gqlNode.childrenLayoutStrategy?.kind !== 'List';
  }

  handle(
    convertEngine: IConvertEngine,
    gqlNode: GQLNode<GQLRectangularNodeStyle>,
    parentNode: GQLNode<GQLNodeStyle> | null,
    isBorderNode: boolean,
    nodes: Node[]
  ) {
    nodes.push(toRectangularNode(gqlNode, parentNode, isBorderNode));
    convertEngine.convertNodes(gqlNode.borderNodes ?? [], gqlNode, nodes);
    convertEngine.convertNodes(gqlNode.childNodes ?? [], gqlNode, nodes);
  }
}

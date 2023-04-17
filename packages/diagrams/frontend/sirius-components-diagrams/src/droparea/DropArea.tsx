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
import { gql, useMutation } from '@apollo/client';
import { DRAG_SOURCES_TYPE } from '@eclipse-sirius/sirius-components-core';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import { DropAreaProps } from './DropArea.types';
import {
  DropAreaContext,
  dropAreaMachine,
  DropEvent,
  HandleDropEvent,
  HandleResponseEvent,
  HideToastEvent,
  SchemaValue,
  ShowToastEvent,
} from './DropAreaMachine';

const DATA_DIAGRAM_ID = 'data-diagramid';
const DATA_NODE_ID = 'data-nodeid';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const dropOnDiagramMutation = gql`
  mutation dropOnDiagram($input: DropOnDiagramInput!) {
    dropOnDiagram(input: $input) {
      __typename
      ... on DropOnDiagramSuccessPayload {
        diagram {
          id
        }
      }
      ... on ErrorPayload {
        message
      }
    }
  }
`;

const useDropAreaStyles = makeStyles(() => ({
  dropArea: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr',
  },
}));

export const DropArea = ({
  editingContextId,
  representationId,
  invokeHover,
  convertInSprottyCoordinate,
  children,
  readOnly,
}: DropAreaProps) => {
  const [{ value, context }, dispatch] = useMachine<DropAreaContext, DropEvent>(dropAreaMachine);
  const { toast } = value as SchemaValue;
  const { message } = context;
  const [dropMutation, { loading, data, error }] = useMutation(dropOnDiagramMutation);

  const classes = useDropAreaStyles();

  useEffect(() => {
    if (!loading) {
      if (error) {
        const showToastEvent: ShowToastEvent = {
          type: 'SHOW_TOAST',
          message: 'An unexpected error has occurred, please refresh the page',
        };
        dispatch(showToastEvent);
      }
      if (data) {
        const handleResponseEvent: HandleResponseEvent = { type: 'HANDLE_RESPONSE', data };
        dispatch(handleResponseEvent);

        const typename = data.dropOnDiagram.__typename;
        if (typename === 'ErrorPayload') {
          const { message } = data.dropOnDiagram;
          const showToastEvent: ShowToastEvent = { type: 'SHOW_TOAST', message };
          dispatch(showToastEvent);
        }
      }
    }
  }, [loading, error, data, dispatch]);

  const dropElement = async (objectIds: string[], clientX: number, clientY: number, diagramElementId?: string) => {
    const { x: startingPositionX, y: startingPositionY } = await convertInSprottyCoordinate(clientX, clientY);
    const input = {
      id: crypto.randomUUID(),
      editingContextId,
      representationId,
      objectIds,
      startingPositionX,
      startingPositionY,
    };
    if (diagramElementId) {
      input['diagramTargetElementId'] = diagramElementId;
    }

    const handleDropEvent: HandleDropEvent = { type: 'HANDLE_DROP' };
    dispatch(handleDropEvent);
    dropMutation({ variables: { input } });
  };

  const searchId = (dom) => {
    if (dom.hasAttribute(DATA_DIAGRAM_ID)) {
      return dom.getAttribute(DATA_DIAGRAM_ID);
    } else if (dom.hasAttribute(DATA_NODE_ID)) {
      return dom.getAttribute(DATA_NODE_ID);
    } else if (dom.parentElement) {
      const parentDom = dom.parentElement;
      if (parentDom.namespaceURI === SVG_NAMESPACE) {
        return searchId(parentDom);
      }
    }
    return null;
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    const targetId = searchId(event.target);
    // use a standard array instead of a DataTransferItemList
    const dataTransferItems = [...event.dataTransfer.items];
    const sourcesItem = dataTransferItems.find((item) => item.type !== DRAG_SOURCES_TYPE);
    if (sourcesItem) {
      // Update the cursor thanks to dropEffect (a drag'n'drop cursor does not use CSS rules)
      event.dataTransfer.dropEffect = 'link';
    }
    invokeHover(targetId, true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    const id = searchId(event.target);
    invokeHover(id, false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (readOnly) {
      const showToastEvent: ShowToastEvent = {
        type: 'SHOW_TOAST',
        message: 'This representation is currently read-only',
      };
      dispatch(showToastEvent);
    } else {
      const dragSourcesStringified = event.dataTransfer.getData(DRAG_SOURCES_TYPE);
      if (dragSourcesStringified) {
        const sources = JSON.parse(dragSourcesStringified);
        if (Array.isArray(sources)) {
          const sourceIds = sources.filter((source) => source?.id).map((source) => source.id);
          if (sourceIds.length > 0) {
            const diagramElementId = searchId(event.target);
            if (diagramElementId) {
              dropElement(sourceIds, event.clientX, event.clientY, diagramElementId);
            } else {
              dropElement(sourceIds, event.clientX, event.clientY);
            }
          }
        }
      }
    }
  };

  return (
    <div
      className={classes.dropArea}
      onDrop={(event) => handleDrop(event)}
      onDragOver={(event) => handleDragOver(event)}
      onDragLeave={(event) => handleDragLeave(event)}>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={toast === 'visible'}
        autoHideDuration={3000}
        onClose={() => dispatch({ type: 'HIDE_TOAST' } as HideToastEvent)}
        message={message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => dispatch({ type: 'HIDE_TOAST' } as HideToastEvent)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        data-testid="error"
      />
      {children}
    </div>
  );
};

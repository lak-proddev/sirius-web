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
import { gql, useLazyQuery, useMutation } from '@apollo/client';
import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import Snackbar from '@material-ui/core/Snackbar';
import { makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import { useMachine } from '@xstate/react';
import React, { FocusEvent, useEffect, useRef, useState } from 'react';
import { GQLTextarea, GQLWidget } from '../form/FormEventFragments.types';
import { getTextDecorationLineValue } from './getTextDecorationLineValue';
import { PropertySectionLabel } from './PropertySectionLabel';
import {
  GQLCompletionProposal,
  GQLCompletionProposalsQueryData,
  GQLCompletionProposalsQueryVariables,
  GQLEditTextfieldInput,
  GQLEditTextfieldMutationData,
  GQLEditTextfieldMutationVariables,
  GQLEditTextfieldPayload,
  GQLErrorPayload,
  GQLUpdateWidgetFocusInput,
  GQLUpdateWidgetFocusMutationData,
  GQLUpdateWidgetFocusMutationVariables,
  GQLUpdateWidgetFocusPayload,
  TextfieldPropertySectionProps,
  TextfieldStyleProps,
} from './TextfieldPropertySection.types';
import {
  ChangeValueEvent,
  CompletionDismissedEvent,
  CompletionReceivedEvent,
  InitializeEvent,
  RequestCompletionEvent,
  SchemaValue,
  ShowToastEvent,
  TextfieldPropertySectionContext,
  TextfieldPropertySectionEvent,
  textfieldPropertySectionMachine,
} from './TextfieldPropertySectionMachine';

const useStyle = makeStyles<Theme, TextfieldStyleProps>(() => ({
  style: {
    backgroundColor: ({ backgroundColor }) => (backgroundColor ? backgroundColor : 'inherit'),
    color: ({ foregroundColor }) => (foregroundColor ? foregroundColor : 'inherit'),
    fontSize: ({ fontSize }) => (fontSize ? fontSize : 'inherit'),
    fontStyle: ({ italic }) => (italic ? 'italic' : 'inherit'),
    fontWeight: ({ bold }) => (bold ? 'bold' : 'inherit'),
    textDecorationLine: ({ underline, strikeThrough }) => getTextDecorationLineValue(underline, strikeThrough),
  },
}));

export const getCompletionProposalsQuery = gql`
  query completionProposals(
    $editingContextId: ID!
    $formId: ID!
    $widgetId: ID!
    $currentText: String!
    $cursorPosition: Int!
  ) {
    viewer {
      editingContext(editingContextId: $editingContextId) {
        representation(representationId: $formId) {
          description {
            ... on FormDescription {
              completionProposals(widgetId: $widgetId, currentText: $currentText, cursorPosition: $cursorPosition) {
                description
                textToInsert
                charsToReplace
              }
            }
          }
        }
      }
    }
  }
`;

export const editTextfieldMutation = gql`
  mutation editTextfield($input: EditTextfieldInput!) {
    editTextfield(input: $input) {
      __typename
      ... on ErrorPayload {
        message
      }
    }
  }
`;

export const updateWidgetFocusMutation = gql`
  mutation updateWidgetFocus($input: UpdateWidgetFocusInput!) {
    updateWidgetFocus(input: $input) {
      __typename
      ... on ErrorPayload {
        message
      }
    }
  }
`;

const isTextarea = (widget: GQLWidget): widget is GQLTextarea => widget.__typename === 'Textarea';
const isErrorPayload = (payload: GQLEditTextfieldPayload | GQLUpdateWidgetFocusPayload): payload is GQLErrorPayload =>
  payload.__typename === 'ErrorPayload';

/**
 * Defines the content of a Textfield property section.
 * The content is submitted when the focus is lost and when pressing the "Enter" key.
 */
export const TextfieldPropertySection = ({
  editingContextId,
  formId,
  widget,
  subscribers,
  readOnly,
}: TextfieldPropertySectionProps) => {
  const inputElt = useRef<HTMLInputElement>();

  const props: TextfieldStyleProps = {
    backgroundColor: widget.style?.backgroundColor ?? null,
    foregroundColor: widget.style?.foregroundColor ?? null,
    fontSize: widget.style?.fontSize ?? null,
    italic: widget.style?.italic ?? null,
    bold: widget.style?.bold ?? null,
    underline: widget.style?.underline ?? null,
    strikeThrough: widget.style?.strikeThrough ?? null,
  };
  const classes = useStyle(props);

  const [{ value: schemaValue, context }, dispatch] = useMachine<
    TextfieldPropertySectionContext,
    TextfieldPropertySectionEvent
  >(textfieldPropertySectionMachine);
  const { textfieldPropertySection, toast } = schemaValue as SchemaValue;
  const { value, completionRequest, proposals, message } = context;

  useEffect(() => {
    const initializeEvent: InitializeEvent = { type: 'INITIALIZE', value: widget.stringValue };
    dispatch(initializeEvent);
  }, [dispatch, widget.stringValue]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const changeValueEvent: ChangeValueEvent = { type: 'CHANGE_VALUE', value };
    dispatch(changeValueEvent);
  };

  const [editTextfield, { loading: updateTextfieldLoading, data: updateTextfieldData, error: updateTextfieldError }] =
    useMutation<GQLEditTextfieldMutationData, GQLEditTextfieldMutationVariables>(editTextfieldMutation);
  const sendEditedValue = () => {
    if (textfieldPropertySection === 'edited') {
      const input: GQLEditTextfieldInput = {
        id: crypto.randomUUID(),
        editingContextId,
        representationId: formId,
        textfieldId: widget.id,
        newValue: value,
      };
      const variables: GQLEditTextfieldMutationVariables = { input };
      editTextfield({ variables });
    }
  };

  useEffect(() => {
    if (!updateTextfieldLoading) {
      let hasError = false;
      if (updateTextfieldError) {
        const showToastEvent: ShowToastEvent = {
          type: 'SHOW_TOAST',
          message: 'An unexpected error has occurred, please refresh the page',
        };
        dispatch(showToastEvent);

        hasError = true;
      }
      if (updateTextfieldData) {
        const { editTextfield } = updateTextfieldData;
        if (isErrorPayload(editTextfield)) {
          const { message } = editTextfield;
          const showToastEvent: ShowToastEvent = { type: 'SHOW_TOAST', message };
          dispatch(showToastEvent);

          hasError = true;
        }
      }

      if (hasError) {
        const initializeEvent: InitializeEvent = { type: 'INITIALIZE', value: widget.stringValue };
        dispatch(initializeEvent);
      }
    }
  }, [updateTextfieldLoading, updateTextfieldData, updateTextfieldError, widget, dispatch]);

  const [
    updateWidgetFocus,
    { loading: updateWidgetFocusLoading, data: updateWidgetFocusData, error: updateWidgetFocusError },
  ] = useMutation<GQLUpdateWidgetFocusMutationData, GQLUpdateWidgetFocusMutationVariables>(updateWidgetFocusMutation);
  const sendUpdateWidgetFocus = (selected: boolean) => {
    const input: GQLUpdateWidgetFocusInput = {
      id: crypto.randomUUID(),
      editingContextId,
      representationId: formId,
      widgetId: widget.id,
      selected,
    };
    const variables: GQLUpdateWidgetFocusMutationVariables = {
      input,
    };
    updateWidgetFocus({ variables });
  };

  useEffect(() => {
    if (!updateWidgetFocusLoading) {
      if (updateWidgetFocusError) {
        const showToastEvent: ShowToastEvent = {
          type: 'SHOW_TOAST',
          message: 'An unexpected error has occurred, please refresh the page',
        };
        dispatch(showToastEvent);
      }
      if (updateWidgetFocusData) {
        const { updateWidgetFocus } = updateWidgetFocusData;
        if (isErrorPayload(updateWidgetFocus)) {
          const { message } = updateWidgetFocus;
          const showToastEvent: ShowToastEvent = { type: 'SHOW_TOAST', message };
          dispatch(showToastEvent);
        }
      }
    }
  }, [updateWidgetFocusLoading, updateWidgetFocusData, updateWidgetFocusError, dispatch]);

  const onFocus = () => sendUpdateWidgetFocus(true);
  const onBlur = () => {
    sendUpdateWidgetFocus(false);
    sendEditedValue();
  };

  const [getCompletionProposals, { loading: proposalsLoading, data: proposalsData, error: proposalsError }] =
    useLazyQuery<GQLCompletionProposalsQueryData, GQLCompletionProposalsQueryVariables>(getCompletionProposalsQuery);
  useEffect(() => {
    if (!proposalsLoading) {
      if (proposalsError) {
        const message = proposalsError.message;
        const showToastEvent: ShowToastEvent = { type: 'SHOW_TOAST', message };
        dispatch(showToastEvent);
      }
      if (proposalsData) {
        const proposalsReceivedEvent: CompletionReceivedEvent = {
          type: 'COMPLETION_RECEIVED',
          proposals: proposalsData.viewer.editingContext.representation.description.completionProposals,
        };
        dispatch(proposalsReceivedEvent);
      }
    }
  }, [proposalsLoading, proposalsData, proposalsError, dispatch]);

  const onKeyPress: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if ('Enter' === event.key && !event.shiftKey) {
      event.preventDefault();
      sendEditedValue();
    }
    const dismissCompletionEvent: CompletionDismissedEvent = { type: 'COMPLETION_DISMISSED' };
    dispatch(dismissCompletionEvent);
  };

  // Reacting to Ctrl-Space to trigger completion can not be done with onKeyPress.
  // We need a stateful combination of onKeyDown/onKeyUp for that.
  const [controlDown, setControlDown] = useState<boolean>(false);

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const proposalsMenu = document.getElementById('completion-proposals');
      if (proposalsMenu && proposalsMenu.firstChild) {
        (proposalsMenu.firstChild as HTMLElement).focus();
      }
    } else if ('Control' === event.key) {
      setControlDown(true);
    } else if ('Escape' === event.key) {
      const dismissCompletionEvent: CompletionDismissedEvent = { type: 'COMPLETION_DISMISSED' };
      dispatch(dismissCompletionEvent);
    }
    if (widget.supportsCompletion && controlDown && event.key === ' ') {
      const cursorPosition = (event.target as HTMLInputElement).selectionStart;
      const variables: GQLCompletionProposalsQueryVariables = {
        editingContextId,
        formId,
        widgetId: widget.id,
        currentText: value,
        cursorPosition,
      };
      getCompletionProposals({ variables });
      const requestCompletionEvent: RequestCompletionEvent = {
        type: 'COMPLETION_REQUESTED',
        currentText: value,
        cursorPosition,
      };
      dispatch(requestCompletionEvent);
    }
  };
  const onKeyUp: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if ('Control' === event.key) {
      setControlDown(false);
    }
  };

  const [caretPos, setCaretPos] = useState<number | null>(null);
  useEffect(() => {
    if (caretPos && inputElt.current) {
      inputElt.current.setSelectionRange(caretPos, caretPos);
      inputElt.current.focus();
      setCaretPos(null);
    }
  }, [caretPos, inputElt.current]);

  let proposalsList = null;
  if (proposals) {
    const dismissProposals = () => {
      const dismissCompletionEvent: CompletionDismissedEvent = { type: 'COMPLETION_DISMISSED' };
      dispatch(dismissCompletionEvent);
    };
    const applyProposal = (proposal: GQLCompletionProposal) => {
      const result = applyCompletionProposal(
        { textValue: value, cursorPosition: completionRequest.cursorPosition },
        proposal
      );
      const changeValueEvent: ChangeValueEvent = { type: 'CHANGE_VALUE', value: result.textValue };
      dispatch(changeValueEvent);
      setCaretPos(result.cursorPosition);
      dismissProposals();
    };
    proposalsList = (
      <ProposalsList
        anchor={inputElt}
        proposals={proposals}
        onProposalSelected={applyProposal}
        onClose={dismissProposals}
      />
    );
  }

  return (
    <div
      onBlur={(event: FocusEvent<HTMLDivElement, Element>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onBlur();
        }
      }}>
      <PropertySectionLabel label={widget.label} subscribers={subscribers} />
      <TextField
        name={widget.label}
        placeholder={widget.label}
        value={value}
        spellCheck={false}
        margin="dense"
        multiline={isTextarea(widget)}
        maxRows={isTextarea(widget) ? 4 : 1}
        fullWidth
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onChange={onChange}
        onFocus={onFocus}
        onKeyPress={onKeyPress}
        data-testid={widget.label}
        disabled={readOnly}
        error={widget.diagnostics.length > 0}
        helperText={widget.diagnostics[0]?.message}
        inputRef={inputElt}
        InputProps={
          widget.style
            ? {
                className: classes.style,
              }
            : {}
        }
      />
      {proposalsList}
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        open={toast === 'visible'}
        autoHideDuration={3000}
        onClose={() => dispatch({ type: 'HIDE_TOAST' })}
        message={message}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={() => dispatch({ type: 'HIDE_TOAST' })}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        data-testid="error"
      />
    </div>
  );
};

// Proposals UI

export interface ProposalsListProps {
  anchor: React.MutableRefObject<HTMLElement>;
  proposals: GQLCompletionProposal[];
  onProposalSelected: (proposal: GQLCompletionProposal) => void;
  onClose: () => void;
}

const ProposalsList = ({ anchor, proposals, onProposalSelected, onClose }: ProposalsListProps) => {
  return (
    <Popover
      open={true}
      onClose={onClose}
      anchorEl={anchor.current}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}>
      <MenuList id="completion-proposals" data-testid="completion-proposals">
        {proposals.map((proposal, index) => (
          <Tooltip
            data-testid={`proposal-${proposal.textToInsert}-${proposal.charsToReplace}`}
            key={index}
            title={proposal.description}
            placement="right">
            <MenuItem button onClick={() => onProposalSelected(proposal)}>
              <ListItemText primary={proposal.textToInsert} />
            </MenuItem>
          </Tooltip>
        ))}
      </MenuList>
    </Popover>
  );
};

// Proposal handling (exported for testing)

export interface TextFieldState {
  textValue: string;
  cursorPosition: number;
}

export const applyCompletionProposal = (
  initialState: TextFieldState,
  proposal: GQLCompletionProposal
): TextFieldState => {
  const prefix = initialState.textValue.substring(0, initialState.cursorPosition);
  const inserted = proposal.textToInsert.substring(proposal.charsToReplace);
  const suffix = initialState.textValue.substring(initialState.cursorPosition);
  const newValue = prefix + inserted + suffix;
  return { textValue: newValue, cursorPosition: (prefix + inserted).length };
};

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

import { makeStyles } from '@material-ui/core/styles';
import { useCallback } from 'react';
import { useViewport } from 'reactflow';
import { useDiagramDirectEdit } from '../direct-edit/useDiagramDirectEdit';
import { useLayout } from '../layout/useLayout';
import { DiagramElementPaletteProps } from './DiagramElementPalette.types';
import { DiagramElementPalettePortal } from './DiagramElementPalettePortal';
import { Palette } from './Palette';
import { useDiagramElementPalette } from './useDiagramElementPalette';

const useEdgePaletteStyle = makeStyles((theme) => ({
  toolbar: {
    background: theme.palette.background.paper,
    border: '1px solid #d1dadb',
    boxShadow: '0px 2px 5px #002b3c40',
    borderRadius: '2px',
    zIndex: 2,
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
  },
}));

export const DiagramElementPalette = ({ diagramElementId, labelId }: DiagramElementPaletteProps) => {
  const { setCurrentlyEditedLabelId } = useDiagramDirectEdit();
  const { setReferencePosition, resetReferencePosition } = useLayout();
  const { x: viewportX, y: viewportY, zoom: viewportZoom } = useViewport();
  const { x: paletteX, y: paletteY, isOpened } = useDiagramElementPalette();
  const classes = useEdgePaletteStyle();

  const handleDirectEditClick = () => {
    if (labelId) {
      setCurrentlyEditedLabelId('palette', labelId, null);
    }
  };

  const onToolApply = useCallback(() => {
    if (viewportZoom !== 0 && paletteX && paletteY) {
      const referencePosition = {
        x: (paletteX - viewportX) / viewportZoom,
        y: (paletteY - viewportY) / viewportZoom,
      };
      setReferencePosition(referencePosition, diagramElementId);
    }
  }, [paletteX, paletteY, viewportX, viewportY, viewportZoom]);

  const onToolApplyError = () => {
    resetReferencePosition();
  };

  return isOpened && paletteX && paletteY ? (
    <DiagramElementPalettePortal>
      <div
        className={classes.toolbar}
        style={{ position: 'absolute', left: paletteX, top: paletteY }}
        onClick={(event) => event.stopPropagation()}>
        <Palette
          diagramElementId={diagramElementId}
          onDirectEditClick={handleDirectEditClick}
          isDiagramElementPalette={true}
          onToolApply={onToolApply}
          onToolApplyError={onToolApplyError}
        />
      </div>
    </DiagramElementPalettePortal>
  ) : null;
};

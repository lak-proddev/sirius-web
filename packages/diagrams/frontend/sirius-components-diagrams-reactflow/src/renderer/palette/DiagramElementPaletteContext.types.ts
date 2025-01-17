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

export interface DiagramElementPaletteContextValue {
  x: number | null;
  y: number | null;
  isOpened: boolean;
  showDiagramElementPalette: (x: number, y: number) => void;
  hideDiagramElementPalette: () => void;
}

export interface DiagramElementPaletteContextProviderProps {
  children: React.ReactNode;
}

export interface DiagramElementPaletteContextProviderState {
  x: number | null;
  y: number | null;
  isOpened: boolean;
}

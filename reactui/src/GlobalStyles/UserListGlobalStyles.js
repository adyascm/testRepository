// GlobalStyles sets the global styles using Aphrodite. It can be used to set base
// style for HTML elements or utilities classes. The styles are generated and inserted
// into the DOM without any need to add a classname like in the usual use of Aphordite.
//
// This component needs to be imported into the parent component, usually something
// ending with 'App'.
//
// Based on https://github.com/Khan/aphrodite/issues/139#issuecomment-266500624

import { StyleSheet } from 'aphrodite';
import {colors } from '../designTokens';
//import { ms } from '../lib/modularScaleHelpers';
//import { em } from '../lib/styleUnitHelpers';
//import { antialiase } from '../commonStyles';

const GLOBALS = '__USER_LIST_GLOBAL_STYLES__';

const globalExtension = {
  selectorHandler: (selector, baseSelector, generateSubtreeStyles) =>
    (baseSelector.includes(GLOBALS) ? generateSubtreeStyles(selector) : null),
};

const extended = StyleSheet.extend([globalExtension]);
const styles = extended.StyleSheet.create({
  [GLOBALS]: {
   '.ag-body': {
      backgroundColor:colors.backgroundDark
    },
   '.ag-dark .ag-row-selected': {
      backgroundColor:'rgb(143, 94, 58)'
    },
    '.ag-row-odd': {
      backgroundColor: 'rgb(42, 46, 55)'
    },
    '.ag-row-even': {
      backgroundColor: colors.backgroundDark
    },
  },
});

export default extended.css(styles[GLOBALS]);

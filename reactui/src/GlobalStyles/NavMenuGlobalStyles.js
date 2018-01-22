// GlobalStyles sets the global styles using Aphrodite. It can be used to set base
// style for HTML elements or utilities classes. The styles are generated and inserted
// into the DOM without any need to add a classname like in the usual use of Aphordite.
//
// This component needs to be imported into the parent component, usually something
// ending with 'App'.
//
// Based on https://github.com/Khan/aphrodite/issues/139#issuecomment-266500624

import { StyleSheet } from 'aphrodite/no-important';
import {colors, spaces } from '../designTokens';
//import { ms } from '../lib/modularScaleHelpers';
//import { em } from '../lib/styleUnitHelpers';
//import { antialiase } from '../commonStyles';

const GLOBALS = '__NAV_MENU_GLOBAL_STYLES__';

const globalExtension = {
  selectorHandler: (selector, baseSelector, generateSubtreeStyles) =>
    (baseSelector.includes(GLOBALS) ? generateSubtreeStyles(selector) : null),
};

const extended = StyleSheet.extend([globalExtension]);
const styles = extended.StyleSheet.create({
  [GLOBALS]: {
   
    '.navMenu': {
      
    },
    '.navMenu:hover': {
      backgroundColor:colors.menuBg,
    },
    '.navSubmenu': {
      position:'absolute',
      display:'none',
      margin: '0px',
      padding: '0px',
      listStyle: 'none',
      backgroundColor:colors.menuBg,
      left:'0px',
      top:'100%',
      zIndex:9,
    },
    '.navSubmenu a, .sublist': {
      padding:spaces.s,
      letterSpacing: '0.5px',
      color: '#a2a4a8',
      float:'none',
      width:'200px',
      position:'relative',
      display:'block',
      textDecoration:'none',
      textTransform: 'capitalize'
    },
    '.navSubSubmenu': {
      position:'absolute',
      top:'0',
      left:'100%',
      margin: '0px',
      padding: '0px',
      listStyle: 'none',
      zIndex:'9',
      display:'none',
      backgroundColor:colors.menuBg,
    },
    '.navSubSubmenu li': {
      margin: '0px',
    },
    '.navSubmenu a:hover, .sublist:hover': {
      backgroundColor:colors.menuHover,
      color: '#1a1d25',
      'textDecoration':'none',
    },
    '.navMenu:hover .navSubmenu, .sublist:hover .navSubSubmenu': {
      display:'block',
    },
  },
});

export default extended.css(styles[GLOBALS]);

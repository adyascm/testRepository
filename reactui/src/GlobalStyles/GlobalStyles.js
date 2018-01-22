// GlobalStyles sets the global styles using Aphrodite. It can be used to set base
// style for HTML elements or utilities classes. The styles are generated and inserted
// into the DOM without any need to add a classname like in the usual use of Aphordite.
//
// This component needs to be imported into the parent component, usually something
// ending with 'App'.
//
// Based on https://github.com/Khan/aphrodite/issues/139#issuecomment-266500624

import { StyleSheet } from 'aphrodite/no-important';
import {colors, typography, spaces, sizes } from '../designTokens';
import { ms } from '../lib/modularScaleHelpers';
import { em } from '../lib/styleUnitHelpers';
import { antialiase } from '../commonStyles';

const GLOBALS = '__GLOBAL_STYLES__';

const globalExtension = {
  selectorHandler: (selector, baseSelector, generateSubtreeStyles) =>
    (baseSelector.includes(GLOBALS) ? generateSubtreeStyles(selector) : null),
};

const extended = StyleSheet.extend([globalExtension]);

const aModifierStyles = {
  color: colors.linkHover,
  textDecoration: 'underline'
};
const styles = extended.StyleSheet.create({
  [GLOBALS]: {
    html: {
      font: `${(typography.baseFontSizePx / 16) * 100}%/${typography.lineHeightPx/typography.baseFontSizePx} ${typography.fontFamily}`,
      color: colors.text,
      overflowY: 'scroll'
    },
    '.form-horizontal' : {
      marginTop:spaces.l,
      // width: sizes.xl,
      // padding: spaces.s,
      // marginLeft: 'auto',
      // marginRight: 'auto'
    },
    '.form-group' : {
      marginBottom:spaces.s,
      position:'relative',
      color: colors.textLight,
      padding: spaces.ms
    },
    '.form-group-right' : {
      marginBottom:spaces.s,
      position:'relative',
      color: colors.textLight,
      padding: spaces.ms,
      display:'inline-block',
      float:'right',
    },
    '.form-label' : {
      marginBottom:spaces.xs,
      //color: 'grey'
    },
    '.form-group input': {
      height: '35px',
      backgroundColor: colors.inputBg,
      border: 'solid 0.5px #979797',
      paddingLeft:spaces.xs,
    },
    body: {
      ...antialiase,
      backgroundColor: colors.background,
      minHeight: '100%'
    },
    'h1, h2, h3, h4': {
      fontSize: `${ms(1)}em`,
      fontWeight: typography.fontWeightRegular,
      margin: 0
    },
    h2: {
      textTransform: 'uppercase',
    },
    h3:{
      textTransform: 'uppercase',
      marginTop: '8%',
      color: colors.textLight,
    },
    ul: {
      margin: 0,
    },
    'li + li, ul ul': {
      marginTop: spaces.xs
    },
    'svg, img': {
      maxWidth: '100%'
    },
    a: {
      color: colors.link,
      textDecoration: 'none',
      ':hover': {...aModifierStyles},
      ':focus': {...aModifierStyles},
      ':active': {...aModifierStyles},
    },
    label: {
      display: 'block',
    },
    'label + label': {
      marginTop: spaces.xs
    },
    '[type="radio"]': {
      position: "relative",
      top: `-${em(1)}em`,
      marginRight: spaces.xxs,
    },
    'label + input': {
      marginTop: spaces.s
    },
    input: {
      border: `solid ${spaces.xxxs} ${colors.text}`,
      display: 'block',
      width: '100%'
    },
    '.default-ul': {
      listStyle:'none',
      padding:0,
      margin:0,
    },
    '.agGridPop .ag-cell-not-inline-editing': {
      padding:''+spaces.xs+' '+spaces.m+'',
      color:colors.grey8,
      // color: colors.text
    },
    '.agGridPop .ag-header-cell-label': {
      padding:''+spaces.xs+' '+spaces.m+'',
      textAlign:'left',
      //color: colors.text
    },
    '.manageDataSourceList': {
      'position': 'absolute',
      'left': '0px',
      'background': '#000000',
      'padding': '10px',
      'bottom': '50px',
      'list-style-type': 'none',
      'border-radius': '10px',
      'display':'inline-block'
    },
    '.manageDataSourceList::before': {
        position: 'absolute',
        content: '""',
        width: 0,
        height: 0,
        'z-index': 99,
        'border-top': '10px solid #000',
        'border-left': '10px solid transparent',
        'border-right': '10px solid transparent',
        bottom: '-10px',
        left:'15px'
    },
    '.manageDataSourceList li a':{
      'font-size':'16px',
      'text-decoration':'none',
      'padding':'5px 20px',
      'color':'#a2a4a8',
      'cursor':'pointer',
      'display':'block'
    },
    '.inputRadioBtn': {
      width:'auto',
      display:'inline-block',
      top:3,
      marginRight:10,
    },
    '.ag-grid-edit-input': {
      backgroundColor: '#626262 !important',
      color:'#ffffff',
      height: '24px',
      width: '100%',
      top: '-3px',
      paddingLeft:spaces.m,
      position: 'relative'
    }
    /*'.ag-dark select': {
        'background-color': 'transparent',
        'border':'2px solid #d88733',
        'border-radius':'10px',
        'padding':'5px 10px',
        'color': '#d88733'
    }*/
  },
});

export default extended.css(styles[GLOBALS]);

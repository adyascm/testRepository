// All design related variables for font, size, colors, spacing, etc. are defined in this file.
//
// Only exception is values of base font size, base line height and ratio, which are defined in
// designConstants.js. Because they are required by some helper functions which are used below.

import {
  BASE_FONT_SIZE_PX,
  BASE_LINE_HEIGHT_PX
} from './designConstants';

import { em, rem } from './Helpers/styleUnitHelpers';
import { generateColorVariants } from './Helpers/colorHelpers';

// Colors
const baseColors = {
  alizarin: '#e74c3c',
  black: '#000',
  blackPearl: '#1f232c',
  emerald: '#2ecc71',
  dullLavendar: '#a685ff',
  pastelOrange: '#d88733',
  peterriver: '#3498db',
  sunflower: '#f1c40f',
  white: '#fff',
  dimBlack:'#191d25',
  dimOrange:'#8f6335',
  inputBg:'#1a1d25',
};

// Shadow and highlights are inversed because of dark theme
baseColors.shadow = baseColors.white;
baseColors.highlight = baseColors.blackPearl;

// Primary and secondary colors
baseColors.primary = baseColors.pastelOrange;
baseColors.secondary = baseColors.dullLavendar;

const primaryShades = generateColorVariants(baseColors.primary, baseColors.shadow, 'primaryShade');
const primaryTints = generateColorVariants(baseColors.primary, baseColors.highlight, 'primaryTint');

const secondaryShades = generateColorVariants(baseColors.secondary, baseColors.shadow, 'secondary-shade-');
const secondaryTints = generateColorVariants(baseColors.secondary, baseColors.highlight, 'secondary-tint-');

const greys = generateColorVariants(baseColors.shadow, baseColors.highlight, 'grey', 20);

export const colors = {
  ...baseColors,
  ...primaryShades, // primaryShade1, primaryShade2,...
  ...primaryTints, // primaryTint1, primaryTint2,...
  ...secondaryShades, // seondaryShade1, seondaryShade2,...
  ...secondaryTints, // seondaryTint1, seondaryTint2, ..., grey20
  ...greys, // grey1, grey2,…

  text: greys.grey8,
  textLight: greys.grey6,

  link: baseColors.primary,
  linkHover: primaryShades.primaryShade3,
  linkLight: greys.grey10,
  linkLightHover: greys.grey4,

  backgroundLight: greys.grey2,
  background: greys.grey17,
  backgroundDark: baseColors.highlight,
  inputBg: baseColors.inputBg,

  info: baseColors.peterriver,
  success: baseColors.emerald,
  warning: baseColors.sunflower,
  error: baseColors.alizarin,

  menuBg:baseColors.dimBlack,
  menuHover:baseColors.dimOrange,
};

// Typography
export const typography = {
  fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,

  baseFontSizePx: BASE_FONT_SIZE_PX, // 15, to change update in designConstants.js

  lineHeightPx: BASE_LINE_HEIGHT_PX, // 20, to change update in designConstants.js

  fontWeightRegular: 'normal',
  fontWeightBold: 'bold',
};

typography.lineHeight = rem(typography.lineHeightPx);
typography.lineHeightSmall = rem(18);
typography.lineHeightLarge = 1.5;
typography.baseFontSize = em(typography.baseFontSizePx);

// Spaces
export const spaces = {
  xxxs: `${typography.lineHeight / 16}rem`,
  xxs: `${typography.lineHeight / 8}rem`,
  xs:  `${typography.lineHeight / 4}rem`,
  s:   `${typography.lineHeight / 2}rem`,
  ms:  `${typography.lineHeight / 1.5}rem`,
  ss:   `${typography.lineHeight / 3}rem`,
  m:   `${typography.lineHeight}rem`,
  l:   `${typography.lineHeight * 2}rem`,
  xl:  `${typography.lineHeight * 4}rem`,
  xxl: `${typography.lineHeight * 8}rem`,
};

// Sizes
export const sizes = {
  xxxs: `${typography.lineHeight}rem`,
  xxs: `${typography.lineHeight * 2}rem`,
  xs:  `${typography.lineHeight * 3}rem`,
  s:   `${typography.lineHeight * 5}rem`,
  m:   `${typography.lineHeight * 8}rem`,
  l:   `${typography.lineHeight * 13}rem`,
  xl:  `${typography.lineHeight * 21}rem`,
  xxl: `${typography.lineHeight * 34}rem`,
  xxxl: `${typography.lineHeight * 55}rem`,
};

// Opacity
export const opacities = {
  low: .80,
  medium: .45,
  high: .27,
  transparent: 0,
};

// Radii
export const radii = {
  m: `${rem(3)}rem`,
  l: `${rem(10)}rem`
};

// Border
export const border = {
  width: 2,
  color: colors.grey17,
  style: 'solid',
};

border.base = `${border.width}px ${border.style} ${border.color}`;

// Z-index
export const zIndexes = {
  reset: 1,
  modal: 10
};

// Duration
export const durations = {
  instantly:   '0s',
  immediately: '0.05s',
  quickly:     '0.1s',
  promptly:    '0.2s',
  slowly:      '0.4s',
}

// Components Specific
export const components = {
  pageHeader: {
    height: sizes.xxxs,
  },
  dataTableRow: {
    height: BASE_LINE_HEIGHT_PX * 1.25
  },
  agGridPopup: {
    height: 30
  },
  icon: {
    size: {
      xxs: `${rem(11)}rem`,
      xs: `${rem(14)}rem`,
      s:  `${rem(18)}rem`,
      m:  `${rem(24)}rem`,
      l:  `${rem(32)}rem`,
      xl:  `${rem(48)}rem`,
    }
  }
};

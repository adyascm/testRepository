import { em } from './Helpers/styleUnitHelpers';


export const allCaps = {
  textTransform: 'uppercase',
  letterSpacing: `${em(.5)}em`,
};

export const antialiase = {
  "-moz-osx-font-smoothing": "grayscale",
  "-webkit-font-smoothing": "antialiased",
};

export const resetAntialiase = {
  "-moz-osx-font-smoothing": "auto",
  "-webkit-font-smoothing": "auto",
};

export const clearfix = {
  "::after": {
    clear: "both",
    content: "''",
    display: "table",
  }
};

export const smoothScrollOnTouch = {
  "-webkit-overflow-scrolling": "touch",
}

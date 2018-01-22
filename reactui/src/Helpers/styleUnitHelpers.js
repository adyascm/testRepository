import {
  BASE_FONT_SIZE_PX
} from '../designConstants';

export const em = (px, baseFontSize) => {
  const base = baseFontSize || BASE_FONT_SIZE_PX;

  return px / base;
};

export const rem = (px, baseFontSize) => {
  return em(px, baseFontSize);
}

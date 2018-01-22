import Color from 'color';

export const generateColorVariants = (color, shadow, prefix, steps) => {
  const shades = {};

  if (typeof steps === 'undefined') {
    steps = 10;
  }

  for (var i = steps - 1; i >= 1; i--) {
    shades[`${prefix}${i}`] = Color(color).mix(Color(shadow), 1 - i / steps).toString();

    // console.log(
    //   `%c ${prefix}${i} ${shades[`${prefix}${i}`]}`,
    //   `background: ${shades[`${prefix}${i}`]}; color: #000`
    // );
  }

  return shades;
};

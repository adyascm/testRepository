import {
  BASE_RATIO
} from '../designConstants';

export const ms = (step, number, ratio) => {
  if (typeof step === 'undefined') {
    step = 0;
  }

  if (typeof number === 'undefined') {
    number = 1;
  }

  if (typeof ratio === 'undefined') {
    ratio = BASE_RATIO;
  }

  let  value = number;

  if (step > 0) {
    value = number * Math.pow(ratio, step);
  } else if (step < 0) {
    value = number / Math.pow(ratio, step * -1);
  }

  return value;
};

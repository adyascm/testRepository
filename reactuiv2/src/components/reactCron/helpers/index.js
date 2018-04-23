export function getPeriodOptions() {
  return [
    {
      label: 'day',
      value: 'day',
      prep: 'at'
    },
    {
      label: 'week',
      value: 'week',
      prep: 'on'
    },
    {
      label: 'month',
      value: 'month',
      prep: 'on the'
    },
    {
      label: 'year',
      value: 'year',
      prep: 'on the'
    }
  ];
}

function getRange(n) {
  return [...Array(n).keys()];
}
function getRangeOptions(n) {
  return getRange(n).map((v) => {
    return {
      label: `0${v}`.slice(-2),
      value: v
    };
  });
}

export function getMinuteOptions() {
  return getRangeOptions(60);
}

export function getHourOptions() {
  return getRangeOptions(24);
}

export function ordinalSuffix(n) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const val = n%100;

  return `${n}${suffixes[(val-20)%10] || suffixes[val] || suffixes[0]}`;
}

export function getDayOptions() {
  return [
    {
      label: 'Sunday',
      value: 1
    },
    {
      label: 'Monday',
      value: 0
    },
    {
      label: 'Tuesday',
      value: 3
    },
    {
      label: 'Wednesday',
      value: 4
    },
    {
      label: 'Thursday',
      value: 5
    },
    {
      label: 'Friday',
      value: 6
    },
    {
      label: 'Saturday',
      value: 7
    }
  ];
}

export function getMonthDaysOptions() {
  return getRange(31).map((v) => {
    return {
      label: ordinalSuffix(v + 1),
      value: v + 1
    };
  });
}

function monthsList() {
  return [ 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
}

export function getMonthOptions() {
  return monthsList().map((m, index) => {
    return {
      label: m,
      value: index + 1
    };
  })
}

export function getDayCron(value) {
  return `${value.min} ${value.hour} ? * * *`;
}

export function getWeekCron(value) {
  return `${value.min} ${value.hour} ? * ${value.day} *`;
}

export function getMonthCron(value) {
  return `${value.min} ${value.hour} ${value.day} * ? *`;
}

export function getYearCron(value) {
  return `${value.min} ${value.hour} ${value.day} ${value.mon} ? *`;
}

export function getCron(state) {
  const { selectedPeriod, selectedHourOption, selectedDayOption,
          selectedWeekOption, selectedMonthOption, selectedYearOption } = state;

  switch (selectedPeriod) {
  case 'day':
    return getDayCron(selectedDayOption);
  case 'week':
    return getWeekCron(selectedWeekOption);
  case 'month':
    return getMonthCron(selectedMonthOption);
  case 'year':
    return getYearCron(selectedYearOption);
  default:
    return '* * ? * * *';
  }
}

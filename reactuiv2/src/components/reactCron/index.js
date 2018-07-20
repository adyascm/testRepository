import React, { Component} from 'react';
import * as Helper from './helpers/index';
import classnames from 'classnames' ;
import PropTypes from 'prop-types'
import {REPORTS_CRON_EXP} from '../../constants/actionTypes';
import {connect} from 'react-redux';

const mapStateToProps = state => ({
  ...state.reports
})

const mapDispatchToProps = dispatch => ({
  setCronExp: (payload) => {
    dispatch(REPORTS_CRON_EXP,payload)
  }
})

class ReactCron extends Component {

  static propTypes = {
    className: PropTypes.string
  }

  _value: '* * * * *'

  state = {
    cronexp: '',
    loadPrevState: false,
    selectedPeriod: 'month',
    selectedDayOption: {
      hour: 0,
      min: 0
    },
    selectedWeekOption: {
      day: 1,
      hour: 0,
      min: 0
    },
    selectedMonthOption: {
      day: 1,
      hour: 0,
      min: 0
    },
    selectedYearOption: {
      day: 1,
      mon: 1,
      hour: 0,
      min: 0
    },
    periodOptions: Helper.getPeriodOptions(),
    minuteOptions: Helper.getMinuteOptions(),
    hourOptions: Helper.getHourOptions(),
    dayOptions: Helper.getDayOptions(),
    monthDaysOptions: Helper.getMonthDaysOptions(),
    monthOptions: Helper.getMonthOptions()
  }

  onPeriodSelect = () => {
    return (event) => {
      this.setState({
        selectedPeriod: event.target.value
      }, this.changeValue);
    }
  }

  onDayOptionSelect = (key) => {
    return (event) => {
      const value = event.target.value;
      const obj = {};
      obj[key] = value;
      const { selectedDayOption } = this.state;
      const dayOption = Object.assign({}, selectedDayOption, obj);
      this.setState({
        selectedDayOption: dayOption
      }, this.changeValue);
    };
  }

  onWeekOptionSelect = (key) => {
    return (event) => {
      const value = event.target.value;
      const obj = {};
      obj[key] = value;
      const { selectedWeekOption } = this.state;
      const weekOption = Object.assign({}, selectedWeekOption, obj);
      this.setState({
        selectedWeekOption: weekOption
      });
    };
  }

  onMonthOptionSelect = (key) => {
    return (event) => {
      const value = event.target.value;
      const obj = {};
      obj[key] = value;
      const { selectedMonthOption } = this.state;
      const monthOption = Object.assign({}, selectedMonthOption, obj);
      this.setState({
        selectedMonthOption: monthOption
      }, this.changeValue);
    };
  }

  onYearOptionSelect = (key) => {
    return (event) => {
      const value = event.target.value;
      const obj = {};
      obj[key] = value;
      const { selectedYearOption } = this.state;
      const yearOption = Object.assign({}, selectedYearOption, obj);
      this.setState({
        selectedYearOption: yearOption
      }, this.changeValue);
    };
  }

  getOptionComponent = (key) => {
    return (o, i) => {
      return (
        <option key={`${key}_${i}`} value={o.value}>{o.label}</option>
      );
    }
  }

  getDayComponent = () => {
    const { hourOptions, minuteOptions, selectedDayOption } = this.state;

    return (
      (this.state.selectedPeriod === 'day') &&
      <cron-day-component>
        <select value={selectedDayOption.hour} onChange={this.onDayOptionSelect('hour')}>
          {hourOptions.map(this.getOptionComponent('hour_option'))}
        </select>
        :
        <select value={selectedDayOption.min} onChange={this.onDayOptionSelect('min')}>
          {minuteOptions.map(this.getOptionComponent('minute_option'))}
        </select>
      </cron-day-component>
    );
  }

  getWeekComponent = () => {

    const { hourOptions, minuteOptions, dayOptions, selectedWeekOption } = this.state;
    return (
      (this.state.selectedPeriod === 'week') &&
      <cron-week-component>
        <select value={selectedWeekOption.day} onChange={this.onWeekOptionSelect('day')}>
          {dayOptions.map(this.getOptionComponent('week_option'))}
        </select>
        <span className='m-l-xs m-r-xs'>at</span>
        <select value={selectedWeekOption.hour} onChange={this.onWeekOptionSelect('hour')}>
          {hourOptions.map(this.getOptionComponent('hour_option'))}
        </select>
        :
        <select value={selectedWeekOption.min} onChange={this.onWeekOptionSelect('min')}>
          {minuteOptions.map(this.getOptionComponent('minute_option'))}
        </select>
      </cron-week-component>
    );
  }

  getMonthComponent = () => {
    const { monthDaysOptions, hourOptions, minuteOptions, selectedMonthOption } = this.state;

    return (
      (this.state.selectedPeriod === 'month') &&
      <cron-month-component>
        <select value={selectedMonthOption.day} onChange={this.onMonthOptionSelect('day')}>
          {monthDaysOptions.map(this.getOptionComponent('month_days_option'))}
        </select>
        <span className='m-l-xs m-r-xs'>at</span>
        <select value={selectedMonthOption.hour} onChange={this.onMonthOptionSelect('hour')}>
          {hourOptions.map(this.getOptionComponent('hour_option'))}
        </select>
        :
        <select value={selectedMonthOption.min} onChange={this.onMonthOptionSelect('min')}>
          {minuteOptions.map(this.getOptionComponent('minute_option'))}
        </select>
      </cron-month-component>
    );
  }

  getYearComponent = () => {
    const { monthOptions, monthDaysOptions, hourOptions, minuteOptions, selectedYearOption } = this.state;

    return (
      (this.state.selectedPeriod === 'year') &&
      <cron-year-component>
        <select value={selectedYearOption.day} onChange={this.onYearOptionSelect('day')}>
          {monthDaysOptions.map(this.getOptionComponent('month_days_option'))}
        </select>
        <span className='m-l-xs m-r-xs'>of</span>
        <select value={selectedYearOption.mon} onChange={this.onYearOptionSelect('mon')}>
          {monthOptions.map(this.getOptionComponent('month_option'))}
        </select>
        <span className='m-l-xs m-r-xs'>at</span>
        <select value={selectedYearOption.hour} onChange={this.onYearOptionSelect('hour')}>
          {hourOptions.map(this.getOptionComponent('hour_option'))}
        </select>
        :
        <select value={selectedYearOption.min} onChange={this.onYearOptionSelect('min')}>
          {minuteOptions.map(this.getOptionComponent('minute_option'))}
        </select>
      </cron-year-component>
    );
  }

  changeValue() {
    this._value = Helper.getCron(this.state);

  }

 componentDidUpdate(){
   if(document.getElementById("crondata")){
   var cronExp = document.getElementById("crondata").value
   this.props.stateSetHandler('frequency', cronExp)
 }
 }

 cronExpEvaluation = (cronExp) => {

  var cronArray = [];
  cronArray = cronExp.split(" ")
  {cronArray[1] !== '*'? this.setState({
    selectedDayOption : {'hour': cronArray[1],'min': cronArray[0].split('(')[1]},
    selectedPeriod: 'day'}) : null}
    ;
  {cronArray[4] !== '*' && cronArray[4] !== '?'? this.setState({
    selectedWeekOption: {'day': cronArray[4], 'hour': cronArray[1], 'min':  cronArray[0].split('(')[1] },
     selectedPeriod: 'week'
   }) : null
  };
  {cronArray[2] !== '*' && cronArray[2] !== '?'? this.setState({
    selectedWeekOption: {'day': cronArray[2], 'hour': cronArray[1], 'min': cronArray[0].split('(')[1]},
    selectedPeriod: 'month'}) : null
  };
  {cronArray[3] !== '*' ? this.setState({
    selectedWeekOption: {'mon': cronArray[3], 'day': cronArray[2],'hour': cronArray[1], 'min':  cronArray[0].split('(')[1]},
    selectedPeriod: 'year'}) : null
  };
 }


  render() {

    const { className } = this.props;
    const { selectedPeriod, periodOptions } = this.state;

    if (this.props.formType === "modify_report" ) {
         if(this.props.defaultCronVal && this.state.loadPrevState === false){
           this.cronExpEvaluation(this.props.defaultCronVal)
           this.setState({
             loadPrevState: true
           })
         }
   }

   const getPeriodPrep = () => {
     const option = periodOptions.find((o) => (o.value === selectedPeriod));
     return (
       <span className='m-l-xs m-r-xs'>{option.prep}</span>
     );
   }

    // {this.formType}
    return (
      <div className={classnames(className, 'cron-row')}>
        <div className=''>
          <div className=''>
            Every
            <select value={selectedPeriod} onChange={this.onPeriodSelect()} className='m-l-xs' >
              {periodOptions.map((t,index) => {
                return (
                  <option key={`period_option_${index}`} value={t.value}>{t.label}</option>
                );
              })}
            </select>
            {getPeriodPrep()}
            {this.getDayComponent()}
            {this.getWeekComponent()}
            {this.getMonthComponent()}
            {this.getYearComponent()}

          </div>
          <input id="crondata" type="hidden" className='cron-input'  value={Helper.getCron(this.state)}
            defaultValue={this.props.cronVal}
           />
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps,mapDispatchToProps)(ReactCron);

import {
    REPORTS_CRON_EXP,
    CREATE_SCHEDULED_REPORT,
    SET_SCHEDULED_REPORTS,
    DELETE_SCHEDULED_REPORT,
    RUN_SCHEDULED_REPORT,
    DELETE_OLD_SCHEDULED_REPORT,
    UPDATE_SCHEDULED_REPORT
} from '../constants/actionTypes';

export default (state = {}, action) => {
    switch (action.type) {
        case REPORTS_CRON_EXP:
            return {
                ...state,
                cronExp: action.payload
            }
        case CREATE_SCHEDULED_REPORT:
             return{
               ...state,
               scheduledReport: action.payload
             }
        case SET_SCHEDULED_REPORTS:
              return{
                ...state,
                reports: action.payload
              }
        case DELETE_SCHEDULED_REPORT:
              return{
                ...state
              }
        case RUN_SCHEDULED_REPORT:
            let keys = Object.keys(action.payload)
            let rows = []

            for (let index=0; index<keys.length; index++) {
                rows.push(action.payload[keys[index]])
            }
             return{
               ...state,
               runReportData: rows
             }
        case DELETE_OLD_SCHEDULED_REPORT:
             return{
               ...state,
               runReportData: []

             }
       case UPDATE_SCHEDULED_REPORT:
            return{
              ...state
            }
        default:
            return state;
    }
};

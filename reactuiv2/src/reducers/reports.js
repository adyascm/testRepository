import {
    REPORTS_CRON_EXP,
    CREATE_SCHEDULED_REPORT,
    SET_SCHEDULED_REPORTS,
    DELETE_SCHEDULED_REPORT,
    RUN_SCHEDULED_REPORT
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
             return{
               ...state,
               runReportData: action.payload
             }
        default:
            return state;
    }
};

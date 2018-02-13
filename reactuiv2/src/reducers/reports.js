import {
    REPORTS_CRON_EXP,
    CREATE_SCHEDULED_REPORT,
    GET_SCHEDULED_REPORTS
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
        case GET_SCHEDULED_REPORTS:
              return{
                ...state,
                reports: action.payload
              }
        default:
            return state;
    }
};

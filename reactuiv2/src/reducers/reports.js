import {
    REPORTS_CRON_EXP,
    CREATE_SCHEDULED_REPORT
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
        default:
            return state;
    }
};

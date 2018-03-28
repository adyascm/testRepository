import {
    REPORTS_CRON_EXP,
    CREATE_SCHEDULED_REPORT,
    SET_SCHEDULED_REPORTS,
    DELETE_SCHEDULED_REPORT,
    RUN_SCHEDULED_REPORT,
    DELETE_OLD_SCHEDULED_REPORT,
    UPDATE_SCHEDULED_REPORT,
    REPORTS_PAGE_LOADING,
    LOGOUT
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
               scheduledReport: action.error?[]:action.payload,
               errorMessage: action.error
             }
        case REPORTS_PAGE_LOADING:
             return {
               ...state,
               isLoading: true
             }
        case SET_SCHEDULED_REPORTS:
              var error;
              if(action.error === undefined){
                error = false
              }
              else {
                error = true
              }
              return{
                ...state,
                reports: action.error?[]:action.payload,
                isLoading: false,
                getreportError: error,
                errorMessage: action.error
              }
        case DELETE_SCHEDULED_REPORT:
              return{
                ...state
              }
        case RUN_SCHEDULED_REPORT:
             return{
               ...state,
               runReportData: action.error?[]:action.payload,
               errorMessage: action.error
             }
        case DELETE_OLD_SCHEDULED_REPORT:
             return{
               ...state,
               runReportData: undefined,
               scheduledReport: undefined
             }
        case UPDATE_SCHEDULED_REPORT:
            return{
              ...state
            }
        case LOGOUT:
            return {
              ...state,
              reports: undefined
            }
        default:
            return state;
    }
};

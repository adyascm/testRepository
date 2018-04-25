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

const defaultState = {
  cronExp: undefined,
  scheduledReport: undefined,
  errorMessage: false,
  reports: undefined,
  getreportError: undefined,
  isLoadingReports: false,
  runReportData: undefined
}

export default (state = defaultState, action) => {
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
               isLoadingReports: true
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
                isLoadingReports: false,
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
              ...defaultState
            }
        default:
            return state;
    }
};

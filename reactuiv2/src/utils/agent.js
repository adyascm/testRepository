import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';

import {API_ROOT} from '../constants/actionTypes'

const superagent = superagentPromise(_superagent, global.Promise);



//const encode = encodeURIComponent;
const responseBody = res => res.body;

let token = null;
const tokenPlugin = req => {
    req.set('Content-Type', 'application/json');
    if (token) {
        req.set('authorization', `${token}`);
    }
}

const requests = {
    del: url =>
        superagent.del(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody),
    get: url =>
        superagent.get(`${API_ROOT}${url}`).use(tokenPlugin).then(responseBody),
    put: (url, body) =>
        superagent.put(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody),
    post: (url, body) =>
        superagent.post(`${API_ROOT}${url}`, body).use(tokenPlugin).then(responseBody)
};

const Auth = {
  current  : () =>
        requests.get('/common/user'),
    save: user =>
        requests.put('/common/user', { user })
};

const Setting = {
    getDataSources: () =>
        requests.get('/common/datasources'),
    createDataSource: (dataSource) =>
        requests.post('/common/datasources', dataSource),
    deleteDataSource: (dataSource) =>
        requests.del('/common/datasources?datasourceId=' + dataSource.datasource_id),
    processNotifications: () =>
        requests.get('/google/scan/processnotifications')
};

const Actions = {
  getAllActions: () =>
    requests.get('/common/getallactions'),
  initiateAction: (action_payload) =>
    requests.post('/common/initiateaction', action_payload)

}

const Activity = {
    getActivitiesForUser: (user_email) =>
        requests.get('/common/getactivitiesforuser?user_email=' + user_email)
}

const Dashboard = {
    getWidgetData: (widgetId) =>
        requests.get('/common/widgets?widgetId=' + widgetId)
}

const Users = {
    getUsersTree: () =>
        requests.get('/common/getusergrouptree')
}

const Apps = {
    getapps: () => requests.get('/common/getappsdata'),
    revokeAppAccess: (datasourceId, clientId,userEmail) =>
        requests.del('/google/scan/usersapp?dataSourceId=' +datasourceId+
                "&userEmail="+ userEmail + "&clientId="+clientId ),
    getuserapps: (userEmail) => requests.get('/common/getappsdata?userEmail=' + userEmail),
    getappusers: (clientId) => requests.get('/common/getappsdata?clientId=' + clientId),
}

const Resources = {
    getResourcesTree: (parentId) =>
        requests.post('/common/getresourcetree',parentId),
    searchResources: (prefix) =>
        requests.get('/common/getresourcetree?prefix=' + prefix)
}

const Scheduled_Report = {
   createReport: (report) =>
     requests.post('/common/scheduledreport', report),
   getReports: () =>
     requests.get('/common/scheduledreport'),
   deleteReport: (report_id) =>
     requests.del('/common/scheduledreport?reportId=' + report_id),
   getRunReportData: (report_id) =>
     requests.get('/common/scheduledreport/runreport?reportId=' + report_id),
   updateReport: (report) =>
     requests.put('/common/scheduledreport', report)

}

const AuditLog = {
    getAuditLogList: () =>
        requests.get('/common/getauditlog')
}

const Policy = {
    createPolicy: (policyInfo) =>
        requests.post('/common/policies', policyInfo),
    getPolicy: () => 
        requests.get('/common/policies')
}


export default { Auth, Setting, Dashboard, AuditLog, Users, Resources, Scheduled_Report, Activity, Actions, Apps, Policy, setToken: _token => { token = _token; } };

import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';

import {API_ROOT} from '../constants/actionTypes'

const superagent = superagentPromise(_superagent, global.Promise);



const encode = encodeURIComponent;
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
    current: () =>
        requests.get('/user'),
    save: user =>
        requests.put('/user', { user })
};

const Setting = {
    getDataSources: () =>
        requests.get('/datasources'),
    createDataSource: (dataSource) =>
        requests.post('/datasources', dataSource),
    deleteDataSource: (dataSource) =>
        requests.del('/datasources?datasourceId=' + dataSource.datasource_id),
    processNotifications: () =>
        requests.get('/scan/processnotifications')
};

const Activity = {
    getActivitiesForUser: (user_email) =>
        requests.get('/getactivitiesforuser?user_email=' + user_email)
}

const Dashboard = {
    getWidgetData: (widgetId) =>
        requests.get('/widgets?widgetId=' + widgetId)
}

const Users = {
    getUsersTree: () =>
        requests.get('/getusergrouptree')
}

const Resources = {
    getResourcesTree: (parentId) =>
        requests.post('/getresourcetree',parentId)
}

const Scheduled_Report = {
   createReport: (report) =>
     requests.post('/scheduledreport', report),
   getReports: () =>
     requests.get('/scheduledreport'),
   deleteReport: (report_id) =>
     requests.del('/scheduledreport?reportId=' + report_id),
   getRunReportData: (report_id) =>
     requests.get('/scheduledreport/runreport?reportId=' + report_id),
   updateReport: (report) =>
     requests.get('/scheduledreport', report)

}


export default { Auth, Setting, Dashboard, Users, Resources, Scheduled_Report, Activity, setToken: _token => { token = _token; } };

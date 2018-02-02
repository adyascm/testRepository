import superagentPromise from 'superagent-promise';
import _superagent from 'superagent';

import {API_ROOT} from '../constants/actionTypes'

const superagent = superagentPromise(_superagent, global.Promise);



const encode = encodeURIComponent;
const responseBody = res => res.body;

let token = null;
const tokenPlugin = req => {
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
        requests.get('/getdatasources')
};

export default { Auth, Setting, setToken: _token => { token = _token; } };
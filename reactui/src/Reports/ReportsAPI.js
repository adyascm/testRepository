import * as urls from '../urls.js';
const env = process.env.REACT_APP_ADYA_ENV || 'dev';

const headers = {
  'Accept': 'application/json'
}

export const getWidgetInfo = (body) =>
  fetch(urls.posturl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body:  JSON.stringify(body)
  }).then(res => res.json())

export const getAll = ((email, authToken) =>
    fetch(urls.geturl+`/schedule_reports/${email}?authToken=${authToken}`, { headers })
      .then(res => res.json()))

export const create = (body) =>
    fetch(urls.posturl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body:  JSON.stringify(body)
    }).then(res => res.json())

export const create_runnow = (body) =>
      fetch(urls.posturl, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body:  JSON.stringify(body)
  }).then(res => res.json())

export const getCsvReportUrl = ((body) =>
    fetch(urls.posturl, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body:  JSON.stringify(body)
    }).then(res => res.json()))

export const getDataSources = ((email, authToken) =>
  fetch (urls.geturl+`/get_datasources/${email}?authToken=${authToken}`, { headers })
    .then(res => res.json()))

export const getUserSources = ((email, authToken) =>
  fetch (urls.geturl+`/get_usersources/${email}?authToken=${authToken}`, { headers })
    .then(res => res.json()))

export const deleteReport = ((email, reportId, authToken) =>
fetch (urls.geturl+`/delete_report/${email}?report_id=${reportId}&authToken=${authToken}`, { headers })
  .then(res => res.json()))

export const emailService = ((body) =>
  fetch(urls.posturl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body:  JSON.stringify(body)
  }).then(res => res.json()))

export const getResourcesForPicker = ((email, parentId, datasourceId, authToken) =>
    fetch (urls.geturl+`/get_child_resources_with_user_perms/${email}?parent_id=${parentId}&datasource_id=${datasourceId}&authToken=${authToken}`, { headers })
     .then(res => res.json()))

export const getResourcesForPickerFromPath = ((email, path, datasourceId, authToken) =>
  fetch (urls.geturl+`/get_child_resources_from_path/${email}?resource_path=${path}&datasource_id=${datasourceId}&authToken=${authToken}`, { headers })
    .then(res => res.json()))

export const getUsersForPicker = ((parentEmail, parentId, usersourceId, authToken) =>
   fetch (urls.geturl+`/get_users/${parentEmail}?parent_id=${parentId}&usersource_id=${usersourceId}&authToken=${authToken}`, { headers })
    .then(res => res.json()))

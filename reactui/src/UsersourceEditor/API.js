import * as urls from '../urls'
const env = process.env.REACT_APP_ADYA_ENV || 'dev';
const headers = {
  'Accept': 'application/json'
}

export const renameUsersource = ((email, usersourceId, name, authToken) =>
  fetch(urls.puturl+`/rename_usersource/${email}?usersource_id=${usersourceId}&usersource_name=${name}&authToken=${authToken}`, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  }))

export const renamedatasource = ((email, datasourceId, name, authToken) =>
    fetch(urls.puturl+`/rename_datasource/${email}?datasource_id=${datasourceId}&datasource_name=${name}&authToken=${authToken}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    }))

import * as urls from '../urls'
const env = process.env.REACT_APP_ADYA_ENV || 'dev';

const headers = {
  'Accept': 'application/json'
}

export const getUserDatasources = ((email, authToken) =>
  fetch(urls.geturl+`/get_userdatasource/${email}?authToken=${authToken}`, { headers })
    .then(res => res.json()))

export const getScanTime = ((email,authToken) =>
  fetch(urls.getScanTime(email,authToken), {
    headers: {
      ...headers
    }
  }). then(response => response.json()))

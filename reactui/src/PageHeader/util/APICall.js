import * as urls from '../../urls'
const env = process.env.REACT_APP_ADYA_ENV || 'dev';

const headers = {
  'Accept': 'application/json'
}

export const getFilteredMetadata = ((body) =>
  fetch(urls.posturl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body:  JSON.stringify(body)
  }).then(res => res.json()))

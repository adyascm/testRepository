import * as urls from '../../urls'

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

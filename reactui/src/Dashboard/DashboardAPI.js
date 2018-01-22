import * as urls from '../urls.js';

const headers = {
  'Accept': 'application/json'
}

export const getDatasourceId = ((email,authToken) =>
  fetch(urls.getDatasource(email,authToken),
  { headers }).then(response => response.json()));

export const getUsersourceId = ((email,authToken) =>
  fetch(urls.getUsersource(email,authToken),
  { headers }).then(response => response.json()));

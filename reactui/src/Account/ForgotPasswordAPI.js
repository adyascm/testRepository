import * as urls from '../urls.js';

const headers = {
  'Accept': 'application/json'
}

export const sendEmail = (body) =>
  fetch(urls.emailForgotPassword, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body:  JSON.stringify(body)
  }).then(res => res.json())

// export const changePassword = (body) =>
//   fetch(urls.changePassword, {
//     method: 'PUT',
//     headers: {
//       ...headers,
//       'Content-Type': 'application/json'
//     },
//     body:  JSON.stringify(body)
//   }).then(res => res.json())

  export const changePassword = ((email, new_password, authToken) =>
  fetch(urls.puturl+`/change_password/${email}?new_password=${new_password}&authToken=${authToken}`, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
  }).then(res => res.json()))
  

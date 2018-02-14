import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux'
import { Route, BrowserRouter, Switch } from 'react-router-dom';
import './index.css';
import App from './App';
//import registerServiceWorker from './registerServiceWorker';
import { store } from './store';

window.Chart = require('chart.js');




ReactDOM.render(
    (
        <Provider store={store}>
            <BrowserRouter>
                <Switch>
                    <Route path="/" component={App} />
                </Switch>
            </BrowserRouter>
        </Provider>
    ), document.getElementById('root'));
//registerServiceWorker();

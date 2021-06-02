
import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";

import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';

import App from '/imports/ui/App';

// importamos bootstrap (4.6)
import 'bootstrap/dist/css/bootstrap.min.css';

Meteor.startup(() => {
    render(<Router><App /></Router>, document.getElementById('react-target'));
})
import { Meteor } from 'meteor/meteor';

import './emailTemplates/accounts'; 

import '/imports/sequelize/sequelize'; 
import { sequelizeAuthentication } from '/imports/sequelize/sequelize'; 

// desde cada file, se importan los: collections, methods, subscriptions en el server 
import './importFiles/collections'; 
import './importFiles/methods'; 
import './importFiles/subscriptions'; 

Meteor.startup(() => {
    sequelizeAuthentication(); 
})
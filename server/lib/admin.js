var utils = require('loopback-datasource-juggler/lib/utils');
var _ = require('lodash');

function formatProperties(properties) {
	var result = {};
	for (var key in properties) {
		result[key] = {};
		for (var prop in properties[key]) {
			if (prop !== 'type') {
				result[key][prop] = properties[key][prop];
			}
			else {
				result[key]['type'] = properties[key].type.name;
			}
		}
	}
	return result;
}

module.exports = function getModelInfo(server, modelName) {

	var model = server.models[modelName];

	var result = {
		id: model.definition.name,
		name: model.definition.name,
		properties: formatProperties(model.definition.properties)
	};

	var keys = ['description', 'plural', 'base', 'idInjection',
		'persistUndefinedAsNull', 'strict', 'hidden',
		'validations', 'relations', 'acls', 'methods', 'mixins', 'adminForms'
	];

	keys.forEach(function (key) {
		result[key] = _.get(model.definition.settings, key);
	});

	if (!result.adminForms) {
		result.adminForms = {
			listColumns: [],
			editColumns: [],
			viewColumns: []
		};

		for (var prop in result.properties) {
			var def = {
				name: prop,
				field: prop
			};
			result.adminForms.listColumns.push(def);
			result.adminForms.editColumns.push(def);
			result.adminForms.viewColumns.push(def);
		}
	}

	return result;
};

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
		'validations', 'relations', 'acls', 'methods', 'mixins', 'admin'
	];

	keys.forEach(function (key) {
		result[key] = _.get(model.definition.settings, key);
	});

	if (!result.admin) {
		result.admin = {
			listProperties: [],
			editProperties: [],
			viewProperties: []
		};
	}

	if (!result.admin.listProperties) {
		result.admin.listProperties = [];
		result.admin.populateList = true;
	}

	if (!result.admin.editProperties) {
		result.admin.editProperties = [];
		result.admin.populateEdit = true;
	}

	if (!result.admin.viewProperties) {
		result.admin.viewProperties = [];
		result.admin.populateView = true;
	}

	for (var prop in result.properties) {
		var def = {
			name: prop,
			field: prop
		};

		if (result.admin.populateList) {
			result.admin.listProperties.push(def);
		}

		if (result.admin.populateEdit) {
			result.admin.editProperties.push(def);
		}

		if (result.admin.populateView) {
			result.admin.viewProperties.push(def);
		}
	}

	return result;
};

var utils = require('loopback-datasource-juggler/lib/utils');
var _ = require('lodash');

function clone(obj) {
	if (!obj) {
		return obj
	}
	return JSON.parse(JSON.stringify(obj));
}

function formatProperties(properties) {
	var result = {};
	for (var key in properties) {
		result[key] = {};
		for (var prop in properties[key]) {
			if (prop !== 'type') {
				result[key][prop] = properties[key][prop];
			}
			else {
				if (properties[key].type instanceof Array) {
					result[key]['type'] = 'Array';
				}
				else {
					result[key]['type'] = properties[key].type.name;
				}
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

	var keys = ['description', 'plural', 'base', 'strict', 'hidden',
		'validations', 'methods', 'mixins', 'admin'
	];

	keys.forEach(function (key) {
		result[key] = clone(_.get(model.definition.settings, key));
	});

	result['relations'] = clone(model.relations);

	if (!result.admin) {
		result.admin = {
			defaultProperty: 'id'
		};
	}

	var populateList, populateEdit, populateView;

	if (!result.admin.listProperties) {
		result.admin.listProperties = [];
		populateList = true;
	}

	if (!result.admin.editProperties) {
		result.admin.editProperties = [];
		populateEdit = true;
	}

	if (!result.admin.viewProperties) {
		result.admin.viewProperties = [];
		populateView = true;
	}

	for (var prop in result.properties) {

		result.properties[prop].admin = {};

		var type = result.properties[prop].type;
		if (type === 'Boolean') {
			type = 'checkbox';
		}
		if (type === 'String') {
			type = 'text';
		}
		if (type === 'Object') {
			type = 'textarea';
		}
		if (type === 'Array') {
			type = 'textarea';
		}
		if (type === 'Date') {
			type = 'text';
		}

		result.properties[prop].admin.inputType = type;

		if (populateList) {
			result.admin.listProperties.push(prop);
		}

		if (populateEdit) {
			result.admin.editProperties.push(prop);
		}

		if (populateView) {
			result.admin.viewProperties.push(prop);
		}
	}

	return result;
};

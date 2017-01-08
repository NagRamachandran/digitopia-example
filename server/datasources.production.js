module.exports = getDB();

function getDB() {
	var db = {
		"db": {
			"name": "db",
			"connector": "mysql",
			"host": process.env.RDS_HOSTNAME,
			"port": process.env.RDS_PORT,
			"database": process.env.RDS_DB_NAME,
			"password": process.env.RDS_PASSWORD,
			"user": process.env.RDS_USERNAME
		}
	};

	console.log('using mysql');
	return db;
};

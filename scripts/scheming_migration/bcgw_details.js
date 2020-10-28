const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER ? process.env.DB_USER : 'ckan',
  host: process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1',
  database: process.env.DB_NAME ? process.env.DB_NAME : 'ckan',
  password: process.env.DB_PASS ? process.env.DB_PASS : 'ckan',
  port: process.env.DB_PORT ? process.env.DB_PORT : 5432,
});
pool.connect();

const proj_name = {
	"EPSG_3005 - NAD83 BC Albers": "epsg3005",
	"EPSG_3857 - WGS84 Pseudo-Mercator -- Spherical Mercator": "epsg3857",
	"EPSG_4326 - WGS84 World Geodetic System 1984": "epsg4326",
	"EPSG_26707 - NAD27 UTM zone 7N": "epsg26707",
	"EPSG_26708 - NAD27 UTM zone 8N": "epsg26708",
	"EPSG_26709 - NAD27 UTM zone 9N": "epsg26709",
	"EPSG_26710 - NAD27 UTM zone 10N": "epsg26710",
	"EPSG_26711 - NAD27 UTM zone 11N": "epsg26711",
	"EPSG_26712 - NAD27 UTM zone 12N": "epsg26712",
	"EPSG_26907 - NAD83 UTM zone 7N": "epsg26907",
	"EPSG_26908 - NAD83 UTM zone 8N": "epsg26908",
	"EPSG_26909 - NAD83 UTM zone 9N": "epsg26909",
	"EPSG_26910 - NAD83 UTM zone 10N": "epsg26910",
	"EPSG_26911 - NAD83 UTM zone 11N": "epsg26911",
	"EPSG_26912 - NAD83 UTM zone 12N": "epsg26912",
	"EPSG_32607 - WGS84 UTM zone 7N": "epsg32607",
	"EPSG_32608 - WGS84 UTM zone 8N": "epsg32608",
	"EPSG_32609 - WGS84 UTM zone 9N": "epsg32609",
	"EPSG_32610 - WGS84 UTM zone 10N": "epsg32610",
	"EPSG_32611 - WGS84 UTM zone 11N": "epsg32611",
	"EPSG_32612 - WGS84 UTM zone 12N": "epsg32612",
	"EPSG_4269 - NAD83": "epsg4269",
	"N-A": "na",
	"UTM": "utm"
}

async function main() {
	try {
		let res = await pool.query('SELECT * FROM package');
		for (let package of res.rows) {
			console.log("Updating package: ", package['name']);
			let resources = [];

			let extrasRes = await pool.query("SELECT key, value FROM package_extra WHERE package_id = $1", [package['id']]);
			let detailsObj = {};
			extrasRes.rows.forEach(function(packageExtra) {
				if (packageExtra['key'].match(/details\:/g)) {
					let keyComponents = packageExtra['key'].split(':');
					if (!detailsObj[keyComponents[1]]) detailsObj[keyComponents[1]] = {};
					if (keyComponents[2] == 'branch') {
						detailsObj[keyComponents[1]]['org'] = packageExtra['value'];
					} else if (keyComponents[2] != 'organization') {
						detailsObj[keyComponents[1]][keyComponents[2]] = packageExtra['value'];
					}
				}
			});
			let details = [];
			for (const key in detailsObj) {
				details.push(detailsObj[key]);
			}
			let resourceRes = await pool.query("SELECT extras, id from resource WHERE package_id = $1", [package['id']]);
			resourceRes.rows.forEach(function(resource) {
				let extraObj = JSON.parse(resource['extras']);
				if (extraObj == null ) extraObj = {};
				extraObj['id'] = resource['id'];
				if (details.length > 0) {
					extraObj['details'] = JSON.stringify(details);
				}
				if (proj_name[extraObj['projection_name']]) extraObj['projection_name'] = proj_name[extraObj['projection_name']];
				if (extraObj['resource_storage_access_method']) extraObj['resource_storage_access_method'] = extraObj['resource_storage_access_method'].toLowerCase();
				if (extraObj['resource_storage_location']) extraObj['resource_storage_location'] = extraObj['resource_storage_location'] == 'BCGW Datastore' ? 'bc geographic warehouse' : extraObj['resource_storage_location'].toLowerCase();
				resources.push(extraObj);
			});
			resources.forEach(async function(resource) {
				let resourceId = resource['id'];
				delete resource['id'];
				let extraString = JSON.stringify(resource);
				await pool.query("UPDATE resource SET extras = $1 WHERE id = $2", [extraString, resourceId]);
			});
			console.log('Finished with Package: ', package['name']);
		}
		console.log('All Finished ¯\\_(ツ)_/¯');
		process.exit();
	} catch(err) {
		console.log(err.stack);
	}
}

main();

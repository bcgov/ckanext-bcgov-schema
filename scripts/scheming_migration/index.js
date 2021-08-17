const { Pool } = require('pg');
const uuidv4 = require('uuid/v4');

const pool = new Pool({
  user: process.env.DB_USER ? process.env.DB_USER : 'ckan',
  host: process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1',
  database: process.env.DB_NAME ? process.env.DB_NAME : 'ckan',
  password: process.env.DB_PASS ? process.env.DB_PASS : 'ckan',
  port: process.env.DB_PORT ? process.env.DB_PORT : 5432,
});
pool.connect();

console.log({
	user: process.env.DB_USER ? process.env.DB_USER : 'ckan',
	host: process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1',
	database: process.env.DB_NAME ? process.env.DB_NAME : 'ckan',
	password: process.env.DB_PASS ? process.env.DB_PASS : 'ckan',
	port: process.env.DB_PORT ? process.env.DB_PORT : 5432,
  });

const proj_name = {
	"EPSG_3005 - NAD83 BC Albers": "epsg3005",
	"EPSG_3857 - WGS84 Pseudo-Mercator -- Spherical Mercator": "epsg3857",
	"EPSG_4326 - WGS84 - World Geodetic System 1984": "epsg4326",
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
};

function renameFieldIfExists(object, oldName, newName, mappingFunction = f => f) {
	if (object[oldName]) {
		object[newName] = mappingFunction(object[oldName]);
		delete object[oldName];
	}
}

function moveFieldIfExists(oldObject, newObject, fieldName) {
	if (oldObject[fieldName]) {
		newObject[fieldName] = oldObject[fieldName];
		delete oldObject[fieldName];
	}
}

async function main() {
	try {
		let res = await pool.query('SELECT * FROM package');

		// Iterate over all packages
		let count = 0;
		for (let packageObj of res.rows) {
			process.stdout.write("Progress: " + ((count++/res.rows.length)*100).toFixed(1) + "%\r");
			// console.log("Updating package: ", packageObj['name']);
			let packageExtras = {};
			let resources = [];
			let resourceType = packageObj['type'].toLowerCase();
			if ( (resourceType.length < 1) || (resourceType === 'dataset') ) {
				resourceType = 'document';
			}

			// Assign sane defaults to package (not extras) that are required, if unset
			if (!('title' in packageObj)) {
				packageObj['title'] = packageObj['name'];
			}
			if (!('notes' in packageObj)) {
				packageObj['notes'] = 'This field is required and needs to be updated';
			}
			if (!('license_id' in packageObj)) {
				// This license is Access Only
				// This is not available from the db but rather a JSON file hence I'm adding the id explicitly rather than querying it
				packageObj['license_id'] = '22';
			}

			// Extras for the package and empty objects for the compostite fields
			let extrasRes = await pool.query("SELECT key, value FROM package_extra WHERE package_id = $1", [packageObj['id']]);
			let contactsObj = {};
			let datesObj = {};
			let moreInfoObj = {};
			let detailsObj = {};

			// Iterate over extras and repackage the composite fields
			extrasRes.rows.forEach(function(packageExtra) {
				if (packageExtra['key'].match(/contacts\:/g)) {
					let keyComponents = packageExtra['key'].split(':');
					if (!contactsObj[keyComponents[1]]) contactsObj[keyComponents[1]] = {};
					if (keyComponents[2] == 'branch') {
						contactsObj[keyComponents[1]]['org'] = packageExtra['value'];
					} else if (keyComponents[2] != 'organization') {
						contactsObj[keyComponents[1]][keyComponents[2]] = packageExtra['value'];
					}
				} else if (packageExtra['key'].match(/dates\:/g)) {
					let keyComponents = packageExtra['key'].split(':');
					if (!datesObj[keyComponents[1]]) datesObj[keyComponents[1]] = {};
					datesObj[keyComponents[1]][keyComponents[2]] = packageExtra['value'];
				} else if (packageExtra['key'].match(/more_info\:/g)) {
					let keyComponents = packageExtra['key'].split(':');
					if (!moreInfoObj[keyComponents[1]]) moreInfoObj[keyComponents[1]] = {};
					if (keyComponents[2] == 'link') {
						moreInfoObj[keyComponents[1]]['url'] = packageExtra['value'];
					} else {
						moreInfoObj[keyComponents[1]][keyComponents[2]] = packageExtra['value'];
					}
				} else if (packageExtra['key'].match(/details\:/g)) {
					let keyComponents = packageExtra['key'].split(':');
					if (!detailsObj[keyComponents[1]]) detailsObj[keyComponents[1]] = {};
					if (keyComponents[2] == 'branch') {
						detailsObj[keyComponents[1]]['org'] = packageExtra['value'];
					} else if (keyComponents[2] != 'organization') {
						detailsObj[keyComponents[1]][keyComponents[2]] = packageExtra['value'];
					}
				} else {
					packageExtras[packageExtra['key']] = packageExtra['value'];
				}
			});

			// Repeating fields need to be moved to arrays
			packageExtras['contacts'] = [];
			for (const key in contactsObj) {
				packageExtras['contacts'].push(contactsObj[key]);
			}

			packageExtras['dates'] = [];
			let hasCreatedDate = false;

			for (const key in datesObj) {
				packageExtras['dates'].push(datesObj[key]);

				if (datesObj[key]['type'] === 'Created') {
					hasCreatedDate = true;
				}
			}

			// Most webservices and applications did not have created dates, but this is now a required field
			if (!hasCreatedDate && (resourceType == 'webservice' ||  resourceType ===  'application')) {
				packageExtras['dates'].push({"type": "Created", "date": packageExtras['record_create_date']});
			}

			packageExtras['more_info'] = [];
			for (const key in moreInfoObj) {
				packageExtras['more_info'].push(moreInfoObj[key]);
			}

			// Setup composite fields that are moving to resource level
			let details = [];
			for (const key in detailsObj) {
				details.push(detailsObj[key]);
			}
			let geographicExtent;
			if ('north_bound_latitude' in packageExtras || 'south_bound_latitude' in packageExtras
					|| 'east_bound_longitude' in packageExtras || 'west_bound_longitude' in packageExtras) {
				geographicExtent = {
					north_bound_latitude: packageExtras['north_bound_latitude'] || '',
					south_bound_latitude: packageExtras['south_bound_latitude'] || '',
					east_bound_longitude: packageExtras['east_bound_longitude'] || '',
					west_bound_longitude: packageExtras['west_bound_longitude'] || ''
				};

				delete packageExtras['north_bound_latitude'];
				delete packageExtras['south_bound_latitude'];
				delete packageExtras['east_bound_longitude'];
				delete packageExtras['west_bound_longitude'];
			}
			let previewInformation;
			if ('preview_latitude' in packageExtras || 'preview_longitude' in packageExtras
					|| 'preview_map_service_url' in packageExtras || 'preview_zoom_level' in packageExtras
					|| 'preview_image_url' in packageExtras || 'link_to_imap' in packageExtras
					|| 'layer_name' in packageExtras || 'image_url' in packageExtras) {
				previewInformation = {
					preview_latitude: packageExtras['preview_latitude'] || '',
					preview_longitude: packageExtras['preview_longitude'] || '',
					preview_map_service_url: packageExtras['preview_map_service_url'] || '',
					preview_zoom_level: packageExtras['preview_zoom_level'] || '',
					preview_image_url: packageExtras['preview_image_url'] || '',
					link_to_imap: packageExtras['link_to_imap'] || '',
					layer_name: packageExtras['layer_name'] || '',
					image_url: packageExtras['image_url'] || ''
				};

				delete packageExtras['preview_latitude'];
				delete packageExtras['preview_longitude'];
				delete packageExtras['preview_map_service_url'];
				delete packageExtras['preview_zoom_level'];
				delete packageExtras['preview_image_url'];
				delete packageExtras['link_to_imap'];
				delete packageExtras['layer_name'];
				delete packageExtras['image_url'];
			}

			// Resources query and setting empty objects for composite fields
			let resourceRes = await pool.query("SELECT * from resource WHERE package_id = $1", [packageObj['id']]);
			let temporalExtent = {};

			// Iterate over resources and assign relevant fields to an object
			resourceRes.rows.forEach(function(resource) {
				resource['extras'] = JSON.parse(resource['extras']) || {};
				if ('data_collection_start_date' in resource['extras']) {
					temporalExtent['beginning_date'] = resource['extras']['data_collection_start_date'];
				}
				if ('data_collection_end_date' in resource['extras']) {
					temporalExtent['end_date'] = resource['extras']['data_collection_end_date'];
				}
				delete resource['extras']['data_collection_start_date'];
				delete resource['extras']['data_collection_end_date'];

				if (details.length > 0) {
					resource['extras']['details'] = JSON.stringify(details);
				}
				resource['extras']['temporal_extent'] = JSON.stringify(temporalExtent);
				if (proj_name[resource['extras']['projection_name']]) resource['extras']['projection_name'] = proj_name[resource['extras']['projection_name']];
				renameFieldIfExists(resource['extras'], 'resource_storage_access_method', 'resource_access_method', f => f.toLowerCase());
				if (resource['extras']['resource_storage_location']) resource['extras']['resource_storage_location'] = resource['extras']['resource_storage_location'].toLowerCase();
				if (resource['extras']['resource_storage_location'] === 'bcgw datastore') resource['extras']['resource_storage_location'] = 'bc geographic warehouse';
								
				renameFieldIfExists(resource['extras'], 'supplemental_info', 'supplemental_information');
				renameFieldIfExists(resource['extras'], 'edc_resource_type', 'resource_type', f => f.toLowerCase());
				moveFieldIfExists(resource['extras'], resource, 'resource_type');
				delete resource['extras']['resource_type'];

				// Information was duplicated in package.type which is now available as resource.extras.bcdc_type
				delete resource['extras']['type'];
				
				resources.push(resource);
			});

			// Iterate over resource objects and add in package fields that are moving a level
			resources.forEach(async function(resource) {
				let resourceId = resource['id'];
				delete resource['id'];

				// Moving WMS and KML resources to type webservice
				let makeService = (resourceType === 'geographic' && (resource['name'] === 'WMS getCapabilities request' || resource['name'] === 'KML Network Link'));
				if (resourceType) resource['extras']['bcdc_type'] = makeService ? 'webservice' : resourceType;

				// Moving geographic data from the package level to the resource level
				if (resourceType === 'geographic') {
					if (previewInformation) resource['extras']['preview_info'] = JSON.stringify(previewInformation);
					if (geographicExtent) resource['extras']['geographic_extent'] = JSON.stringify(geographicExtent);
					renameFieldIfExists(packageExtras, 'iso_topic_string', 'iso_topic_category', f => JSON.stringify(f.split(',')));
					moveFieldIfExists(packageExtras, resource['extras'], 'iso_topic_category');
					moveFieldIfExists(packageExtras, resource['extras'], 'object_name');
					moveFieldIfExists(packageExtras, resource['extras'], 'object_short_name');
					moveFieldIfExists(packageExtras, resource['extras'], 'object_table_comments');
					moveFieldIfExists(packageExtras, resource['extras'], 'spatial_datatype');
				}

				// Set sane defaults for required resource fields with missing
				if (resource['description'] === '' || resource['description'] === null) {
						resource['description'] = 'Description not provided.';
				}
				if (!('resource_update_cycle' in resource['extras'])) {
					resource['extras']['resource_update_cycle'] = 'asNeeded';
				}
				if (resource['format']) {
					resource['format'] = resource['format'].toLowerCase();

					switch (resource['format']) {
						case 'arcview shape':
						case 'shape':
							resource['format'] = 'shp';
							break;
						case 'geodatabase_file':
						case 'esri file geodatabase':
							resource['format'] = 'fgdb';
							break;
						case 'text':
							resource['format'] = 'txt';
							break;
					}
				} else {
					resource['format'] = 'other'
				}

				// Webservices and applications did not have a resource_access_method
				if (resource['extras']['bcdc_type'] === 'webservice') {
					resource['extras']['resource_access_method'] = 'service';
				} else if(resource['extras']['bcdc_type'] === 'application') {
					resource['extras']['resource_access_method'] = 'application';
				}

				if (resource['resource_type'] === '' || resource['resource_type'] === null) {
					resource['resource_type'] = 'data';
				}

				if (makeService) resource['extras']['resource_storage_location'] = 'bc geographic warehouse';
				if (resourceType === 'geographic' && resource['name'] === 'BC Geographic Warehouse Custom Download') resource['extras']['resource_storage_location'] = 'bc geographic warehouse';
				if (resourceType === 'webservice' || resourceType === 'application') {
					resource['extras']['resource_storage_location'] = 'na';
				}

				if (!('resource_access_method' in resource['extras'])) {
					resource['extras']['resource_access_method'] = 'direct access';
				}
				if (!('projection_name' in resource['extras']) && resourceType === 'geographic' && !makeService && resource['state'] != 'deleted') {
					resource['extras']['projection_name'] = 'unknown';
				}
				if (!('spatial_datatype' in resource['extras']) && resourceType === 'geographic' && !makeService) {
					resource['extras']['spatial_datatype'] = 'NA';
				}
				if (!('iso_topic_category' in resource['extras']) && resourceType === 'geographic' && !makeService) {
					resource['extras']['iso_topic_category'] = JSON.stringify(['unknown']);
				}
				resource['extras']['json_table_schema'] = '{}';

				// Update resource
				const query = ['UPDATE resource'];
				query.push('SET');

				const set = [];
				const values = [];
				Object.entries(resource).forEach(function([key, value], i) {
					set.push(key + ' = $' + (i + 1));
					values.push(value);
				});
				query.push(set.join(', '));

				query.push(`WHERE id = '${resourceId}'`);

				await pool.query(query.join(' '), values);

			});

			// Assign sane defaults in package extras to required fields if values are missing
			if (!('edc_state' in packageExtras)) {
				packageExtras['edc_state'] = 'DRAFT';
			}
			if (!('resource_status' in packageExtras)) {
				packageExtras['resource_status'] = 'onGoing';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'resource_status', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['resource_status'], packageObj['revision_id'], uuidv4()]);
			}
			if (packageExtras['resource_status'] === 'obsolete' && !('replacement_record' in packageExtras)) {
				packageExtras['replacement_record'] = null;
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'replacement_record', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['replacement_record'], packageObj['revision_id'], uuidv4()]);
			}
			if (packageExtras['resource_status'] === 'historical_archive' && !('retention_expiry_date' in packageExtras)) {
				packageExtras['retention_expiry_date'] = null;
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'retention_expiry_date', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['retention_expiry_date'], packageObj['revision_id'], uuidv4()]);
			}
			if (packageExtras['resource_status'] === 'historical_archive' && !('source_data_path' in packageExtras)) {
				packageExtras['source_data_path'] = null;
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'source_data_path', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['source_data_path'], packageObj['revision_id'], uuidv4()]);
			}
			if (!('view_audience' in packageExtras)) {
				packageExtras['view_audience'] = 'Government';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'view_audience', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['view_audience'], packageObj['revision_id'], uuidv4()]);
			}
			if (!('metadata_visibility' in packageExtras)) {
				packageExtras['metadata_visibility'] = 'Public';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'metadata_visibility', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['metadata_visibility'], packageObj['revision_id'], uuidv4()]);
			}
			if (!('download_audience' in packageExtras)) {
				packageExtras['download_audience'] = 'Not downloadable';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'download_audience', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['download_audience'], packageObj['revision_id'], uuidv4()]);
			}
			if (!('security_class' in packageExtras)) {
				//packageExtras['security_class'] = 'LOW-PUBLIC';
				packageExtras['security_class'] = 'PUBLIC';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'security_class', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['security_class'], packageObj['revision_id'], uuidv4()]);
			}else{
				switch(packageExtras['security_class'].toUpperCase()){
					case "LOW-SENSITIVITY":
						packageExtras['security_class'] = 'PROTECTED A';
						break;

					case "MEDIUM-SENSITIVITY":
						packageExtras['security_class'] = 'PROTECTED B';
						break;

					case "MEDIUM-PERSONAL":
						packageExtras['security_class'] = 'PROTECTED B';
						break;

					case "HIGH-CABINET":
						packageExtras['security_class'] = 'PROTECTED C';
						break;
					
					case "HIGH-CONFIDENTIAL":
						packageExtras['security_class'] = 'PROTECTED C';
						break;

					case "HIGH-SENSITIVITY":
						packageExtras['security_class'] = 'PROTECTED C';
						break;

					case "LOW-PUBLIC":
						packageExtras['security_class'] = 'PUBLIC';

					default:
						throw `Package with missing/invalid security_class: ${packageObj['id']}`;
				}
				await pool.query("UPDATE package_extra set value=$1 WHERE package_id=$2 AND key=$3", [packageExtras['security_class'], packageObj['id'], 'security_class']);
			}

			// Update package extras by inserting new values
			let extrasUpdateSQL = "INSERT INTO package_extra (id, package_id, key, value, revision_id, state) "
					+ "VALUES ($7, $1, 'contacts', $2, $6, 'active'), "
					+ "($8, $1, 'dates', $3, $6, 'active'), "
					+ "($9, $1, 'more_info', $4, $6, 'active'), "
					+ "($10, $1, 'publish_state', $5, $6, 'active')";

			let extrasUpdateValues = [
				packageObj['id'], //1
				JSON.stringify(packageExtras['contacts']),//2
				JSON.stringify(packageExtras['dates']),//3
				JSON.stringify(packageExtras['more_info']),//4
				packageExtras['edc_state'],//5
				packageObj['revision_id'],//6
				uuidv4(),//7
				uuidv4(),//8
				uuidv4(),//9
				uuidv4()//10
			]
			await pool.query(extrasUpdateSQL, extrasUpdateValues);

			// Delete all keys that have been migrated/renamed in package_extra
			const packageKeys = "('" + Object.keys(packageExtras).join("', '") + "')";

			await pool.query("DELETE FROM package_extra_revision WHERE package_id = $1 AND key NOT IN " + packageKeys, [packageObj['id']]);
			await pool.query("DELETE FROM package_extra WHERE package_id = $1 AND key NOT IN " + packageKeys, [packageObj['id']]);

			// Update package
			await pool.query("UPDATE package set type = 'bcdc_dataset' WHERE id = $1", [packageObj['id']]);
			// console.log('Finished with Package: ', packageObj['name']);
		}
		process.stdout.write("Done! ¯\\_(ツ)_/¯\n");
		// console.log('All Finished ¯\\_(ツ)_/¯');
		process.exit();
	} catch(err) {
		console.log(err.stack);
	}
}

main();

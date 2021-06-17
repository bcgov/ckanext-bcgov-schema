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
};

const extra_keys = "("
	+ "'publish_state', "
	+ "'purpose', "
	+ "'lineage_statement', "
	+ "'data_quality', "
	+ "'more_info', "
	+ "'contacts', "
	+ "'dates', "
	+ "'resource_status', "
	+ "'replacement_record', "
	+ "'retention_exipry_date', "
	+ "'source_data_path', "
	+ "'view_audience', "
	+ "'metadata_visibility', "
	+ "'download_audience', "
	+ "'security_class',"
	+ "'record_publish_date',"
	+ "'record_create_date',"
	+ "'record_archive_date',"
	+ "'record_last_modified'"
	+ ")";

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
			if (!('name' in packageObj)) {
				packageObj['name'] = packageObj['id'];
			}
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
					else if (keyComponents[2] != 'organization') {
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
			for (const key in datesObj) {
				packageExtras['dates'].push(datesObj[key]);
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
			}

			// Resources query and setting empty objects for composite fields
			let resourceRes = await pool.query("SELECT * from resource WHERE package_id = $1", [packageObj['id']]);
			let temporalExtent = {};

			// Iterate over resources and assign relevant fields to an object
			resourceRes.rows.forEach(function(resource) {
				let extraObj = JSON.parse(resource['extras']);
				if (extraObj == null ) extraObj = {};
				//extraObj['id'] = resource['id'];
				//extraObj['name'] = resource['name'];
				if ('data_collection_start_date' in extraObj) {
					temporalExtent['beginning_date'] = extraObj['data_collection_start_date'];
				}
				if ('data_collection_end_date' in extraObj) {
					temporalExtent['end_date'] = extraObj['data_collection_end_date'];
				}
				if (details.length > 0) {
					resource['details'] = JSON.stringify(details);
				}
				resource['temporal_extent'] = JSON.stringify(temporalExtent);
				if (proj_name[extraObj['projection_name']]) resource['projection_name'] = proj_name[extraObj['projection_name']];
				if (extraObj['resource_storage_access_method']) resource['resource_storage_access_method'] = extraObj['resource_storage_access_method'].toLowerCase();
				if (extraObj['resource_storage_location']) resource['resource_storage_location'] = extraObj['resource_storage_location'] == 'BCGW Datastore' ? 'bc geographic warehouse' : extraObj['resource_storage_location'].toLowerCase();
				delete extraObj['data_collection_start_date'];
				delete extraObj['data_collection_end_date'];
				
				resources.push(resource);
			});

			// Iterate over resource objects and add in package fields that are moving a level
			resources.forEach(async function(resource) {
				let resourceId = resource['id'];
				delete resource['id'];
				let resourceName = resource['name'];
				delete resource['name'];
				let makeService = (resourceType === 'geographic' && (resourceName === 'WMS getCapabilities request' || resourceName === 'KML Network Link'));
				if (resourceType) resource['bcdc_type'] = makeService ? 'webservice' : resourceType;
				if (previewInformation && !makeService) resource['preview_info'] = JSON.stringify(previewInformation);
				if (geographicExtent && !makeService) resource['geographic_extent'] = JSON.stringify(geographicExtent);
				if (packageExtras['iso_topic_string'] && !makeService) resource['iso_topic_category'] = JSON.stringify(packageExtras['iso_topic_string'].split(','));
				if (packageExtras['object_name'] && !makeService) resource['object_name'] = packageExtras['object_name'];
				if (packageExtras['object_short_name'] && !makeService) resource['object_short_name'] = packageExtras['object_short_name'];
				if (packageExtras['object_table_comments'] && !makeService) resource['object_table_comments'] = packageExtras['object_table_comments'];
				if (packageExtras['spatial_datatype'] && !makeService) resource['spatial_datatype'] = packageExtras['spatial_datatype'];

				if (makeService) {
					if (resource['projection_name']) delete resource['projection_name'];
					if (resource['details']) delete resource['details'];
				}

				// Set sane defaults for required resource fields with missing
				if ( (!('resource_description' in resource)) || (resource.resource_description === '') ){
					if ('description' in resource){
						resource['resource_description'] =  resource['description']
					}else{
						resource['resource_description'] = 'Description not provided.';
					}
				}
				if (!('resource_update_cycle' in resource)) {
					resource['resource_update_cycle'] = 'asNeeded';
				}
				if (!('resource_storage_format' in resource)) {
					if (resource['format'] !== '') resource['resource_storage_format'] = resource['format'];
					else resource['resource_storage_format'] = 'other';
				}
				if (!('resource_type' in resource)) {
					resource['resource_type'] = 'data';
				}else if (resource.resource_type === null){
					resource['resource_type'] = 'data';
				}
				if (makeService) resource['resource_storage_location'] = 'web or ftp site';
				if (resourceType === 'geographic' && resourceName === 'BC Geographic Warehouse Custom Download') resource['resource_storage_location'] = 'bc geographic warehouse';
				if (!('resource_storage_location' in resource)) {
					if (resourceType === 'document') resource['resource_storage_location'] = 'catalogue data store';
					else if (resourceType === 'geographic' && !makeService) resource['resource_storage_location'] = 'bc geographic warehouse';
					else resource['resource_storage_location'] = 'web or ftp site';
				}
				if (!('resource_access_method' in resource)) {
					resource['resource_access_method'] = 'direct access';
				}
				if (!('projection_name' in resource) && resourceType === 'geographic' && !makeService) {
					resource['projection_name'] = 'epsg3005';
				}
				if (!('spatial_datatype' in resource) && resourceType === 'geographic' && !makeService) {
					resource['spatial_datatype'] = 'SDO_GEOMETRY';
				}
				if (!('iso_topic_category' in resource) && resourceType === 'geographic' && !makeService) {
					resource['iso_topic_category'] = JSON.stringify(['unknown']);
				}
				resource['json_table_schema'] = '{}';

				let extraString = JSON.stringify(resource);
				// Update resource
				await pool.query("UPDATE resource SET extras = $1 WHERE id = $2", [extraString, resourceId]);
			});

			// Assign sane defaults in package extras to required fields if values are missing
			if (!('edc_state' in packageExtras)) {
				packageExtras['edc_state'] = 'DRAFT';
			}
			if (!('resource_status' in packageExtras)) {
				packageExtras['resource_status'] = 'underDevelopment';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'resource_status', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['resource_status'], packageObj['revision_id'], uuidv4()]);
			}
			if (packageExtras['resource_status'] === 'obsolete' && !('replacement_record' in packageExtras)) {
				packageExtras['replacement_record'] = 'Not Set. This needs to be updated';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'replacement_record', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['replacement_record'], packageObj['revision_id'], uuidv4()]);
			}
			if (packageExtras['resource_status'] === 'historical_archive' && !('retention_expiry_date' in packageExtras)) {
				packageExtras['retention_expiry_date'] = '1066-10-14';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'retention_expiry_date', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['retention_expiry_date'], packageObj['revision_id'], uuidv4()]);
			}
			if (packageExtras['resource_status'] === 'historical_archive' && !('source_data_path' in packageExtras)) {
				packageExtras['source_data_path'] = 'Not Set. This needs to be updated';
				await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state)" +
									"VALUES ($4, $1, 'source_data_path', $2, $3, 'active')", 
									[packageObj['id'], packageExtras['source_data_path'], packageObj['revision_id'], uuidv4()]);
			}
			if (!('view_audience' in packageExtras)) {
				packageExtras['view_audience'] = 'Public';
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
				packageExtras['download_audience'] = 'Public';
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

					default:
						packageExtras['security_class'] = 'PUBLIC';
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

			await pool.query("DELETE FROM package_extra_revision WHERE package_id = $1 AND key NOT IN " + extra_keys, [packageObj['id']]);
			await pool.query("DELETE FROM package_extra WHERE package_id = $1 AND key NOT IN " + extra_keys, [packageObj['id']]);

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

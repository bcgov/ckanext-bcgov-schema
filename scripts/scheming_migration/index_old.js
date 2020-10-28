const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER ? process.env.DB_USER : 'ckan',
  host: process.env.DB_HOST ? process.env.DB_HOST : '127.0.0.1',
  database: process.env.DB_NAME ? process.env.DB_NAME : 'ckan',
  password: process.env.DB_PASS ? process.env.DB_PASS : 'ckan',
  port: process.env.DB_PORT ? process.env.DB_PORT : 5432,
});
pool.connect();

async function main() {
	try {
		let res = await pool.query('SELECT * FROM package');
		for (let package of res.rows) {
			console.log("Updating package: ", package['name']);
			let packageExtras = {};
			let resources = [];
			let resourceType = package['type'].toLowerCase();

			let extrasRes = await pool.query("SELECT key, value FROM package_extra WHERE package_id = $1", [package['id']]);
			let contactsObj = {};
			let datesObj = {};
			let moreInfoObj = {};
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
				} else {
					packageExtras[packageExtra['key']] = packageExtra['value'];
				}
			});
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
			let resourceRes = await pool.query("SELECT extras, id from resource WHERE package_id = $1", [package['id']]);
			let temporalExtent = {};
			resourceRes.rows.forEach(function(resource) {
				let extraObj = JSON.parse(resource['extras']);
				if (extraObj == null ) extraObj = {};
				extraObj['id'] = resource['id'];
				if ('data_collection_start_date' in extraObj) {
					temporalExtent['beginning_date'] = extraObj['data_collection_start_date'];
				}
				if ('data_collection_end_date' in extraObj) {
					temporalExtent['end_date'] = extraObj['data_collection_end_date'];
				}
				extraObj['temporal_extent'] = temporalExtent;
				delete extraObj['data_collection_start_date'];
				delete extraObj['data_collection_end_date'];
				resources.push(extraObj);
			});
			resources.forEach(async function(resource) {
				let resourceId = resource['id'];
				delete resource['id'];
				if (resourceType) resource['bcdc_type'] = resourceType;
				if (previewInformation) resource['preview_info'] = previewInformation;
				if (geographicExtent) resource['geographic_extent'] = geographicExtent;
				if (packageExtras['iso_topic_string']) resource['iso_topic_string'] = packageExtras['iso_topic_string'];
				if (packageExtras['object_name']) resource['object_name'] = packageExtras['object_name'];
				if (packageExtras['object_short_name']) resource['object_short_name'] = packageExtras['object_short_name'];
				if (packageExtras['object_table_comments']) resource['object_table_comments'] = packageExtras['object_table_comments'];
				if (packageExtras['spatial_datatype']) resource['spatial_datatype'] = packageExtras['spatial_datatype'];
				let extraString = JSON.stringify(resource);
				await pool.query("UPDATE resource SET extras = $1 WHERE id = $2", [extraString, resourceId]);
			});
			await pool.query("INSERT INTO package_extra (id, package_id, key, value, revision_id, state) "
						+ "VALUES (nextval('system_info_id_seq'), $1, 'contacts', $2, $6, 'active'), "
						+ "(nextval('system_info_id_seq'), $1, 'dates', $3, $6, 'active'), "
						+ "(nextval('system_info_id_seq'), $1, 'more_info', $4, $6, 'active'), "
						+ "(nextval('system_info_id_seq'), $1, 'publish_state', $5, $6, 'active')", 
				[
					package['id'], 
					JSON.stringify(packageExtras['contacts']),
					JSON.stringify(packageExtras['dates']),
					JSON.stringify(packageExtras['more_info']),
					packageExtras['edc_state'],
					package['revision_id']
				]);
			await pool.query("UPDATE package set type = 'bcdc_dataset' WHERE id = $1", [package['id']]);
			console.log('Finished with Package: ', package['name']);
		}
		console.log('All Finished ¯\\_(ツ)_/¯');
		process.exit();
	} catch(err) {
		console.log(err.stack);
	}
}

main();

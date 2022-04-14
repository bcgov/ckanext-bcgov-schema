# Schema Changelog

This page supports ckan-ui [Changelog](https://github.com/bcgov/ckan-ui/blob/master/pages/changelog.md#change-log)

|**Audience**|**Description**|
|:---|:---|
| *BCDC Consumers* |Persons who use the published data in accordance to the dataset licence|
| *BCDC Data Providers* | Persons who prepare and publish data in the BC Data Catalogue|
| *BCDC Administrators* | Persons who assist with the publishing/retiring of data in the BC Data Catalogue|

## Table of Contents
+ [**Schema (Field, Label and Value) changes**](#schema-field-label-and-value-changes)
   - [**Schema changes**](#schema-changes)
   - [**Beta Record schema changes**](#beta-record-schema-changes)
   - [**Beta Resource schema changes**](#beta-resource-schema-changes)
      - [**Document/Tabular Data Resource level changes**](#document-and-tabular-data-resource-level-changes)
      - [**Geographic Data Resource level changes**](#geographic-data-resource-level-changes)
      - [**Webservice/API Resource level changes**](#webservice-and-API-resource-level-changes)
      - [**Application Resource level changes**](#application-resource-level-changes)
-----------------------

## Schema (Field, Label and Value) changes
+ **Field Labels** are what are visible in the user interface (UI).
   + No fields were removed from the databse, but some have been removed from the UI. 
+ **Field Names** are what are returned from the API.


## Release details and dates

### [2.1] 18-Apr-22 (Prod)

**Added**
+ Projection `projection_name` ([#56](https://github.com/bcgov/ckanext-bcgov-schema/pull/56))
    + EPSG_3153 - NAD83(CSRS) BC Albers `epsg3153`
+ Resource data last refreshed `last_modified` added to UI ([#54](https://github.com/bcgov/ckanext-bcgov-schema/pull/54))
    +  Currently represents dates for BCGW and BCDC dataset sources 

**Changed**
+ Fields hidden now on only used for BC Geographic Warehouse datasets ([#56](https://github.com/bcgov/ckanext-bcgov-schema/pull/56))
    + Where Resource Storage Location `resource_storage_location` set to 'BC Geographic Warehouse  `bc geographic warehouse` 
        + Object Short Name `object_short_name`
        + Object Table Comments `object_table_comments`
        + Details `details`
+ Object Name `oject_name` now accessible to all resource types. Previously only Geographic ([#56](https://github.com/bcgov/ckanext-bcgov-schema/pull/56))|
+ Updated Help Text to be directed for editors - ? now no longer visible to viewers ([#54](https://github.com/bcgov/ckanext-bcgov-schema/pull/54)) 
+ Updated Labels ([#54](https://github.com/bcgov/ckanext-bcgov-schema/pull/54))
    + Frequency of Resource Update (was Resource Update Cycle) ([#58](https://github.com/bcgov/ckanext-bcgov-schema/pull/58))
    + Replated Links (was More Info) ([#58](https://github.com/bcgov/ckanext-bcgov-schema/pull/58))
    + Title of Web Asset (was Description) ([#58](https://github.com/bcgov/ckanext-bcgov-schema/pull/58))
    + Data Collection Period (was Temporal Extent) ([#54](https://github.com/bcgov/ckanext-bcgov-schema/pull/54))


### Beta Record Level Changes
These changes reflect those that were implimented in the **27-Oct-21** major release.

A Record or main metadata page is defined in CKAN as a Dataset or Package.

Two key changes are that
1. the resource type to define if tabular, geographic, application or webservice has moved from the **Record** or **Package** level to the **Resource** level.
   - In doing this the field _type_ in packages was copied over to a field called _bcdc_type_ in resources.
   - The _type_ field was populated with the same field as this is a core ckan field.
1. _object_name_, associated primarily with BC Geographic Warehouse (BCGW) datasets has moved also to the **Resource** level

**Deleted**
The following are fields which have been deleted from the new schema.

|UI Field Label|Database Field Name|Rational|
|:---|:---|:---|
|Sector|`sector`|Sector is no longer used by Gov|
|Contact Organization| |The parent or Ministry org is no longer captured|

**Change Review**
The following are fields which have been modified in the new schema.

|UI Field Label|Database Field Name|Changes Flag|Database Field Renamed from|Moved from|Values|Repeating or Composite|Comment|
|:---|:---|:---:|:---|:---|:---:|:---:|:---|
|Title|`title`|Y| | | | |A 100 Character limit has been set to match that of the title URL limit|
|URL|`name`|N|
|Published by|`title` or `full_title`|Y| | | | |Ministry level removed from full_title. Review needed on multiple fields with the same value now|
|Description|`notes`|N|
|Licence|`license_id`|N|
||
|Contacts:|`contacts`|Y | | | | Y| |
|Name|`name`|N|
|Email|`email`|N|
|Organization|`org`|Y| branch| | | | |
|Role|`role`|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_record_mgmt_ui.html)| | |
|Displayed|`displayed`|Y|private | | | |
|Name|`name`|N|
||
|Purpose|purpose|N|
|Data Quality|`data_quality`|N|
|Lineage|`lineage_statement`|N|
|Name|`name`|N|
||
|More Info:|`more_info` |Y| | | |Y| |
|Description|`description`|Y| | | | |__NEW*__ |
|URL|`url`|Y|link|
||
|Security Classification|`security_class`|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_record_mgmt_ui.html)| | |
|Who can view this data?|`view_audience`|N|
|Who can download this data?|`download_audience`|N|
|Who can view this record?|`metadata_visibility`|N|
|Keywords|`tag_string`|N|
|State|`publish_state`|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_record_mgmt_ui.html)| | |
|Resource Status|`resource_status`|N|
||
|Record Lifecycle History:|`dates`|Y | | | |Y| |
|Type|`type`|N|
|Date|`date`|N|
||
|Replacement Record|`replacement_record`|
|Retention Expiry Date|`retention_expiry_date`|
|Source Data Path|`source_data_path`|Y| | | | |No longer a mandatory or URL conditional field |

[RETURN TO TOP][1]

### Beta Resource Level Changes

#### Document and Tabular Data Resource Level Changes

**Change Review**
The following are fields which have been modified in the new schema.

|UI Field Label|Database Field Name|Changes Flag|Database Field Renamed from|Moved from|Values|Repeating or Composite|Comment|
|:---|:---|:---:|:---|:---|:---:|:---:|:---|
|Name|name|N|
|Resource|url|N|
|Type|bcdc_type|Y| | Record Level| [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Resource Description|description|N|
|Supplemental Information|supplemental_info|N|
|Resource Update Cycle|resource_update_cycle|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
||
|Temporal Extent|temporal_extent|Y| | | |Y| |
|Beginning Date|beginning_date|Y|data_collection_start_date
|End Date|end_date|Y|data_collection_end_date
||
|Resource Storage Format|format|Y| | Record Level| [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.htmll)| | |
|Resource Storage Location|Resource Storage Location|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Spatial Datatype|spatial_datatype|Y| |Record Level | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| |Reviewing if this is applicable |
|Object Short Name|object_short_name|Y| |Record Level | | |Reviewing if this is applicable |
|Object Table Comments|object_table_comments|Y| |Record Level | | |Reviewing if this is applicable |
||
|Details|details |Y| |Record Level | | Y| Reviewing if these are applicable|
|Column Name|column_name|Y| |Record Level | | | |
|Short Name|short_name|Y| |Record Level | | | |
|Data Type|data_type|Y| |Record Level | | | |
|Data Precision|data_precision|Y| | Record Level| | | |
|Column Comments|column_comments|Y| |Record Level | | | |
||
|JSON Table Schema|json_table_schema|Y| | | | |__NEW*__ |
|Resource Type|resource_type|Y|
|Resource Access Method|resource_access_method|Y|resource_access_storage_method| | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |

[RETURN TO TOP][1]

#### Geographic Data Resource Level Changes

|UI Field Label|Database Field Name|Changes Flag|Database Field Renamed from|Moved from|Values|Repeating or Composite|Comment|
|:---|:---|:---:|:---|:---|:---:|:---:|:---|
|Name|name|N|
|Resource|url|N|
|Type|bcdc_type|Y| |Record Level | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Resource Description|`description`|N|
|Supplemental Information|supplemental_info|N|
|Resource Update Cycle|resource_update_cycle|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
||
|Temporal Extent|temporal_extent|Y| | | |Y| |
|Beginning Date|beginning_date|Y|data_collection_start_date
|End Date|end_date|Y|data_collection_end_date
||
|Resource Storage Format|format|Y| | Record Level|  [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Resource Storage Location|Resource Storage Location|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Spatial Datatype|spatial_datatype|Y| |Record Level |  [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Object Short Name|object_short_name|Y| | Record Level| | | |
|Object Table Comments|object_table_comments|Y| |Record Level | |  | |
||
|Details|details |Y| |Record Level | |  Y| |
|Column Name|column_name|Y| |Record Level | | | |
|Short Name|short_name|Y| |Record Level | | | |
|Data Type|data_type|Y| | Record Level| | | |
|Data Precision|data_precision|Y| |Record Level | | | |
|Column Comments|column_comments|Y| | Record Level| | | |
||
|Projection Name|projection_name|Y|
|JSON Table Schema|json_table_schema|Y| | | | |__NEW*__ |
|ISO Topic Category|iso_topic_category|Y|iso_topic_string |Record Level | | | |
|Resource Type|resource_type|Y|
|Resource Access Method|resource_access_method|Y|resource_access_storage_method| | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
||
|Preview Information:|preview_info|Y| |Record Level | | Y|Map preview opens up from the Preview button |
|Layer Name|layer_name|Y| | Record Level| | | |
|Preview Latitude|preview_latitude|Y| | Record Level| | | |
|Preview Longitude|preview_longitude|Y| |Record Level | | | |
|Preview Map Service URL|preview_map_service_url|Y| |Record Level | | | |
|Preview Zoom Level|preview_zoom_level|Y| |Record Level | | | |
|Image URL|preview_image_url|Y| |Record Level | | | |
|Link to iMap|link_to_imap|Y| |Record Level | | |iMapBC button is visble from the Preview popup|
||
|Geographic Extent|geographic_extent|Y| |Record Level | | Y| |
|North|north_bound_latitude|Y| |Record Level | | | |
|South|south_bound_latitude|Y| |Record Level | | | |
|East|east_bound_longitude|Y| |Record Level | | | |
|West|west_bound_longitude|Y| |Record Level | | | |

[RETURN TO TOP][1]

#### Webservice and API Resource Level Changes

|UI Field Label|Database Field Name|Changes Flag|Database Field Renamed from|Moved from|Values|Repeating or Composite|Comment|
|:---|:---|:---:|:---|:---|:---:|:---:|:---|
|Name|name|N|
|Resource|url|N|
|Type|bcdc_type|Y| | Record Level|  [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Resource Description|description|N|
|Supplemental Information|supplemental_info|Y| | | |  |__NEW*__ |
|Resource Update Cycle|resource_update_cycle|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | __NEW*__ |
||
|Temporal Extent|temporal_extent|Y| | | |Y|__NEW*__ |
|Beginning Date|beginning_date|Y|data_collection_start_date | | | |__NEW*__ |
|End Date|end_date|Y|data_collection_end_date | | | |__NEW*__ |
||
|Resource Storage Format|format|Y| |Record Level |  [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Resource Storage Location|Resource Storage Location|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Spatial Datatype|spatial_datatype|Y| | Record Level|  [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| |Reviewing if this is applicable |
|Object Short Name|object_short_name|Y| |Record Level | | |Reviewing if this is applicable |
|Object Table Comments|object_table_comments|Y| |Record Level | | |Reviewing if this is applicable |
||
|Details|details |Y| |Record Level | |  Y| Reviewing if these are applicable|
|Column Name|column_name|Y| |Record Level | 
|Short Name|short_name|Y| |Record Level |
|Data Type|data_type|Y| |Record Level | 
|Data Precision|data_precision|Y| |Record Level | 
|Column Comments|column_comments|Y| |Record Level |
||
|JSON Table Schema|json_table_schema|Y| | |  | |__NEW*__ |
|Resource Type|resource_type|Y| | | |  |__NEW*__ |
|Resource Access Method|resource_access_method|Y|resource_access_storage_method| | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | __NEW*__ |

[RETURN TO TOP][1]

#### Application Resource Level Changes
A Record or main metadata page is defined in CKAN as a Dataset or Package.

|UI Field Label|Database Field Name|Changes Flag|Database Field Renamed from|Moved from|Values|Repeating or Composite|Comment|
|:---|:---|:---:|:---|:---|:---:|:---:|:---|
|Name|name|N|
|Resource|url|N|
|Type|bcdc_type|Y| |Record Level | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| 
|Resource Description|description|Y| | | | |__NEW*__ |
|Supplemental Information|supplemental_info|Y| | | | |__NEW*__ |
|Resource Update Cycle|resource_update_cycle|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
||
|Temporal Extent|temporal_extent|Y| | | |Y|__NEW*__ |
|Beginning Date|beginning_date|Y|data_collection_start_date | | |Y|__NEW*__ |
|End Date|end_date|Y|data_collection_end_date | | |Y|__NEW*__ |
||
|Resource Storage Format|format|Y| |Record Level | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Resource Storage Location|Resource Storage Location|Y| | | [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| | |
|Spatial Datatype|spatial_datatype|Y| | Record Level| [Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| |Reviewing if this is applicable |
|Object Short Name|object_short_name|Y| |Record Level | | |Reviewing if this is applicable |
|Object Table Comments|object_table_comments|Y| |Record Level | | |Reviewing if this is applicable |
||
|Details|details |Y| | Record Level| | Y| Reviewing if these are applicable|
|Column Name|column_name|Y| |Record Level | | | |
|Short Name|short_name|Y| |Record Level | | | |
|Data Type|data_type|Y| |Record Level | | | |
|Data Precision|data_precision|Y| |Record Level |  | | |
|Column Comments|column_comments|Y| |Record Level | | | |
||
|JSON Table Schema|json_table_schema|Y| | | | |__NEW*__ |
|Resource Type|resource_type|Y|edc_resource_type| | | |__NEW*__ |
|Resource Access Method|resource_access_method|Y|resource_access_storage_method| | |[Y](https://bcgov.github.io/data-publication/pages/dps_bcdc_w_resource_mgmt_ui.html)| |__NEW*__  |

[RETURN TO TOP][1]

[1]: #field-label-and-value-changes

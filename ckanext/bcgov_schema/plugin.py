import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit

from ckanext.bcgov_schema import validators, helpers


class BCGovSchemaPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IValidators)
    plugins.implements(plugins.ITemplateHelpers)

    # IConfigurer
    def update_config(self, config_):
        toolkit.add_template_directory(config_, 'templates')
        toolkit.add_resource('fanstatic', 'bcgov_schema')

    # IValidators
    def get_validators(self):
        return {
            "conditional_required": validators.conditional_required,
            "latitude_validator": validators.latitude_validator,
            "longitude_validator": validators.longitude_validator
        }

    # ITemplateHelpers
    def get_helpers(self):
        return {
            "is_empty": helpers.is_empty,
            "scheming_display_json_value": helpers.scheming_display_json_value
        }

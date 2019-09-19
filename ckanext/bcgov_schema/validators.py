import json

import ckanext.scheming.helpers as sh
import ckan.lib.navl.dictization_functions as df

from ckanext.scheming.validation import scheming_validator
from ckantoolkit import _, get_validator, Invalid
import logging

logger = logging.getLogger(__name__)

StopOnError = df.StopOnError
missing = df.missing


@scheming_validator
def conditional_required(field, schema):
    """Field is required when conditional_field is set to one of conditional_values"""
    def validator(key, data, errors, context):
        value = data[key] or ''
        data[key] = value
        logger.debug("Key: {0}".format(key))
        logger.debug("CR Field: {0}".format(field))
        logger.debug("CR value: {0}".format(value))
        if 'conditional_field' in field and 'conditional_values' in field:
            logger.debug('Found conditionals for {0}'.format(field['field_name']))
            conditional_field = (field['conditional_field'],)
            conditional_values = field['conditional_values']
            logger.debug("CR Field - Field: {0}".format(conditional_field))
            logger.debug("CR Field - Values: {0}".format(conditional_values))
            if conditional_field in data and data[conditional_field] and data[conditional_field] in conditional_values:
                logger.debug('Found conditional active for value: {0}'.format(value))
                if not value:
                    raise Invalid(_('Required when {0} is set to {1}'.format(conditional_field, data[conditional_field])))
    return validator


def _float_validator(key, data, errors, content):
    value = data.get(key, 0.0)

    if isinstance(value, int):
        return float(value)

    if isinstance(value, float):
        return value
    try:
        if value.strip() == '':
            return None
        return float(value)
    except (AttributeError, ValueError), e:
        return None


def latitude_validator(key, data, errors, context):
    """Checks if the given latitude value is a valid positive float number."""

    value = _float_validator(key, data, errors, context)

    if not value or value < 0.0:
        raise Invalid(_('Longitude requires a positive number. Found "%s"') % value)


def longitude_validator(key, data, errors, context):
    """Checks if the given longitude value is a valid negative float number."""

    value = _float_validator(key, data, errors, context)

    if not value or value > 0.0:
        raise Invalid(_('Longitude requires a negative number. Found "%s"') % value)


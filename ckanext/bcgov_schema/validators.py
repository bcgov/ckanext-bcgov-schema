import json

import ckanext.scheming.helpers as sh
import ckan.lib.navl.dictization_functions as df

from ckanext.scheming.validation import scheming_validator
from ckantoolkit import _, get_validator, Invalid
import logging

logger = logging.getLogger(__name__)

StopOnError = df.StopOnError
missing = df.missing

not_empty = get_validator('not_empty')


@scheming_validator
def conditional_required(field, schema):
    """Field is required when conditional_field is set to one of conditional_values"""
    def validator(key, data, errors, context):
        value = data[key]
        logger.debug("CR Field: {0}".format(field))
        logger.debug("CR value: {0}".format(value))
        if 'conditional_field' in field and 'conditional_values' in field:
            conditional_field = field['conditional_field']
            conditional_values = field['conditional_values']
            if conditional_field in data and data[conditional_field] and data[conditional_field] in conditional_values:
                logger.debug("Checking not empty")
                not_empty(value)
        return value

    return validator


def _float_validator(key, data, errors, content):
    value = data.get(key, 0.0)

    if isinstance(value, int) :
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


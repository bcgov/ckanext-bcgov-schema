import ckanext.scheming.helpers as sh
import logging
import json

logger = logging.getLogger(__name__)


def get_form_snippet(field):
    if field['form_snippet']:
        return field['form_snippet']
    elif field['preset']:
        preset = sh.scheming_get_preset(field['preset'])
        if preset['form_snippet']:
            return preset['form_snippet']
    return 'text.html'


def get_display_snippet(field):
    if field['display_snippet']:
        return field['display_snippet']
    elif field['preset']:
        preset = sh.scheming_get_preset(field['preset'])
        if preset['display_snippet']:
            return preset['display_snippet']
    return 'text.html'


def display_contact(composite_value):
    if 'displayed' in composite_value and composite_value['displayed']:
        return True
    elif 'private' in composite_value and composite_value['private']:
        return True
    return False


def parse_bcgw_details(field_name, data):
    """
    Template helper function.
    Get data from BCGW details
    """

    raw_data = data.get(field_name)
    json_data = json.loads(raw_data)

    return json_data


def is_empty(value):
    if value:
        if isinstance(value, unicode):
            try:
                parsed = json.loads(value)
                logger.debug("Type of parsed {0} is {1}".format(parsed, type(parsed)))
                if isinstance(parsed, dict):
                    for val in parsed:
                        if parsed[val]:
                            return False
                    return True
                elif isinstance(value, list):
                    for val in value:
                        if val:
                            return False
                    return True
            except ValueError:
                return False
        elif isinstance(value, dict):
            for val in value:
                if value[val]:
                    return False
            return True
        elif isinstance(value, list):
            for val in value:
                if val:
                    return False
            return True
        return False
    return True


def scheming_display_json_value(value, indent=2):
    """
    Returns the object passed serialized as a JSON string.

    :param value: The object to serialize.
    :returns: The serialized object, or the original value if it could not be
        serialized.
    :rtype: string
    """
    if not value:
        return None
    try:
        return json.dumps(value, indent=indent, sort_keys=True)
    except (TypeError, ValueError):
        return None

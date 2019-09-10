import ckanext.scheming.helpers as sh
import logging


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

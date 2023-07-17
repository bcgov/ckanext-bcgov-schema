import json

import ckanext.scheming.helpers as sh
import ckan.lib.navl.dictization_functions as df

from ckanext.scheming.validation import scheming_validator
from ckantoolkit import _, get_validator, Invalid
import ckan.authz as authz
from ckan.model import (PACKAGE_NAME_MIN_LENGTH, PACKAGE_NAME_MAX_LENGTH)
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


@scheming_validator
def iso_topic_category(field, schema):
    """
    Based on scheming multiple choice but has to support empty values because old UI doesn't let it be not submitted
    and we need to allow it to be empty to support conditional fields
    """
    static_choice_values = None
    if 'choices' in field:
        static_choice_order = [c['value'] for c in field['choices']]
        static_choice_values = set(static_choice_order)

    def validator(key, data, errors, context):
        # if there was an error before calling our validator
        # don't bother with our validation
        if errors[key]:
            return

        value = data[key]
        if value is not missing:
            if isinstance(value, str):
                try:
                    value = json.loads(value)
                except:
                    value = [value]
                
            elif not isinstance(value, list):
                errors[key].append(_('expecting list of strings'))
                return
        else:
            value = []

        choice_values = static_choice_values
        if not choice_values:
            choice_order = [choice['value'] for choice in sh.scheming_field_choices(field)]
            choice_values = set(choice_order)

        selected = set()
        for element in value:
            if element in choice_values:
                selected.add(element)
                continue
            if element is not '':
                errors[key].append(_('unexpected choice "%s"') % element)

        if not errors[key]:
            data[key] = json.dumps([v for v in
                                    (static_choice_order if static_choice_values else choice_order)
                                    if v in selected])

            if field.get('required') and not selected:
                errors[key].append(_('Select at least one'))

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
    except (AttributeError, ValueError) as e:
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

@scheming_validator
def valid_next_state(field, schema):
    """
    Validate that the old state can move to the new state and that 
    the user has permission to do so
    """
    static_choice_values = None
    nextLookup = {}
    initialState = field['startState']
    if 'choices' in field:
        static_choice_order = [c['value'] for c in field['choices']]
        static_choice_values = set(static_choice_order)
        for c in field['choices']:
            if 'validTo' in c:
                nextLookup[c['value']] = c['validTo']

    def validator(key, data, errors, context):
        # if there was an error before calling our validator
        # don't bother with our validation
        if errors[key]:
            return

        model = context['model']
        session = context['session']
        package = context.get('package')
        result = None

        query = session.query(model.PackageExtra)
        if package:
            package_id = package.id
        else:
            package_id = None
        if package_id and package_id is not missing:
            query = query.filter(model.PackageExtra.package_id == package_id)
            query = query.filter(model.PackageExtra.key == key)
            result = query.first()
        
        stateLookup = None
        hasResult = False

        if result is not None and package_id is not None:
            hasResult = True
            if result.value == data[key]:
                return
            stateLookup = nextLookup[result.value]
        else:
            stateLookup = [initialState]
        

        validStates = []
        who = []

        for s in stateLookup:
            validStates.append(s['state'])
            if s['state'] == data[key]:
                who = s['by']

        if data[key] not in validStates:
            e = "Invalid state valid choices are:"
            for s in validStates:
                e = e + " " + s +","
            e = e[0:(len(e)-1)]
            errors[key].append(_(e)) 

        user = context['user']
        user = model.User.get(user)

        user_object = context.get('auth_user_obj')

        sysAdmin = user.sysadmin
        admin = False
        editor = False

        logger.debug('State machine checking permissions')
        owner_org_key = ('owner_org',)
        

        if package is not None and hasattr(package, 'owner_org'):
            logger.debug('Package not none {0} {1} {2}'.format(package.owner_org, user.name, str(user)))
            admin = authz.has_user_permission_for_group_or_org(package.owner_org, user.name, 'admin')
            editor = authz.has_user_permission_for_group_or_org(package.owner_org, user.name, 'update_dataset')
            #editor = authz._has_user_permission_for_groups(user.id, 'update_dataset', [package.owner_org])
        elif owner_org_key in data:
            logger.debug('Owner org in data {0} {1} {2}'.format(data[owner_org_key], user.id, str(user)))
            admin = authz.has_user_permission_for_group_or_org(data[owner_org_key], user.name, 'admin')
            editor = authz.has_user_permission_for_group_or_org(data[owner_org_key], user.name, 'update_dataset')
            
        
        logger.debug('State machine checking permissions S,A,E {0}, {1}, {2}'.format(sysAdmin, admin, editor))
        
            
        hasPermission = False
        if 'sysadmin' in who and sysAdmin:
            hasPermission = True

        if 'admin' in who and admin:
            hasPermission = True
        
        if 'editor' in who and editor:
            hasPermission = True

        logger.debug("State machine has permission? {0} {1}".format(str(who), str(hasPermission)))
        if not hasPermission:
            em = "You lack permission to move to this state, you must be one of"
            for w in who:
                em = em + " " + w + ","
            em = em[0:len(em)-1]
            errors[key].append(_(em))

    return validator

@scheming_validator
def title_validator(field, schema):

    def validator(key, data, errors, context):
        if errors[key]:
            return
        
        model = context['model']
        session = context['session']
        package = context.get('package')

        query = session.query(model.Package.state).filter_by(title=data[key])
        if package:
            package_id = package.id
        else:
            package_id = data.get(key[:-1] + ('id',))
        if package_id and package_id is not missing:
            query = query.filter(model.Package.id != package_id)
        result = query.first()
        if result and result.state != 'DELETED':
            errors[key].append(_('That Title is already in use.'))

        value = data[key]
        if len(value) < PACKAGE_NAME_MIN_LENGTH:
            raise Invalid(
                _('Title "%s" length is less than minimum %s') % (value, PACKAGE_NAME_MIN_LENGTH)
            )
        if len(value) > PACKAGE_NAME_MAX_LENGTH:
            raise Invalid(
                _('Title "%s" length is more than maximum %s') % (value, PACKAGE_NAME_MAX_LENGTH)
            )
        
    return validator

@scheming_validator
def single_value_subfield(field, schema):
    """Specifies that a particular repeating subfields field is only allowed to have one set of sub values"""
    def validator(key, data, errors, context):
        value = data[key]
        if isinstance(value, list) and len(value) > 1:
            raise Invalid(_('Field {0} can only have a single entry'.format(key)))
    return validator
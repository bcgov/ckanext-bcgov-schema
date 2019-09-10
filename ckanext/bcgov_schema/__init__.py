# Copyright  2018, Province of British Columbia
# License: https://github.com/bcgov/ckanext-disqus/blob/master/license

# this is a namespace package
try:
    import pkg_resources

    pkg_resources.declare_namespace(__name__)
except ImportError:
    import pkgutil

    __path__ = pkgutil.extend_path(__path__, __name__)

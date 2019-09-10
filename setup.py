# Copyright  2015, Province of British Columbia 
# License: https://github.com/bcgov/ckanext-bcgov/blob/master/license 
 
from setuptools import setup, find_packages
version = '0.0.1'

setup(
    name='''ckanext-bcgov-schema''',
    version=version,
    description="CKAN Extension - BC Gov Schema.",
    long_description="""
    Extension to provide the schema and required functionality for the BC Data Catalogue
    """,
    classifiers=[],  # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
    keywords='',
    author='Brandon Sharratt',
    author_email='brandon@highwaythreesolutions.com',
    url='',
    license='',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    include_package_data=True,
    install_requires=[
    ],
    entry_points="""
    [ckan.plugins]
    bcgov_schema=ckanext.bcgov_schema.plugin:BCGovSchemaPlugin
    """,
)

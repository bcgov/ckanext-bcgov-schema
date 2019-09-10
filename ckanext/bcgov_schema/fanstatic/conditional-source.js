// Module for broadcasting changes to values that trigger conditional changes
this.ckan.module('conditional-source', function (jQuery, _) {
  return {
    options: {
      name: '',
    },
    initialize: function () {
      if (!jQuery('html').hasClass('ie7')) {
        jQuery.proxyAll(this, /_on/);

        var onChangeFn = this._onChange;
        var sourceField = this.el.find('select');
        sourceField.on('change', onChangeFn);
        sourceField.on('load', onChangeFn);
        this.sandbox.publish(this.options.name, sourceField.val());
      }
    },
    _onChange: function (event) {
      this.sandbox.publish(this.options.name, event.currentTarget.value);
    }
  };
});


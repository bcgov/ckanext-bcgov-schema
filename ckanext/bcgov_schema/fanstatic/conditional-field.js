// Module for rendering scheming fields only when a condition is met
this.ckan.module('conditional-field', function (jQuery, _) {
  return {
    options: {
      conditional_field: '',
      conditional_values: '[]'
    },
    initialize: function () {
      jQuery.proxyAll(this, /_on/);
      this.sandbox.subscribe(this.options.conditional_field, this._onSourceChange);
    },
    teardown: function () {
      this.sandbox.unsubscribe(this.options.conditional_field, this._onSourceChange);
    },
    _onSourceChange: function (val) {
      if (this.options.conditional_values.indexOf(val) > -1) {
        console.log("Showing Element: ", this.el);
        this.el.show();
      }
      else {
        console.log("Hiding Element: ", this.el);
        this.el.hide();
      }
    }
  };
});


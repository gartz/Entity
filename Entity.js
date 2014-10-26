(function (root){
  'use strict';

  var ObjectEventTarget = root.ObjectEventTarget;
  var ObjectEvent = root.ObjectEvent;

  // jshint node:true
  if (typeof global !== 'undefined'){
    ObjectEventTarget = require('ObjectEventTarget').ObjectEventTarget;
    ObjectEvent = require('ObjectEventTarget').ObjectEvent;
  }

  function EntityEvent(type, options){
    // Call super constructor
    ObjectEvent.call(this, type, options);

    // Overload the new attributes
    this.attribute = options.attribute || '';
    this.oldValue = options.hasOwnProperty('oldValue') ? options.oldValue : null;
    this.value = options.hasOwnProperty('value') ? options.value : null;
  }
  EntityEvent.prototype = ObjectEvent.prototype;

  // Named object
  function EntityAttributes(){
    // Empty object/constructor to be used as key value attribute dictionary
  }
  EntityAttributes.prototype = Object.prototype;

  function Entity(){

    // Prototype constructor
    if (!(Entity.prototype instanceof ObjectEventTarget)){

      this.getAttribute = function (name){
        // Get a attribute by the name

        return this.attributes['' + name];
      };

      this.setAttribute = function (name, value){
        // Set an attribute value
        // Events are triggered only if the value is different of current value
        // it's possible to set undefined value, but you should use removeAttribute for that
        //
        // Events:
        // * change: (cancelable) before change the attribute value
        // * changed: when the attribute value has been changed

        if (!name) {
          throw new TypeError('Name must be a non empty string.');
        }
        name = '' + name;
        var oldValue = this.attributes[name];

        if (oldValue === value){
          return;
        }

        // Dispatch the 'change' event
        var changeEvent = new EntityEvent('change', {
          cancelable: true,
          oldValue: oldValue,
          value: value,
          attribute: name
        });
        if (!this.dispatchEvent(changeEvent)) {
          return;
        }
        this.attributes['' + name] = value;

        // After change, dispatch the 'changed' event
        this.dispatchEvent(new EntityEvent('changed', {
          oldValue: oldValue,
          value: value,
          attribute: name
        }));
      };

      this.removeAttribute = function (name){
        // Remove the attribute, if it has a default value it will be used
        // returns true if the attribute was removed
        //
        // Events:
        // * remove: (cancelable) before remove the attribute
        // * removed: when the attribute has been removed

        if (!this.attributes.hasOwnProperty(name)){
          return false;
        }

        name = '' + name;
        var oldValue = this.attributes[name];

        // Delete before dispatch the event to get the default value from a prototype chain
        delete this.attributes[name];

        var value = this.attributes[name];

        // Dispatch the 'remove' event
        var changeEvent = new EntityEvent('remove', {
          cancelable: true,
          oldValue: oldValue,
          value: value,
          attribute: name
        });
        if (!this.dispatchEvent(changeEvent)) {
          // if the event is cancelled, rollback the delete action
          this.attributes[name] = oldValue;
          return false;
        }

        // After change, dispatch the 'removed' event
        this.dispatchEvent(new EntityEvent('removed', {
          oldValue: oldValue,
          value: value,
          attribute: name
        }));

        return true;
      };

      // Used to check if is a circular structure when exporting to JSON
      var recursiveJSON = [];

      this.toJSON = function toJSON(){
        // Export the arguments to JSON
        // This method allows you to use `JSON.stringfy( instance )`
        // Will not allow circular structure
        // And it will ignore function and undefined

        if (recursiveJSON.indexOf(this) !== -1){
          recursiveJSON.length = 0;
          throw new TypeError('Converting circular structure to JSON');
        }
        recursiveJSON.push(this);
        var result = {};
        // Export toJSON access all enumerable property, to allow default
        // values inherited by prototypes in EntityAttributes
        //jshint forin:false
        for(var k in this.attributes){
          var property = this.attributes[k];
          if (typeof property === 'object'){
            if (property.toJSON){
              result[k] = property.toJSON();
              continue;
            }
            try{
              result[k] = JSON.parse(JSON.stringify(property));
            }catch(e){
              recursiveJSON.length = 0;
              throw e;
            }
            continue;
          }
          if (typeof property === 'function' || typeof property === 'undefined'){
            continue;
          }
          result[k] = property;
        }
        recursiveJSON.pop();
        return result;
      };

      // Return the prototype instance
      return this;
    }

    // Store the attributes
    this.attributes = new EntityAttributes();
  }
  Entity.prototype = ObjectEventTarget.prototype;
  Entity.prototype = new Entity();

  // Prevent enumerable prototype when supported by the browser
  if (Object.defineProperties){
    var definePropertiesArgs = function (prototype){
      var props = {};
      for (var k in prototype) {
        if (prototype.hasOwnProperty(k)) {
          props[k] = {
            value: prototype[k],
            enumerable: false
          };
        }
      }
      return [prototype, props];
    };

    // Chronometer.prototype remove enumerable prototype
    Object.defineProperties.apply(Object, definePropertiesArgs(Entity.prototype));
  }

  // Expose to global
  if (typeof window === 'undefined'){
    // jshint node:true
    root = global;
  }
  root.Entity = Entity;
  root.EntityEvent = EntityEvent;
  root.EntityAttributes = EntityAttributes;

  // Export as module to nodejs
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
    module.exports = {
      Entity: Entity,
      EntityEvent: EntityEvent,
      EntityAttributes: EntityAttributes
    };
  }
})(this);

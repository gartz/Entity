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

  function Entity(json){

    // Prototype constructor
    if (Entity.prototype.constructor !== Entity){

      this.constructor = Entity;
      var prototype = Entity.prototype;
      this.getPrototype = function () {
        return prototype;
      };

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

        // Cast the value type
        if (this.types && typeof this.types[name] === 'function'){
          value = this.types[name](value);
        }

        if (oldValue === value){
          return;
        }

        // Dispatch the 'change' event
        var changeEvent = new EntityEvent('change', {
          cancelable: true,
          canBubble: true,
          oldValue: oldValue,
          value: value,
          attribute: name
        });
        if (!this.dispatchEvent(changeEvent)) {
          return;
        }

        //TODO: Use a less verbose syntax to add/remove events bubbling
        if (oldValue instanceof Entity){
          // Remove bubbling events from oldValue Entity
          value.removeEventListener('change', this.dispatchEvent);
          value.removeEventListener('changed', this.dispatchEvent);
          value.removeEventListener('remove', this.dispatchEvent);
          value.removeEventListener('removed', this.dispatchEvent);
        }

        // Persist the attribute changing
        this.attributes['' + name] = value;

        if (value instanceof Entity){
          // Add bubbling events
          value.addEventListener('change', this.dispatchEvent);
          value.addEventListener('changed', this.dispatchEvent);
          value.addEventListener('remove', this.dispatchEvent);
          value.addEventListener('removed', this.dispatchEvent);
        }

        // After change, dispatch the 'changed' event
        this.dispatchEvent(new EntityEvent('changed', {
          canBubble: true,
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
          canBubble: true,
          oldValue: oldValue,
          value: value,
          attribute: name
        });
        if (!this.dispatchEvent(changeEvent)) {
          // if the event is cancelled, rollback the delete action
          this.attributes[name] = oldValue;
          return false;
        }

        if (this.attributes[name] !== oldValue && oldValue instanceof Entity){
          // Remove bubbling events from oldValue Entity
          value.removeEventListener('change', this.dispatchEvent);
          value.removeEventListener('changed', this.dispatchEvent);
          value.removeEventListener('remove', this.dispatchEvent);
          value.removeEventListener('removed', this.dispatchEvent);
        }

        // After change, dispatch the 'removed' event
        this.dispatchEvent(new EntityEvent('removed', {
          canBubble: true,
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

      this.parse = function (object){
        // Parse a object into a entity, copying all the properties to the entity attributes
        // Instances of the current constructor won't be parsed

        // Check if the object is a instance of the current Entity
        if (object instanceof this.constructor){
          return object;
        }

        var prop;
        // Remove attributes that isn't in the target object
        for (prop in this.attributes){
          if (!object.hasOwnProperty(prop)){
            this.removeAttribute(prop);
          }
        }
        // Set attributes that is in the target object
        for (prop in object){
          if (object.hasOwnProperty(prop)){
            this.setAttribute(prop, object[prop]);
          }
        }
      };

      this.clone = function (){
        // Returns a clone made from the same constructor instance with the attributes in it

        return new this.constructor(this.attributes);
      };

      // Return the prototype instance
      return this;
    }

    if (Entity.prototype.getPrototype().constructor !== ObjectEventTarget){
      Entity.prototype.getPrototype().constructor.apply(this, arguments);
    }

    // Store the attributes
    this.attributes = new EntityAttributes();

    // Will try to initiate the entity with the passed value
    this.parse(json);
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

    // Remove enumerable prototype
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
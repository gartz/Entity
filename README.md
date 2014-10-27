Entity JS
=========

A Javascript entity with support a events and export toJSON very simple that can be extended using prototype chain.

Motivation
----------

We have tons of libraries that try to work in JS like a Oriented Object language, this is made to work as prototype, what makes it light weight, fast, simple and extensible.

How to use
----------

You can create a new entity,add, change, remove or get attributes and listen for events.

Example:

```Javascript
var myEntity = new Entity();

function logEntityEvents(event){
  console.log(event.type, event.attribute, event);
}

myEntity.addEventListener('change', logEntityEvents);
myEntity.addEventListener('changed', logEntityEvents);
myEntity.addEventListener('remove', logEntityEvents);
myEntity.addEventListener('removed', logEntityEvents);

myEntity.setAttribute('foo', 'bar');
// change foo EntityEvent{/*...*/}
// changed foo EntityEvent{/*...*/}

myEntity.setAttribute('zaz', 'traz');
// change zaz EntityEvent{/*...*/}
// changed zaz EntityEvent{/*...*/}

myEntity.removeAttribute('zaz');
// remove zaz EntityEvent{/*...*/}
// removed zaz EntityEvent{/*...*/}

console.log(myEntity.getAttribute('foo'));
// bar

myEntity.setAttribute('abc', 'cde');
// change abc EntityEvent{/*...*/}
// changed abc EntityEvent{/*...*/}

console.log(JSON.stringify(myEntity));
//{"foo":"bar","abc":"cde"}
```

Constructor
-----------

Accept a *object* to be parsed as attributes from the entity, and will try to load any prototype with `getPrototype` method, that allows to access the super constructor.

Methods
-------

**Public methods:**

* **getAttribute( name )**: Return the attribute content
* **setAttribute( name, value )**: Update the attribute value (if doesn't exist, it will be created)
* **removeAttribute( name )**: Return true if the attribute was removed
* **parse( object )**: Add all the properties in a object as attribute and remove the attributes in the model that isn't present in the object
* **clone()**: Create a new instance with the same attributes of the actual, it will use the constructor method to do it.
* **toJSON()**: Export the Entity to a object that can be stringfy by `JSON.stringfy` method.

**Internal use methods:**

* **constructor()**: Stores the function that was used to construct the object.
* **getPrototype()**: Will expose the prototype instance, to allow super constructors.

Properties
----------

** Read-only properties:

* **attributes**: this object represent the attributes, if you change the attribute here, it will not trigger the events

Events
------

Events are providen by [ObjectEventTarget](https://github.com/gartz/ObjectEventTarget) prototype, means that you can use **addEventListener**, **removeEventListener** or **dispatchEvent** in any instance of *Entity*.

**Cancelable Events:**

* **change**: Dispatched when is about to change a attribute value.
* **remove**: Dispatched when is about to remove a attribute value.

**Non-cancelable Events:**

* **changed**: When the attribute value has changed.
* **removed**: When the attribute value has been removed.

EntityEvent
-----------

This is injected as first argument of any EntityEvent, and has all the properties from *ObjectEvent* and some properties refered to the Entity.

* **attribute**: The name of the attribute that is been manipulated.
* **value**: Will return the value of an attribute change, also if you try to remove the attribute this will have the final value of the operation.
* **oldValue**: The value of the attribute, before any applied change.

Example to filter changes only in a specific attribute:

```Javascript
myEntity.addEventListener('changed', function (event){
  if(event.attribute !== 'foo') return;
  /* my code to be executed only if foo is changed */
});
```

Prototype
---------

To prototype you can call from your new constructor passing your context.

Example:
```Javascript
function FancyEntity( name ){
    Entity.call(this);
    this.name = name;

    // When you are customizing the prototype, the constructor will be overloaded by the prototype
    // Make sure to expose it, to the `clone` method works
    this.constructor = FancyEntity;
}
FancyEntity.prototype = Entity.prototype;
```

Architecture
------------

There is no event for a attribute added to your entity, this happens because a entity is not normalized representation.

Also you can overload the `EntityAttributes` object constructor, creating a default value in the prototype chain, when you do that, if you use the method `removeAttribute` the `getAttribute` will start to return the next value of the attribute in the prototype chain. So if you don't want to return the default value, you need to use `setAttribute` with undefined value.

If your browser has support to `Object.defineProperties`, it will add all methods as not enumerable, if you do a for in, they will not be iterated. But if you plan to give support to IE-9, use hasOwnProperty or a shim to ensure that behaviour.

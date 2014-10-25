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
myEntity.setAttribute('zaz', 'traz');
myEntity.removeAttribute('zaz');
console.log(myEntity.getAttribute('foo'));

myEntity.setAttribute('abc', 'cde');

console.log(JSON.stringify(myEntity));
```

Methods
-------

**Public methods:**

* **getAttribute( name )**: Return the attribute content
* **setAttribute( name, value )**: Update the attribute value (if doesn't exist, it will be created)
* **removeAttribute( name )**: Return true if the attribute was removed

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

Prototype
---------

To prototype you can call from your new constructor passing your context.

Example:
```
function FancyEntity( name ){
    Entity.call(this);
    this.name = name;
}
FancyEntity.prototype = Entity.prototype;
```

Architecture
------------

There is no event for a attribute added to your entity, this happens because a entity is not normalized representation.

Also you can overload the `EntityAttributes` object constructor, creating a default value in the prototype chain, when you do that, if you use the method `removeAttribute` the `getAttribute` will start to return the next value of the attribute in the prototype chain. So if you don't want to return the default value, you need to use `setAttribute` with undefined value.

If your browser has support to `Object.defineProperties`, it will add all methods as not enumerable, if you do a for in, they will not be iterated. But if you plan to give support to IE-9, use hasOwnProperty or a shim to ensure that behaviour.

//-------------------------------------------------------------------- 
// The entityspaces.js JavaScript library v1.0.4-pre 
// Built on Wed 01/11/2012 at 21:19:20.74    
// https://github.com/EntitySpaces/entityspaces.js 
// 
// License: MIT (http://www.opensource.org/licenses/mit-license.php) 
//-------------------------------------------------------------------- 
 
(function(window, undefined) { 
 
 
/*********************************************** 
* FILE: ..\Src\Namespace.js 
***********************************************/ 
﻿window['es'] = {}; //define root namespace

// Google Closure Compiler helpers (used only to make the minified file smaller)
es.exportSymbol = function (publicPath, object) {
    var tokens = publicPath.split(".");
    var target = window;
    for (var i = 0; i < tokens.length - 1; i++)
        target = target[tokens[i]];
    target[tokens[tokens.length - 1]] = object;
};

"use-strict";

var config = window.esConfig || {};

var extend = function (target, source) {
    var prop;

    if (!target || !source) {
        return;
    }

    for (prop in source) {
        target[prop] = source[prop];
    }

    return target;
};

config = extend(config, {
    //defines the namespace where the Business Objects will be stored
    namespace: 'es.objects'
});

//ensure the namespace is built out...
(function () {
    
    var path = config.namespace.split('.');
    var target = window;

    for(var i = 0; i < path.length; i++){
        if(target[path[i]] === undefined){
            target[path[i]] = {};
        }
        target = target[path[i]];
    }

    es.generatedNamespace = target;

}());


es.getGeneratedNamespaceObj = function() {
    return es.generatedNamespace;
};

es.exportSymbol('es', es);
 
 
 
/*********************************************** 
* FILE: ..\Src\Constants.js 
***********************************************/ 
﻿
es.RowState = {
    INVALID: 0,
    UNCHANGED: 2,
    ADDED: 4,
    DELETED: 8,
    MODIFIED: 16
};

es.exportSymbol('es.RowState', es.RowState); 
 
 
/*********************************************** 
* FILE: ..\Src\Core.js 
***********************************************/ 
﻿
//#region TypeCache Methods
es.getType = function (typeName) {
    var ns = es.getGeneratedNamespaceObj();

    return ns[typeName];
};

es.clearTypes = function () {

    es.generatedNamespace = {};

};

//#endregion

//#region Error Handling
es.onError = ko.observable({});
es.onError.subscribe(function (error) {
    throw JSON.stringify(error);
});

//#endregion

//#region Core Quick Methods

es.isArray = function (array) {
    if (!array) { return false; }
    return array.isArray || Object.prototype.toString.call(array) === '[object Array]';
};

es.objectKeys = Object.keys || function(obj) {
    var res = [];
    for (var key in obj) {
        res.push(key);
    }
    return res;
};

es.isEsCollection = function (array) {
    var isEsArray = false;

    if (es.isArray(array)) {

        if (array.length > 0) {
            if (array[0].hasOwnProperty("RowState")) {
                isEsArray = true;
            }
        }

    }
    return isEsArray;
};

//#endregion

es.exportSymbol('es.isEsCollection', es.isEsCollection);

 
 
 
/*********************************************** 
* FILE: ..\Src\utils.js 
***********************************************/ 
﻿/*globals es, ko*/

/// <reference path="../Libs/jquery-1.7.1.js" />
/// <reference path="../Libs/knockout-2.0.0.debug.js" />

var utils = {

    parseJSONDate: function (value) {
        return new Date(parseInt(value.substr(6)))
    },

    copyDataIntoEntity: function (target, source) {
        var prop, srcProp;

        if (!target || !source) {
            return;
        }

        for (prop in target) {

            if (source.hasOwnProperty(prop)) {

                srcProp = source[prop];
//                if( typeof srcProp === "string") {
//                    if (srcProp.indexOf('/Date(') === 0) {
//                        srcProp = utils.parseJSONDate(srcProp);
//                    }
//                }

                if (ko.isObservable(target[prop])) { //set the observable property
                    target[prop](srcProp); // set the observable
                } else {
                    target[prop] = srcProp;
                }
            }
        }

        return target;
    },

    extend: function (target, source) {
        var prop;

        if (!target || !source) {
            return;
        }

        for (prop in source) {
            target[prop] = source[prop];
        }

        return target;
    },

    addPropertyChangedHandlers: function (obj, propertyName) {

        var property = obj[propertyName];
        if (ko.isObservable(property) && !(property instanceof Array) && property.__ko_proto__ !== ko.dependentObservable) {

            // This is the actual PropertyChanged event
            property.subscribe(function () {

                if (obj.ignorePropertyChanged === false) {

                    if (ko.utils.arrayIndexOf(obj.ModifiedColumns(), propertyName) === -1) {

                        if (propertyName !== "RowState") {
                            obj.ModifiedColumns.push(propertyName);

                            if (obj.RowState() !== es.RowState.MODIFIED && obj.RowState() !== es.RowState.ADDED) {
                                obj.RowState(es.RowState.MODIFIED);
                            }
                        }
                    }
                }
            });
        }
    },

    startTracking: function (entity) {

        var propertyName;

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(es.RowState.ADDED);
        } else {
            if (!ko.isObservable(entity.RowState)) {
                entity.RowState = ko.observable(entity.RowState);
            }
        }

        if (!entity.hasOwnProperty("ModifiedColumns")) {
            entity.ModifiedColumns = ko.observableArray();
        } else {
            // Overwrite existing data
            entity.ModifiedColumns = ko.observableArray();
        }

        for (propertyName in entity) {
            if (propertyName !== 'RowState' && propertyName !== "ModifiedColumns" && propertyName !== '__type' && propertyName !== 'esExtendedData') {

                var property = entity[propertyName];

                if (property instanceof Array) {
                    continue;
                }

                if (entity.hasOwnProperty(propertyName) && ko.isObservable(property)) {
                    utils.addPropertyChangedHandlers(entity, propertyName);
                }
            }
        }

        return entity;
    },

    expandExtraColumns: function (entity, shouldMakeObservable) {

        var data, i, ext, makeObservable = arguments[1] || false;

        if (entity.esExtendedData && es.isArray(entity.esExtendedData)) {

            data = ko.isObservable(entity.esExtendedData) ? entity.esExtendedData() : entity.esExtendedData;

            for (i = 0; i < data.length; i++) {

                if (makeObservable) {
                    entity[data[i].Key] = ko.observable(data[i].Value);
                } else {
                    entity[data[i].Key] = data[i].Value;
                }
            }

            delete entity.esExtendedData;
        }

        if (data !== undefined) {

            entity["esExtendedData"] = [];

            for (i = 0; i < data.length; i++) {
                entity.esExtendedData.push(ko.isObservable(data[i].Key) ? data[i].Key() : data[i].Key);
            }
        }

        return entity;
    },

    removeExtraColumns: function (entity) {
        var i, data;

        if (entity.esExtendedData && es.isArray(entity.esExtendedData)) {

            data = ko.isObservable(entity.esExtendedData) ? entity.esExtendedData() : entity.esExtendedData;

            for (i = 0; i < data.length; i++) {
                delete entity[data[i]];
            }
            delete entity.esExtendedData;
        }

        return entity;
    },

    // Private function used by 'getDirtyEntities' below
    // NOTE: This strips out unwanted properties, this method is only to
    //       be used to by getDirtyEntities
    shallowCopy: function (src) {
        if (typeof src === 'object' && src !== null) {
            var dst;

            if (es.isArray(src)) {
                dst = [];
            }
            else if (src instanceof Date) {
                dst = new Date(src);
            }
            else if (src instanceof Boolean) {
                dst = new Boolean(src);
            }
            else if (src instanceof Number) {
                dst = new Number(src);
            }
            else if (src instanceof String) {
                dst = new String(src);
            }
            else if (Object.create && Object.getPrototypeOf) {
                dst = Object.create(Object.getPrototypeOf(src));
            }
            else if (src.__proto__ || src.constructor.prototype) {
                var proto = src.__proto__ || src.constructor.prototype || {};
                var T = function () { };
                T.prototype = proto;
                dst = new T;
                if (!dst.__proto__) { dst.__proto__ = proto; }
            }

            ko.utils.arrayForEach(es.objectKeys(src), function (key) {
                if (!es.isEsCollection(src[key])) {

                    switch (key) {
                        case '___esEntity___':
                        case 'esTypeDefs':
                        case 'routes':
                        case 'ignorePropertyChanged':
                            break;
                        default:
                            dst[key] = src[key];
                            break;
                    }
                }
            });
            return dst;
        } else {
            return src;
        }
    },

    getDirtyGraph: function (obj) {

        var i, k, dirty, paths = [], root = null;

        es.Visit(obj).forEach(function (theObj) {

            if (this.key === "esExtendedData") {
                this.block();
            } else {

                if (this.isLeaf === false) {

                    if (theObj instanceof Array) { return theObj; }

                    if (theObj.hasOwnProperty("RowState")) {

                        switch (theObj.RowState) {

                            case es.RowState.ADDED:
                            case es.RowState.DELETED:
                            case es.RowState.MODIFIED:

                                paths.push(this.path);
                                break;
                        }
                    }
                }
            }

            return theObj;
        });

        //#region Rebuild tree of dirty objects from "paths[]"
        if (paths.length > 0) {

            if (es.isArray(obj)) {
                dirty = [];
            } else {
                dirty = utils.shallowCopy(utils.removeExtraColumns(obj));
            }

            root = dirty;

            for (i = 0; i < paths.length; i++) {

                var thePath = paths[i];
                var data = obj;
                dirty = root;

                for (k = 0; k < thePath.length; k++) {

                    if (!dirty.hasOwnProperty(thePath[k])) {

                        if (es.isArray(data[thePath[k]])) {
                            dirty[thePath[k]] = [];
                            dirty = dirty[thePath[k]];
                        }
                    } else {
                        dirty = dirty[thePath[k]];
                    }

                    data = data[thePath[k]];
                }

                data = utils.removeExtraColumns(data);

                if (es.isArray(dirty)) {
                    dirty.push(utils.shallowCopy(data));
                } else {
                    dirty = utils.shallowCopy(data);
                }
            }
        }
        //#endregion Save

        return root;
    }
};

utils.newId = (function () {
    var seedId = new Date().getTime();

    return function () {
        return ++seedId;
    };

} ());

es.utils = utils;

es.exportSymbol('es.extend', es.extend);
es.exportSymbol('es.startTracking', es.startTracking);
es.exportSymbol('es.getDirtyGraph', es.getDirtyGraph); 
 
 
/*********************************************** 
* FILE: ..\Src\Visitor.js 
***********************************************/ 
﻿
es.Visit = function (obj) {
    if (!(this instanceof es.Visit)) {
        return new es.Visit(obj);
    }
    this.value = obj;
};

es.Visit.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

var walk = function(root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;

    var forEach = function (xs, fn) {
        if (xs.forEach) return xs.forEach(fn)
        else for (var i = 0; i < xs.length; i++) {
            fn(xs[i], i, xs);
        }
    };

    return (function walker(node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};

        var keepGoing = true;

        var state = {
            node: node,
            node_: node_,
            path: [].concat(path),
            parent: parents[parents.length - 1],
            parents: parents,
            key: path.slice(-1)[0],
            isRoot: path.length === 0,
            level: path.length,
            circular: null,
            update: function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) { keepGoing = false; }
            },
            'delete': function (stopHere) {
                delete state.parent.node[state.key];
                if (stopHere) { keepGoing = false; }
            },
            remove: function (stopHere) {
                if (es.isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                } else {
                    delete state.parent.node[state.key];
                }
                if (stopHere) { keepGoing = false; }
            },
            keys: null,
            before: function (f) { modifiers.before = f; },
            after: function (f) { modifiers.after = f; },
            pre: function (f) { modifiers.pre = f; },
            post: function (f) { modifiers.post = f; },
            stop: function () { alive = false; },
            block: function () { keepGoing = false; }
        };

        if (!alive) { return state; }

        if (typeof node === 'object' && node !== null) {
            state.keys = es.objectKeys(node);

            state.isLeaf = state.keys.length === 0;

            for (var i = 0; i < parents.length; i++) {
                if (parents[i].node_ === node_) {
                    state.circular = parents[i];
                    break;
                }
            }
        }
        else {
            state.isLeaf = true;
        }

        state.notLeaf = !state.isLeaf;
        state.notRoot = !state.isRoot;

        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);

        if (modifiers.before) modifiers.before.call(state, state.node);

        if (!keepGoing) return state;

        if (typeof state.node === 'object' && state.node !== null && !state.circular) {
            parents.push(state);

            forEach(state.keys, function (key, i) {
                path.push(key);

                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);

                var child = walker(state.node[key]);
                if (immutable && Object.hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }

                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;

                if (modifiers.post) modifiers.post.call(state, child);

                path.pop();
            });
            parents.pop();
        }

        if (modifiers.after) modifiers.after.call(state, state.node);

        return state;
    })(root).node;
};



 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\EsEntity.js 
***********************************************/ 
﻿/*globals es */
/// <reference path="../Libs/jquery-1.7.1.js" />
/// <reference path="../Libs/json2.js" />
/// <reference path="../Libs/knockout-2.0.0.debug.js" />
/// <reference path="../Constants.js" />
/// <reference path="../Namespace.js" />
/// <reference path="../Utils.js" />


es.EsEntity = function () { //empty constructor
    var self, //is only set when we call 'init'
        noop = function () { },
        extenders = [];

    this.ignorePropertyChanged = false;

    //#region Initialization Logic
    this.routes = {};

    this.customize = function (extender) {
        extenders.push(extender);
        return this;
    };

    this.init = function () {
        self = this;

        self['___esEntity___'] = es.utils.newId(); // assign a unique id so we can test objects with this key, do equality comparison, etc...

        //start change tracking
        es.utils.startTracking(self)

        // before populating the data, call each extender to add the required functionality to our object        
        ko.utils.arrayForEach(extenders, function (extender) {

            if (extender) {
                //Make sure to set the 'this' properly by using 'call'
                extender.call(self);
            }
        });
    };

    this.populateEntity = function (data) {
        var prop, EntityCtor, entityProp;

        self.ignorePropertyChanged = true;

        try {
            //populate the entity with data back from the server...
            es.utils.copyDataIntoEntity(self, data);

            //expand the Extra Columns
            es.utils.expandExtraColumns(self, true);

            for (prop in data) {
                if (data.hasOwnProperty(prop)) {

                    if (this.esTypeDefs && this.esTypeDefs[prop]) {
                        EntityCtor = es.getType(this.esTypeDefs[prop]);
                        if (EntityCtor) {

                            entityProp = new EntityCtor();
                            if (entityProp.hasOwnProperty('___esCollection___')) { //if its a collection call 'populateCollection'
                                entityProp.populateCollection(data[prop]);
                            } else { //else call 'populateEntity'
                                entityProp.populateEntity(data[prop]);
                            }

                            this[prop] = entityProp; //then set the property back to the new Entity Object
                        } else {
                            // NOTE: We have a hierarchical property but the .js file for that entity wasn't included
                            //       so we need to make these regular ol' javascript objects
                            if (es.isArray(data[prop])) {
                                this[prop] = data[prop];
                                ko.utils.arrayForEach(this[prop], function (data) {
                                    // TODO : CONTINUE WALKING, TALK WITH ERIC
                                });
                            } else {
                                this[prop] = data[prop];
                                // TODO : CONTINUE WALKING, TALK WITH ERIC
                            }
                        }
                    }
                }
            }
        } finally {
            // We need to make sure we always turn this off ...
            self.ignorePropertyChanged = false;
        }
    };

    //#endregion

    this.applyDefaults = function () {
        //here to be overridden higher up the prototype chain
    };

    this.markAsDeleted = function () {
        var entity = this;

        if (!entity.hasOwnProperty("RowState")) {
            entity.RowState = ko.observable(es.RowState.DELETED);
        } else if (entity.RowState() !== es.RowState.DELETED) {
            entity.RowState(es.RowState.DELETED);
        }

        if (entity.hasOwnProperty("ModifiedColumns")) {
            entity.ModifiedColumns.removeAll();
        }
    };

    //#region Loads
    this.load = function (options) {
        self = this;

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        //if a route was passed in, use that route to pull the ajax options url & type
        if (options.route) {
            options.url = options.route.url || this.routes[options.route].url;
            options.type = options.route.method || this.routes[options.route].method; //in jQuery, the HttpVerb is the 'type' param
        }

        //sprinkle in our own handlers, but make sure the original still gets called
        var successHandler = options.success;
        var errorHandler = options.error;

        //wrap the passed in success handler so that we can populate the Entity
        options.success = function (data, options) {

            //populate the entity with the returned data;
            self.populateEntity(data);

            //fire the passed in success handler
            if (successHandler) { successHandler.call(self, data, options.state); }
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, options.state); }
        };

        es.dataProvider.execute(options);
    };

    this.loadByPrimaryKey = function (primaryKey, success, error, state) { // or single argument of options

        var options = {
            route: this.routes['loadByPrimaryKey']
        };

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            es.utils.extend(options, arguments[0]);
        } else {
            options.data = primaryKey;
            options.success = success;
            options.error = error;
            options.state = state;
        }

        this.load(options);
    };
    //#endregion Save

    //#region Save
    this.save = function (success, error, state) {
        self = this;

        var route,
            options = { success: success, error: error, state: state };

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            es.utils.extend(options, arguments[0]);
        }

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        // The default unless overriden
        route = self.routes['commit'];

        switch (self.RowState()) {
            case es.RowState.ADDED:
                route = self.routes['create'] || route;
                break;
            case es.RowState.MODIFIED:
                route = self.routes['update'] || route;
                break;
            case es.RowState.DELETED:
                route = self.routes['del'] || route;
                break;
        }

        options.route = route;

        //TODO: potentially the most inefficient call in the whole lib
        options.data = es.utils.getDirtyGraph(ko.toJS(self));

        if (route) {
            options.url = route.url;
            options.type = route.method;
        }

        var successHandler = options.success;
        var errorHandler = options.error;

        options.success = function (data, options) {
            self.populateEntity(data);
            if (successHandler) { successHandler.call(self, data, options.state); }
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, options.state); }
        };

        es.dataProvider.execute(options);
    };
    //#endregion
};

es.exportSymbol('es.EsEntity', es.EsEntity);
es.exportSymbol('es.EsEntity.populateEntity', es.EsEntity.populateEntity);
es.exportSymbol('es.EsEntity.markAsDeleted', es.EsEntity.markAsDeleted);
es.exportSymbol('es.EsEntity.load', es.EsEntity.load);
es.exportSymbol('es.EsEntity.loadByPrimaryKey', es.EsEntity.loadByPrimaryKey);
es.exportSymbol('es.EsEntity.save', es.EsEntity.save);
 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\EsEntityCollection.js 
***********************************************/ 
﻿/*globals es*/
/// <reference path="../../Libs/jquery-1.7.1.js" />
/// <reference path="../../Libs/json2.js" />
/// <reference path="../../Libs/knockout-2.0.0.debug.js" />


es.EsEntityCollection = function () {
    var obs = ko.observableArray([]);

    //add all of our extra methods to the array
    ko.utils.extend(obs, es.EsEntityCollection.fn);

    obs['___esCollection___'] = es.utils.newId(); // assign a unique id so we can test objects with this key, do equality comparison, etc...

    return obs;
};

es.EsEntityCollection.fn = { //can't do prototype on this one bc its a function

    filter: function (predicate) {
        var array = this();

        return ko.utils.arrayFilter(array, predicate);
    },

    markAllAsDeleted: function () {
        var i, entity,
            coll = this(),
            len = coll.length;

        for (i = 0; i < len; i += 1) {
            entity = coll[i];
            if (entity['markAsDeleted']) {
                entity.markAsDeleted();
            }
        }
    },

    //call this when walking the returned server data to populate collection
    populateCollection: function (dataArray) {
        var entityTypeName = this.entityTypeName, // this should be set in the 'DefineCollection' call, unless it was an anonymous definition
            EntityCtor,
            finalColl = [],
            create = this.createEntity,
            entity;

        if (entityTypeName) {
            EntityCtor = es.getType(entityTypeName); //might return undefined
        }

        if (dataArray && es.isArray(dataArray)) {

            ko.utils.arrayForEach(dataArray, function (data) {

                //call 'createEntity' for each item in the data array
                entity = create(data, EntityCtor); //ok to pass an undefined Ctor

                if (entity !== undefined && entity !== null) { //could be zeros or empty strings legitimately
                    finalColl.push(entity);
                }
            });

            //now set the observableArray that we inherit off of
            this(finalColl);
        }
    },

    createEntity: function (entityData, Ctor) {
        var entityTypeName, // this should be set in the 'DefineCollection' call 
            EntityCtor = Ctor,
            entity;

        if (!Ctor) { //undefined Ctor was passed in
            entityTypeName = this.entityTypeName;
            EntityCtor = es.getType(entityTypeName); //could return undefined
        }

        if (EntityCtor) { //if we have a constructor, new it up
            entity = new EntityCtor();
            entity.populateEntity(entityData);
        } else { //else just set the entity to the passed in data
            entity = entityData;
        }

        return entity;
    },

    //#region Loads
    load: function (options) {
        var self = this;

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        //if a route was passed in, use that route to pull the ajax options url & type
        if (options.route) {
            options.url = options.route.url || this.routes[options.route].url;
            options.type = options.route.method || this.routes[options.route].method; //in jQuery, the HttpVerb is the 'type' param
        }

        //sprinkle in our own handlers, but make sure the original still gets called
        var successHandler = options.success;
        var errorHandler = options.error;

        //wrap the passed in success handler so that we can populate the Entity
        options.success = function (data, options) {

            //populate the entity with the returned data;
            self.populateCollection(data);

            //fire the passed in success handler
            if (successHandler) { successHandler.call(self, data, options.state); }
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, options.state); }
        };

        es.dataProvider.execute(options);
    },
    //#endregion Save

    loadAll: function (success, error, state) {

        var options = {
            route: this.routes['loadAll']
        };

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            es.utils.extend(options, arguments[0]);
        } else {
            options.success = success;
            options.error = error;
            options.state = state;
        }

        this.load(options);
    },

    //#region Save
    save: function (success, error, state) {
        var self = this;

        var route,
            options = { success: success, error: error, state: state };

        if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object') {
            es.utils.extend(options, arguments[0]);
        }

        if (options.success !== undefined || options.error !== undefined) {
            options.async = true;
        } else {
            options.async = false;
        }

        options.route = self.routes['commit'];

        //TODO: potentially the most inefficient call in the whole lib
        options.data = es.utils.getDirtyGraph(ko.toJS(self));

        if (options.route) {
            options.url = options.route.url;
            options.type = options.route.method;
        }

        var successHandler = options.success;
        var errorHandler = options.error;

        options.success = function (data, options) {
            self.populateCollection(data);
            if (successHandler) { successHandler.call(self, data, options.state); }
        };

        options.error = function (status, responseText, options) {
            if (errorHandler) { errorHandler.call(self, status, responseText, options.state); }
        };

        es.dataProvider.execute(options);
    }
    //#endregion
};

es.exportSymbol('es.EsEntityCollection', es.EsEntityCollection);
es.exportSymbol('es.EsEntityCollection.markAllAsDeleted', es.EsEntityCollection.markAllAsDeleted);
es.exportSymbol('es.EsEntityCollection.loadAll', es.EsEntityCollection.loadAll);
es.exportSymbol('es.EsEntityCollection.load', es.EsEntityCollection.load);
es.exportSymbol('es.EsEntityCollection.save', es.EsEntityCollection.save); 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\DefineEntity.js 
***********************************************/ 
﻿
es.defineEntity = function (typeName, constrctor) {
    var isAnonymous = (typeof(typeName) !== 'string'),
        Ctor = isAnonymous ? arguments[0] : arguments[1];

    var EsCtor = function () {

        //MUST do this here so that obj.hasOwnProperty actually returns the keys in the object!
        Ctor.call(this);

        //call apply defaults here before change tracking is enabled
        this.applyDefaults();

        //call the init method on the base prototype
        this.init();
    };

    //Setup the prototype chain correctly
    EsCtor.prototype = new es.EsEntity();

    //add it to the correct namespace if it isn't an anonymous type
    if (!isAnonymous) {
        es.generatedNamespace[typeName] = EsCtor;
    }

    return EsCtor;
};

es.exportSymbol('es.defineEntity', es.defineEntity); 
 
 
/*********************************************** 
* FILE: ..\Src\BaseClasses\DefineCollection.js 
***********************************************/ 
﻿
es.defineCollection = function (typeName, entityName) {
    var isAnonymous = (typeof (typeName) !== 'string'),
        ctorName = isAnonymous ? arguments[0] : arguments[1];

    var EsCollCtor = function () {

        var coll = new es.EsEntityCollection();

        //add the type definition;
        coll.entityTypeName = ctorName;

        this.init.call(coll); //Trickery and sorcery on the prototype

        return coll;

    };

    var F = function () {
        var base = this,
            extenders = [];

        this.init = function () {
            var self = this;

            //loop through the extenders and call each one
            ko.utils.arrayForEach(extenders, function(ext){
                
                //make sure to set 'this' properly
                ext.call(self);
            });

            //loop through all the PROTOTYPE methods/properties and tack them on
            for (var prop in base) {
                if (base.hasOwnProperty(prop) && prop !== "init" && prop !== "customize") {

                    self[prop] = base[prop];

                }
            }

        };

        this.customize = function (customizer) {

            extenders.push(customizer);

        };
    };

    EsCollCtor.prototype = new F();

    //add it to the correct namespace if it isn't an anonymous type
    if (!isAnonymous) {
        es.generatedNamespace[typeName] = EsCollCtor;
    }

    return EsCollCtor;
};

es.exportSymbol('es.defineCollection', es.defineCollection);

 
 
 
/*********************************************** 
* FILE: ..\Src\Providers\XMLHttpRequestProvider.js 
***********************************************/ 
﻿/* File Created: December 23, 2011 */

es.XMLHttpRequestProvider = function () {

    var createRequest, executeCompleted, noop = function () { };
    this.baseURL = "http://localhost";

    createRequest = function () {

        var xmlHttp;

        // Create HTTP request
        try {
            xmlHttp = new XMLHttpRequest();
        } catch (e1) {
            try {
                xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e2) {
                try {
                    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e3) {
                    alert("This sample only works in browsers with AJAX support");
                    return false;
                }
            }
        }

        return xmlHttp;
    };

    executeCompleted = function (responseText, route) {

        var theData = JSON.parse(responseText);

        if (route.response !== undefined) {
            switch (route.response) {
                case 'entity':
                    return theData[route.response];
                case 'collection':
                    return theData[route.response];
            }
        }

        return theData;
    };

    // Called by the entityspaces.js framework when working with entities
    this.execute = function (options) {

        var path = null, xmlHttp, success, error;

        success = options.success || noop;
        error = options.error || noop;

        // Create HTTP request
        xmlHttp = createRequest();

        // Build the operation URL
        path = this.baseURL + options.url;

        // Make the HTTP request
        xmlHttp.open("POST", path, options.async || false);
        xmlHttp.setRequestHeader("Content-type", "application/json; charset=utf-8");

        if (options.async === true) {
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        success(executeCompleted(xmlHttp.responseText, options.route), options);
                    } else {
                        error(xmlHttp.status, xmlHttp.statusText, options);
                    }
                }
            };
        }

        xmlHttp.send(ko.toJSON(options.data));

        if (options.async === false) {
            if (xmlHttp.status === 200) {
                if (xmlHttp.responseText !== '{}' && xmlHttp.responseText !== "") {
                    success(executeCompleted(xmlHttp.responseText, options.route), options);
                }
            } else {
                error(xmlHttp.status, xmlHttp.responseText, options);
            }
        }
    };

    // So developers can make their own requests, synchronous or aynchronous
    this.makeRequest = function (url, methodName, params, successCallback, failureCallback) {

        var theData = null, path = null, async = false, xmlHttp, success, failure;

        if (successCallback !== undefined || failureCallback !== undefined) {
            async = true;
            success = successCallback || noop;
            failure = failureCallback || noop;
        }

        // Create HTTP request
        xmlHttp = createRequest();

        // Build the operation URL
        path = url + methodName;

        // Make the HTTP request
        xmlHttp.open("POST", path, async);
        xmlHttp.setRequestHeader("Content-type", "application/json; charset=utf-8");

        if (async === true) {
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
                        success(JSON.parse(xmlHttp.responseText));
                    } else {
                        failure(xmlHttp.status, xmlHttp.statusText);
                    }
                }
            };
        }

        xmlHttp.send(params);

        if (async === false) {
            if (xmlHttp.status === 200) {
                if (xmlHttp.responseText !== '{}' && xmlHttp.responseText !== "") {
                    theData = JSON.parse(xmlHttp.responseText);
                }
            } else {
                es.makeRequstError = xmlHttp.statusText;
            }
        }

        return theData;
    };
};

es.dataProvider = new es.XMLHttpRequestProvider(); //assign default data provider 
}(window)); 

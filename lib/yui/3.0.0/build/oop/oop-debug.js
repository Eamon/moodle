/*
Copyright (c) 2009, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 3.0.0
build: 1549
*/
YUI.add('oop', function(Y) {

/**
 * Supplies object inheritance and manipulation utilities.  This adds
 * additional functionaity to what is provided in yui-base, and the
 * methods are applied directly to the YUI instance.  This module
 * is required for most YUI components.
 * @module oop
 */

    var L  = Y.Lang, 
        A  = Y.Array,
        OP = Object.prototype,
        CLONE_MARKER = "_~yuim~_";

        // dispatch = function(o, f, c, proto, action) {
        //     if (o[action] && o.item) {
        //         return o[action].call(o, f, c);
        //     } else {
        //         switch (A.test(o)) {
        //             case 1:
        //                 return A[action](o, f, c);
        //             case 2:
        //                 return A[action](Y.Array(o, 0, true), f, c);
        //             default:
        //                 return Y.Object[action](o, f, c, proto);
        //         }
        //     }
        // };

    /**
     * The following methods are added to the YUI instance
     * @class YUI~oop
     */

    /**
     * Applies prototype properties from the supplier to the receiver.
     * The receiver can be a constructor or an instance.
     * @method augment
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param ov {boolean} if true, properties already on the receiver
     * will be overwritten if found on the supplier.
     * @param wl {string[]} a whitelist.  If supplied, only properties in 
     * this list will be applied to the receiver.
     * @param args {Array | Any} arg or arguments to apply to the supplier
     * constructor when initializing.
     * @return {object} the augmented object
     *
     * @todo constructor optional?
     * @todo understanding what an instance is augmented with
     * @TODO best practices for overriding sequestered methods.
     */
    Y.augment = function(r, s, ov, wl, args) {
        var sProto           = s.prototype, 
            newProto         = null, 
            construct        = s, 
            a                = (args) ? Y.Array(args) : [], 
            rProto           = r.prototype, 
            target           = rProto || r, 
            applyConstructor = false,
            sequestered, replacements, i;

        // working on a class, so apply constructor infrastructure
        if (rProto && construct) {
            sequestered  = {};
            replacements = {};
            newProto     = {};

            // sequester all of the functions in the supplier and replace with
            // one that will restore all of them.
            Y.each(sProto, function(v, k) {
                replacements[k] = function() {

// Y.log('sequestered function "' + k + '" executed.  Initializing EventTarget');
// overwrite the prototype with all of the sequestered functions,
// but only if it hasn't been overridden
                    for (i in sequestered) {
                        if (sequestered.hasOwnProperty(i) && (this[i] === replacements[i])) {
                            // Y.log('... restoring ' + k);
                            this[i] = sequestered[i];
                        }
                    }

                    // apply the constructor
                    construct.apply(this, a);

                    // apply the original sequestered function
                    return sequestered[k].apply(this, arguments);
                };

                if ((!wl || (k in wl)) && (ov || !(k in this))) {
                    // Y.log('augment: ' + k);
                    if (L.isFunction(v)) {
                        // sequester the function
                        sequestered[k] = v;

// replace the sequestered function with a function that will
// restore all sequestered functions and exectue the constructor.
                        this[k] = replacements[k];
                    } else {
                        // Y.log('augment() applying non-function: ' + k);
                        this[k] = v;
                    }

                }

            }, newProto, true);

        // augmenting an instance, so apply the constructor immediately
        } else {
            applyConstructor = true;
        }

        Y.mix(target, newProto || sProto, ov, wl);

        if (applyConstructor) {
            s.apply(target, a);
        }

        return r;
    };

    /**
     * Applies object properties from the supplier to the receiver.  If
     * the target has the property, and the property is an object, the target
     * object will be augmented with the supplier's value.  If the property
     * is an array, the suppliers value will be appended to the target.
     * @method aggregate
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param ov {boolean} if true, properties already on the receiver
     * will be overwritten if found on the supplier.
     * @param wl {string[]} a whitelist.  If supplied, only properties in 
     * this list will be applied to the receiver.
     * @return {object} the extended object
     */
    Y.aggregate = function(r, s, ov, wl) {
        return Y.mix(r, s, ov, wl, 0, true);
    };

    /**
     * Utility to set up the prototype, constructor and superclass properties to
     * support an inheritance strategy that can chain constructors and methods.
     * Static members will not be inherited.
     *
     * @method extend
     * @param {Function} r   the object to modify
     * @param {Function} s the object to inherit
     * @param {Object} px prototype properties to add/override
     * @param {Object} sx static properties to add/override
     * @return {YUI} the YUI instance
     */
    Y.extend = function(r, s, px, sx) {
        if (!s||!r) {
            // @TODO error symbols
            Y.error("extend failed, verify dependencies");
        }

        var sp = s.prototype, rp=Y.Object(sp);
        r.prototype=rp;

        rp.constructor=r;
        r.superclass=sp;

        // assign constructor property
        if (s != Object && sp.constructor == OP.constructor) {
            sp.constructor=s;
        }
    
        // add prototype overrides
        if (px) {
            Y.mix(rp, px, true);
        }

        // add object overrides
        if (sx) {
            Y.mix(r, sx, true);
        }

        return r;
    };

    /**
     * Executes the supplied function for each item in
     * a collection.  Supports arrays, objects, and
     * Y.NodeLists
     * @method each
     * @param o the object to iterate
     * @param f the function to execute.  This function
     * receives the value, key, and object as parameters
     * @param proto if true, prototype properties are
     * iterated on objects
     * @return {YUI} the YUI instance
     */
    Y.each = function(o, f, c, proto) {

        if (o.each && o.item) {
            return o.each.call(o, f, c);
        } else {
            switch (A.test(o)) {
                case 1:
                    return A.each(o, f, c);
                case 2:
                    return A.each(Y.Array(o, 0, true), f, c);
                default:
                    return Y.Object.each(o, f, c, proto);
            }
        }

        // return Y.Object.each(o, f, c);
    };

    // Y.each = function(o, f, c, proto) {
    //     return dispatch(o, f, c, proto, 'each');
    // };

    /*
     * Executes the supplied function for each item in
     * a collection.  The operation stops if the function
     * returns true. Supports arrays, objects, and
     * Y.NodeLists.
     * @method some
     * @param o the object to iterate
     * @param f the function to execute.  This function
     * receives the value, key, and object as parameters
     * @param proto if true, prototype properties are
     * iterated on objects
     * @return {boolean} true if the function ever returns true, false otherwise
     */
    // Y.some = function(o, f, c, proto) {
    //     return dispatch(o, f, c, proto, 'some');
    // };

    /**
     * Deep obj/array copy.  Functions are cloned with Y.bind.
     * Array-like objects are treated as arrays.
     * Primitives are returned untouched.  Optionally, a
     * function can be provided to handle other data types,
     * filter keys, validate values, etc.
     *
     * @method clone
     * @param o what to clone
     * @param safe {boolean} if true, objects will not have prototype
     * items from the source.  If false, they will.  In this case, the
     * original is initially protected, but the clone is not completely immune
     * from changes to the source object prototype.  Also, cloned prototype
     * items that are deleted from the clone will result in the value
     * of the source prototype being exposed.  If operating on a non-safe
     * clone, items should be nulled out rather than deleted.
     * @TODO review
     * @param f optional function to apply to each item in a collection;
     *          it will be executed prior to applying the value to
     *          the new object.  Return false to prevent the copy.
     * @param c optional execution context for f
     * @param owner Owner object passed when clone is iterating an
     * object.  Used to set up context for cloned functions.
     * @return {Array|Object} the cloned object
     */
    Y.clone = function(o, safe, f, c, owner, cloned) {

        if (!L.isObject(o)) {
            return o;
        }

        var o2, marked = cloned || {}, stamp;

        switch (L.type(o)) {
            case 'date':
                return new Date(o);
            case 'regexp':
                return new RegExp(o.source);
            case 'function':
                o2 = Y.bind(o, owner);
                break;
            case 'array':
                o2 = [];
                break;
            default:

                // #2528250 only one clone of a given object should be created.
                if (o[CLONE_MARKER]) {
                    return marked[o[CLONE_MARKER]];
                }

                stamp = Y.guid();

                o2 = (safe) ? {} : Y.Object(o);

                o[CLONE_MARKER] = stamp;
                marked[stamp] = o;
        }

        // #2528250 don't try to clone element properties
        if (!o.addEventListener && !o.attachEvent) {
            Y.each(o, function(v, k) {
                if (!f || (f.call(c || this, v, k, this, o) !== false)) {
                    if (k !== CLONE_MARKER) {
                        this[k] = Y.clone(v, safe, f, c, owner || o, marked);
                    }
                }
            }, o2);
        }

        if (!cloned) {
            Y.each(marked, function(v, k) {
                delete v[CLONE_MARKER];
            });
            marked = null;
        }

        return o2;
    };


    /**
     * Returns a function that will execute the supplied function in the
     * supplied object's context, optionally adding any additional
     * supplied parameters to the beginning of the arguments collection the 
     * supplied to the function.
     *
     * @method bind
     * @param f {Function|String} the function to bind, or a function name
     * to execute on the context object
     * @param c the execution context
     * @param args* 0..n arguments to include before the arguments the 
     * function is executed with.
     * @return {function} the wrapped function
     */
    Y.bind = function(f, c) {
        var xargs = arguments.length > 2 ? Y.Array(arguments, 2, true) : null;
        return function () {
            var fn = L.isString(f) ? c[f] : f, 
                args = (xargs) ? xargs.concat(Y.Array(arguments, 0, true)) : arguments;
            return fn.apply(c || fn, args);
        };
    };
    
    /**
     * Returns a function that will execute the supplied function in the
     * supplied object's context, optionally adding any additional
     * supplied parameters to the end of the arguments the function
     * is executed with.
     *
     * @method rbind
     * @param f {Function|String} the function to bind, or a function name
     * to execute on the context object
     * @param c the execution context
     * @param args* 0..n arguments to append to the end of arguments collection
     * supplied to the function
     * @return {function} the wrapped function
     */
    Y.rbind = function(f, c) {
        var xargs = arguments.length > 2 ? Y.Array(arguments, 2, true) : null;
        return function () {
            var fn = L.isString(f) ? c[f] : f, 
                args = (xargs) ? Y.Array(arguments, 0, true).concat(xargs) : arguments;
            return fn.apply(c || fn, args);
        };
    };



}, '3.0.0' );
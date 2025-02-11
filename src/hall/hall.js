"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hall = void 0;
var Hall = /** @class */ (function () {
    function Hall(name) {
        this.name = name;
        this.people = [];
    }
    Hall.prototype.addPerson = function (person) {
        this.people.push(person);
    };
    return Hall;
}());
exports.Hall = Hall;

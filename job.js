"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
var Job = /** @class */ (function () {
    function Job(name, numOfPeople, hall) {
        this.name = name;
        this.numOfPeople = numOfPeople;
        this.hall = hall;
    }
    Job.prototype.addPerson = function (person) {
        this.people.push(person);
    };
    Job.prototype.removePerson = function (person) {
        this.people = this.people.filter(function (p) { return p !== person; });
    };
    Job.prototype.getPeople = function () {
        return this.people;
    };
    Job.prototype.displayJob = function () {
        return "".concat(this.name, ": ").concat(this.people.map(function (person) { return person.name; }).join(', '));
    };
    return Job;
}());
exports.Job = Job;

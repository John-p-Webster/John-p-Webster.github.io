"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Week = void 0;
var Week = /** @class */ (function () {
    function Week(weekNumber, jobs) {
        this.weekNumber = weekNumber;
        this.jobs = jobs;
    }
    Week.prototype.displayWeek = function () {
        return this.jobs.map(function (job) { return job.displayJob(); }).join('\n');
    };
    return Week;
}());
exports.Week = Week;

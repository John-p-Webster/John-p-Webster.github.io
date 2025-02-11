"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Schedule = void 0;
var Schedule = /** @class */ (function () {
    function Schedule(numOfWeeks) {
        this.weeks = [];
        this.numOfWeeks = numOfWeeks;
    }
    Schedule.prototype.addWeek = function (week) {
        this.weeks.push(week);
    };
    Schedule.prototype.getWeeks = function () {
        return this.weeks;
    };
    Schedule.prototype.displaySchedule = function () {
        this.weeks.forEach(function (week) {
            console.log(week.displayWeek());
        });
    };
    return Schedule;
}());
exports.Schedule = Schedule;

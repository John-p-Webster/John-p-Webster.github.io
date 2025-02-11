"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
var hall_1 = require("./hall");
var job_1 = require("./job");
var person_1 = require("./person");
var schedule_1 = require("./schedule");
var week_1 = require("./week");
var Scheduler = /** @class */ (function () {
    function Scheduler() {
        this.schedule = new schedule_1.Schedule(11);
        this.halls = [];
        this.people = [];
        this.jobs = [];
        this.createHalls();
        this.createWeeks();
    }
    Scheduler.prototype.createHalls = function () {
        this.hallConfigs = [
            { name: 'Upper North', people: ['Zebert', 'JT', 'Conner', 'Jonny', 'Josh MC', 'Grayson', 'Starit', 'Logan P.', 'Kj', 'Hrimann'] },
            { name: 'Upper South', people: ['Austin', 'Wyatt', 'Brandon', 'Webster', 'Cutler', 'Robbie', 'Tristan', 'Antonio', 'Joel', 'Nate', 'Matteo B', 'Nathan'] },
            { name: 'Lower North', people: ['Tim', 'Baba', 'Josh Pearson'] },
            { name: 'Lower South', people: ['Gary Groudsky', 'Dom Spiotta'] }
        ];
        for (var _i = 0, _a = this.hallConfigs; _i < _a.length; _i++) {
            var config = _a[_i];
            var hall = new hall_1.Hall(config.name);
            this.halls.push(hall);
            for (var _b = 0, _c = config.people; _b < _c.length; _b++) {
                var name_1 = _c[_b];
                var person = new person_1.Person(name_1, hall, true);
                hall.addPerson(person);
                this.people.push(person);
            }
        }
    };
    Scheduler.prototype.createWeeks = function () {
        this.jobConfigs = [
            { name: 'Upper North', numOfPeople: 2, hall: this.halls[0] },
            { name: 'Upper South', numOfPeople: 2, hall: this.halls[1] },
            { name: 'Lower North', numOfPeople: 2, hall: this.halls[2] },
            { name: 'Lower South', numOfPeople: 2, hall: this.halls[3] },
            { name: 'Foyer', numOfPeople: 2 },
            { name: 'Judy and Judy Jr.', numOfPeople: 2 },
            { name: 'Pool room and Handicap Restroom', numOfPeople: 2 },
            { name: 'Library and Dungeoun', numOfPeople: 2 },
            { name: 'Chapter Room', numOfPeople: 2 },
            { name: 'Kitchen Crew', numOfPeople: 4 },
        ];
        // Create jobs based on configs
        for (var _i = 0, _a = this.jobConfigs; _i < _a.length; _i++) {
            var config = _a[_i];
            var job = new job_1.Job(config.name, config.numOfPeople, config.hall);
            this.jobs.push(job);
        }
        // Create 11 weeks with jobs
        for (var i = 0; i < 11; i++) {
            // Create copy of jobs for this week
            var weekJobs = this.jobs.map(function (job) {
                return new job_1.Job(job.name, job.numOfPeople, job.hall);
            });
            var week = new week_1.Week(i + 1, weekJobs);
            this.schedule.addWeek(week);
        }
    };
    Scheduler.prototype.assignPeopleToJobs = function () {
        // Initialize per-week tracking for assigned persons.
        // Adding a property "_assignedPersons" to each week
        for (var _i = 0, _a = this.schedule.getWeeks(); _i < _a.length; _i++) {
            var week = _a[_i];
            week._assignedPersons = new Set();
            // Also, ensure each job's people array is initialized
            for (var _b = 0, _c = week.jobs; _b < _c.length; _b++) {
                var job = _c[_b];
                if (!job.people) {
                    job.people = [];
                }
            }
        }
        // Initialize each person's assignment count (if not already)
        for (var _d = 0, _e = this.people; _d < _e.length; _d++) {
            var person = _e[_d];
            person.numAssignedJobs = person.numAssignedJobs || 0;
        }
        // Calculate the dynamic cap based on total job slots / number of people.
        var totalSlots = this.schedule.getWeeks().reduce(function (slotSum, week) {
            return slotSum + week.jobs.reduce(function (acc, job) { return acc + job.numOfPeople; }, 0);
        }, 0);
        this.maxAssignments = Math.ceil(totalSlots / this.people.length);
        console.log("Max assignments per person: ".concat(this.maxAssignments));
        this.assignHallJobs();
        this.assignOtherJobs();
        this.rebalanceAssignments();
        this.randomizeAssignments(0);
    };
    Scheduler.prototype.assignHallJobs = function () {
        var _this = this;
        var _loop_1 = function (week) {
            var weekAssigned = week._assignedPersons;
            for (var _b = 0, _c = week.jobs; _b < _c.length; _b++) {
                var job = _c[_b];
                if (job.hall) { // job with a hall requirement
                    // Ensure job.people array is initialized
                    if (!job.people) {
                        job.people = [];
                    }
                    var currentAssigned = job.people.length;
                    var needed = job.numOfPeople - currentAssigned;
                    for (var i = 0; i < needed; i++) {
                        // Get eligible candidates from the job's hall
                        var hallCandidates = job.hall.people.filter(function (person) {
                            return person.active && person.numAssignedJobs < _this.maxAssignments && !weekAssigned.has(person);
                        });
                        hallCandidates.sort(function (a, b) { return a.numAssignedJobs - b.numAssignedJobs; });
                        var candidate = hallCandidates[0];
                        if (!candidate) {
                            // Fallback: if no eligible candidate in the hall, allow any eligible person
                            var fallbackCandidates = this_1.people.filter(function (person) {
                                return person.active && person.numAssignedJobs < _this.maxAssignments && !weekAssigned.has(person);
                            });
                            fallbackCandidates.sort(function (a, b) { return a.numAssignedJobs - b.numAssignedJobs; });
                            candidate = fallbackCandidates[0];
                            if (!candidate) {
                                // No candidate available to fill this slot
                                console.warn("No candidate available to fill ".concat(job.name, " in week ").concat(week.weekNumber));
                                break;
                            }
                        }
                        // Assign candidate to the job
                        job.addPerson(candidate);
                        candidate.numAssignedJobs++;
                        weekAssigned.add(candidate);
                    }
                }
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = this.schedule.getWeeks(); _i < _a.length; _i++) {
            var week = _a[_i];
            _loop_1(week);
        }
    };
    Scheduler.prototype.assignOtherJobs = function () {
        var _this = this;
        var _loop_2 = function (week) {
            var weekAssigned = week._assignedPersons;
            for (var _b = 0, _c = week.jobs; _b < _c.length; _b++) {
                var job = _c[_b];
                if (!job.hall) { // job without a hall requirement
                    // Ensure job.people array is initialized
                    if (!job.people) {
                        job.people = [];
                    }
                    var currentAssigned = job.people.length;
                    var needed = job.numOfPeople - currentAssigned;
                    for (var i = 0; i < needed; i++) {
                        var eligible = this_2.people.filter(function (person) {
                            return person.active && person.numAssignedJobs < _this.maxAssignments && !weekAssigned.has(person);
                        });
                        eligible.sort(function (a, b) { return a.numAssignedJobs - b.numAssignedJobs; });
                        var candidate = eligible[0];
                        if (!candidate) {
                            console.warn("No candidate available to fill ".concat(job.name, " in week ").concat(week.weekNumber));
                            break;
                        }
                        job.addPerson(candidate);
                        candidate.numAssignedJobs++;
                        weekAssigned.add(candidate);
                    }
                }
            }
        };
        var this_2 = this;
        for (var _i = 0, _a = this.schedule.getWeeks(); _i < _a.length; _i++) {
            var week = _a[_i];
            _loop_2(week);
        }
    };
    Scheduler.prototype.rebalanceAssignments = function () {
        var cap = this.maxAssignments;
        var swapped = true;
        // Continue swapping until no further improvement is found.
        while (swapped) {
            swapped = false;
            var _loop_3 = function (week) {
                // Retrieve the per-week assigned set (from the initial assignment).
                var weekAssigned = week._assignedPersons;
                var _loop_4 = function (job) {
                    var currentCount = job.people ? job.people.length : 0;
                    var missingSlots = job.numOfPeople - currentCount;
                    for (var m = 0; m < missingSlots; m++) {
                        // Look for potential candidates that are at capacity (6 assignments)
                        // and eligible for this job (if a hall is required, they must belong to it)
                        var potentialCandidates = this_3.people.filter(function (person) {
                            var eligible = person.active && person.numAssignedJobs === cap && !weekAssigned.has(person);
                            if (job.hall) {
                                eligible = eligible && job.hall.people.includes(person);
                            }
                            return eligible;
                        });
                        if (potentialCandidates.length === 0) {
                            console.warn("No swap candidate found for job ".concat(job.name, " in week ").concat(week.weekNumber));
                            continue;
                        }
                        var swapDone = false;
                        var _loop_5 = function (candidate) {
                            var foundSwap = false;
                            var _loop_6 = function (otherWeek) {
                                if (otherWeek.weekNumber === week.weekNumber)
                                    return "continue";
                                var otherWeekAssigned = otherWeek._assignedPersons;
                                var _loop_7 = function (otherJob) {
                                    // If candidate is assigned in this other job…
                                    if (otherJob.people && otherJob.people.includes(candidate)) {
                                        // Look for an alternate candidate for that slot in the other job.
                                        var altCandidates = this_3.people.filter(function (person) {
                                            var canTake = person.active && person.numAssignedJobs < cap && !otherWeekAssigned.has(person);
                                            if (otherJob.hall) {
                                                canTake = canTake && otherJob.hall.people.includes(person);
                                            }
                                            return canTake;
                                        });
                                        // Sort alternate candidates by fewest assignments.
                                        altCandidates.sort(function (a, b) { return a.numAssignedJobs - b.numAssignedJobs; });
                                        if (altCandidates.length > 0) {
                                            var alt = altCandidates[0];
                                            // Perform the swap:
                                            // Remove candidate from the other job.
                                            otherJob.people = otherJob.people.filter(function (p) { return p !== candidate; });
                                            otherWeekAssigned.delete(candidate);
                                            // Add the alternate into the other job.
                                            otherJob.addPerson(alt);
                                            alt.numAssignedJobs++;
                                            // Update candidate's assignment count.
                                            candidate.numAssignedJobs--;
                                            otherWeekAssigned.add(alt);
                                            foundSwap = true;
                                            swapped = true;
                                            return "break";
                                        }
                                    }
                                };
                                for (var _g = 0, _h = otherWeek.jobs; _g < _h.length; _g++) {
                                    var otherJob = _h[_g];
                                    var state_3 = _loop_7(otherJob);
                                    if (state_3 === "break")
                                        break;
                                }
                                if (foundSwap)
                                    return "break"; // Break out of otherWeek loop if swap succeeded.
                            };
                            // Look through other weeks (other than the current week)
                            for (var _e = 0, _f = this_3.schedule.getWeeks(); _e < _f.length; _e++) {
                                var otherWeek = _f[_e];
                                var state_2 = _loop_6(otherWeek);
                                if (state_2 === "break")
                                    break;
                            }
                            if (foundSwap) {
                                // Now candidate's count is under the cap.
                                // Assign candidate to fill the missing slot in the current job.
                                job.addPerson(candidate);
                                candidate.numAssignedJobs++;
                                weekAssigned.add(candidate);
                                swapDone = true;
                                return "break";
                            }
                        };
                        // Try to free one candidate by swapping one of their assignments.
                        for (var _d = 0, potentialCandidates_1 = potentialCandidates; _d < potentialCandidates_1.length; _d++) {
                            var candidate = potentialCandidates_1[_d];
                            var state_1 = _loop_5(candidate);
                            if (state_1 === "break")
                                break;
                        }
                        if (!swapDone) {
                            console.warn("Unable to rebalance slot for job ".concat(job.name, " in week ").concat(week.weekNumber));
                        }
                    }
                };
                for (var _b = 0, _c = week.jobs; _b < _c.length; _b++) {
                    var job = _c[_b];
                    _loop_4(job);
                }
            };
            var this_3 = this;
            // Iterate through every week in the schedule.
            for (var _i = 0, _a = this.schedule.getWeeks(); _i < _a.length; _i++) {
                var week = _a[_i];
                _loop_3(week);
            }
        }
    };
    Scheduler.prototype.howManyTimesIsPersonDoingKitchen = function (person) {
        var count = 0;
        for (var _i = 0, _a = this.schedule.getWeeks(); _i < _a.length; _i++) {
            var week = _a[_i];
            if (week.jobs.find(function (job) { return job.name === 'Kitchen Crew' && job.people.includes(person); })) {
                count++;
            }
        }
        return count;
    };
    Scheduler.prototype.arePeopleDoingKitchenTooMuch = function () {
        for (var _i = 0, _a = this.people; _i < _a.length; _i++) {
            var person = _a[_i];
            if (this.howManyTimesIsPersonDoingKitchen(person) > 2) {
                return true;
            }
        }
        return false;
    };
    Scheduler.prototype.randomizeAssignments = function (count) {
        if (count > 2000) {
            console.warn("Randomized ".concat(count, " times, giving up"));
            return false;
        }
        // Save current state in case we need to revert
        var originalState = this.schedule.getWeeks().map(function (week) {
            return week.jobs.map(function (job) { return __spreadArray([], job.people, true); });
        });
        // Randomize all weeks
        for (var _i = 0, _a = this.schedule.getWeeks(); _i < _a.length; _i++) {
            var week = _a[_i];
            var people = [];
            for (var _b = 0, _c = week.jobs; _b < _c.length; _b++) {
                var job = _c[_b];
                people.push.apply(people, job.people);
                job.people = [];
            }
            people.sort(function () { return Math.random() - 0.5; });
            var personIndex = 0;
            // Assign people to jobs respecting numOfPeople
            for (var _d = 0, _e = week.jobs; _d < _e.length; _d++) {
                var job = _e[_d];
                for (var i = 0; i < job.numOfPeople; i++) {
                    if (personIndex < people.length) {
                        job.addPerson(people[personIndex]);
                        personIndex++;
                    }
                }
            }
        }
        if (this.arePeopleDoingKitchenTooMuch()) {
            // Restore original state
            this.schedule.getWeeks().forEach(function (week, weekIndex) {
                week.jobs.forEach(function (job, jobIndex) {
                    job.people = __spreadArray([], originalState[weekIndex][jobIndex], true);
                });
            });
            // Try again
            return this.randomizeAssignments(count + 1);
        }
        console.log("Randomized ".concat(count, " times, found a valid assignment"));
        return true;
    };
    Scheduler.prototype.toJson = function () {
        var json = {
            weeks: this.schedule.getWeeks().map(function (week) { return ({
                weekNumber: week.weekNumber,
                jobs: week.jobs.map(function (job) { return ({
                    name: job.name,
                    people: job.getPeople().map(function (person) { return ({
                        name: person.name
                    }); })
                }); })
            }); })
        };
        // Convert to JSON string with proper formatting
        var jsonString = JSON.stringify(json, null, 2);
        // Use Node's filesystem module to write the file
        var fs = require('fs');
        var path = require('path');
        var currentDir = process.cwd();
        var filePath = path.join(currentDir, 'schedule.json');
        console.log("Writing schedule to ".concat(filePath));
        fs.writeFileSync(filePath, jsonString);
        return json;
    };
    Scheduler.prototype.maxTimesOnePersonIsDoingKitchen = function () {
        var max = 0;
        for (var _i = 0, _a = this.people; _i < _a.length; _i++) {
            var person = _a[_i];
            var times = this.howManyTimesIsPersonDoingKitchen(person);
            if (times > max) {
                max = times;
            }
        }
        return max;
    };
    return Scheduler;
}());
exports.Scheduler = Scheduler;

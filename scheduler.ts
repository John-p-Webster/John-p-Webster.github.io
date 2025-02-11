import { Hall } from "./hall";
import { Job } from "./job";
import { Person } from "./person";
import { Schedule } from "./schedule";
import { Week } from "./week";

export class Scheduler {
    schedule: Schedule;
    halls: Hall[];
    people: Person[];
    jobs: Job[];
    jobConfigs;
    hallConfigs
    maxAssignments: number;

    constructor() {
        this.schedule = new Schedule(11);
        this.halls = [];
        this.people = [];
        this.jobs = [];

        this.createHalls();
        this.createWeeks();
    }

    createHalls() {
        this.hallConfigs = [
            { name: 'Upper North', people: ['Zebert', 'JT', 'Conner', 'Jonny', 'Josh MC', 'Grayson', 'Strait', 'Logan P.', 'Kj', 'Hrimann'] },
            { name: 'Upper South', people: ['Austin', 'Wyatt', 'Brandon', 'Webster', 'Cutler', 'Robbie', 'Tristan', 'Antonio', 'Joel', 'Nate', 'Matteo B', 'Nathan'] },
            { name: 'Lower North', people: ['Tim', 'Baba', 'Josh Pearson'] },
            { name: 'Lower South', people: ['Gary Groudsky', 'Dom Spiotta'] }
        ];

        for (const config of this.hallConfigs) {
            const hall = new Hall(config.name);
            this.halls.push(hall);

            for (const name of config.people) {
                const person = new Person(name, hall, true);
                hall.addPerson(person);
                this.people.push(person);
            }
        }
    }

    createWeeks() {
        this.jobConfigs = [
            { name: 'Upper North', numOfPeople: 2, hall:  this.halls[0]},
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
        for (const config of this.jobConfigs) {
            const job = new Job(config.name, config.numOfPeople, config.hall);
            this.jobs.push(job);
        }

        // Create 11 weeks with jobs
        for (let i = 0; i < 11; i++) {
            // Create copy of jobs for this week
            const weekJobs = this.jobs.map(job => {
                return new Job(job.name, job.numOfPeople, job.hall);
            });
            
            const week = new Week(i + 1, weekJobs);
            this.schedule.addWeek(week);
        }
    }

    assignPeopleToJobs() {
        // Initialize per-week tracking for assigned persons.
        // Adding a property "_assignedPersons" to each week
        for (const week of this.schedule.getWeeks()){
            (week as any)._assignedPersons = new Set<Person>();
            // Also, ensure each job's people array is initialized
            for (const job of week.jobs) {
                if (!job.people) {
                    job.people = [];
                }
            }
        }
        // Initialize each person's assignment count (if not already)
        for (const person of this.people) {
            person.numAssignedJobs = person.numAssignedJobs || 0;
        }
        // Calculate the dynamic cap based on total job slots / number of people.
        const totalSlots = this.schedule.getWeeks().reduce((slotSum, week) =>
             slotSum + week.jobs.reduce((acc, job) => acc + job.numOfPeople, 0), 0);
        this.maxAssignments = Math.ceil(totalSlots / this.people.length);
        console.log(`Max assignments per person: ${this.maxAssignments}`);
        
        this.assignHallJobs();
        this.assignOtherJobs();
        this.rebalanceAssignments();
        this.randomizeAssignments(0);
    }

    assignHallJobs() {
        for (const week of this.schedule.getWeeks()) {
            const weekAssigned: Set<Person> = (week as any)._assignedPersons;
            for (const job of week.jobs) {
                if (job.hall) { // job with a hall requirement
                    // Ensure job.people array is initialized
                    if (!job.people) {
                        job.people = [];
                    }
                    const currentAssigned = job.people.length;
                    const needed = job.numOfPeople - currentAssigned;
                    for (let i = 0; i < needed; i++) {
                        // Get eligible candidates from the job's hall
                        let hallCandidates = job.hall.people.filter(person =>
                            person.active && person.numAssignedJobs < this.maxAssignments && !weekAssigned.has(person)
                        );
                        hallCandidates.sort((a, b) => a.numAssignedJobs - b.numAssignedJobs);
                        
                        let candidate = hallCandidates[0];
                        if (!candidate) {
                            // Fallback: if no eligible candidate in the hall, allow any eligible person
                            let fallbackCandidates = this.people.filter(person =>
                                person.active && person.numAssignedJobs < this.maxAssignments && !weekAssigned.has(person)
                            );
                            fallbackCandidates.sort((a, b) => a.numAssignedJobs - b.numAssignedJobs);
                            candidate = fallbackCandidates[0];
                            if (!candidate) {
                                // No candidate available to fill this slot
                                console.warn(`No candidate available to fill ${job.name} in week ${week.weekNumber}`);
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
        }
    }

    assignOtherJobs() {
        for (const week of this.schedule.getWeeks()) {
            const weekAssigned: Set<Person> = (week as any)._assignedPersons;
            for (const job of week.jobs) {
                if (!job.hall) { // job without a hall requirement
                    // Ensure job.people array is initialized
                    if (!job.people) {
                        job.people = [];
                    }
                    const currentAssigned = job.people.length;
                    const needed = job.numOfPeople - currentAssigned;
                    for (let i = 0; i < needed; i++) {
                        let eligible = this.people.filter(person =>
                            person.active && person.numAssignedJobs < this.maxAssignments && !weekAssigned.has(person)
                        );
                        eligible.sort((a, b) => a.numAssignedJobs - b.numAssignedJobs);
                        let candidate = eligible[0];
                        if (!candidate) {
                            console.warn(`No candidate available to fill ${job.name} in week ${week.weekNumber}`);
                            break;
                        }
                        job.addPerson(candidate);
                        candidate.numAssignedJobs++;
                        weekAssigned.add(candidate);
                    }
                }
            }
        }
    }

    rebalanceAssignments() {
        const cap = this.maxAssignments;
        let swapped = true;
        // Continue swapping until no further improvement is found.
        while (swapped) {
            swapped = false;
            // Iterate through every week in the schedule.
            for (const week of this.schedule.getWeeks()) {
                // Retrieve the per-week assigned set (from the initial assignment).
                const weekAssigned: Set<Person> = (week as any)._assignedPersons;
                for (const job of week.jobs) {
                    const currentCount = job.people ? job.people.length : 0;
                    const missingSlots = job.numOfPeople - currentCount;
                    for (let m = 0; m < missingSlots; m++) {
                        // Look for potential candidates that are at capacity (6 assignments)
                        // and eligible for this job (if a hall is required, they must belong to it)
                        let potentialCandidates = this.people.filter(person => {
                            let eligible = person.active && person.numAssignedJobs === cap && !weekAssigned.has(person);
                            if (job.hall) {
                                eligible = eligible && job.hall.people.includes(person);
                            }
                            return eligible;
                        });
                        if (potentialCandidates.length === 0) {
                            console.warn(`No swap candidate found for job ${job.name} in week ${week.weekNumber}`);
                            continue;
                        }
                        let swapDone = false;
                        // Try to free one candidate by swapping one of their assignments.
                        for (const candidate of potentialCandidates) {
                            let foundSwap = false;
                            // Look through other weeks (other than the current week)
                            for (const otherWeek of this.schedule.getWeeks()) {
                                if (otherWeek.weekNumber === week.weekNumber) continue;
                                const otherWeekAssigned: Set<Person> = (otherWeek as any)._assignedPersons;
                                for (const otherJob of otherWeek.jobs) {
                                    // If candidate is assigned in this other job…
                                    if (otherJob.people && otherJob.people.includes(candidate)) {
                                        // Look for an alternate candidate for that slot in the other job.
                                        let altCandidates = this.people.filter(person => {
                                            let canTake = person.active && person.numAssignedJobs < cap && !otherWeekAssigned.has(person);
                                            if (otherJob.hall) {
                                                canTake = canTake && otherJob.hall.people.includes(person);
                                            }
                                            return canTake;
                                        });
                                        // Sort alternate candidates by fewest assignments.
                                        altCandidates.sort((a, b) => a.numAssignedJobs - b.numAssignedJobs);
                                        if (altCandidates.length > 0) {
                                            const alt = altCandidates[0];
                                            // Perform the swap:
                                            // Remove candidate from the other job.
                                            otherJob.people = otherJob.people.filter(p => p !== candidate);
                                            otherWeekAssigned.delete(candidate);
                                            // Add the alternate into the other job.
                                            otherJob.addPerson(alt);
                                            alt.numAssignedJobs++;
                                            // Update candidate's assignment count.
                                            candidate.numAssignedJobs--;
                                            otherWeekAssigned.add(alt);
                                            foundSwap = true;
                                            swapped = true;
                                            break; // Break out of the inner loop (otherJob)
                                        }
                                    }
                                }
                                if (foundSwap) break; // Break out of otherWeek loop if swap succeeded.
                            }
                            if (foundSwap) {
                                // Now candidate's count is under the cap.
                                // Assign candidate to fill the missing slot in the current job.
                                job.addPerson(candidate);
                                candidate.numAssignedJobs++;
                                weekAssigned.add(candidate);
                                swapDone = true;
                                break; // We have filled one missing slot – break candidate loop.
                            }
                        }
                        if (!swapDone) {
                            console.warn(`Unable to rebalance slot for job ${job.name} in week ${week.weekNumber}`);
                        }
                    }
                }
            }
        }
    }

    howManyTimesIsPersonDoingKitchen(person: Person) {
        let count = 0;
        for (const week of this.schedule.getWeeks()) {
            if (week.jobs.find(job => job.name === 'Kitchen Crew' && job.people.includes(person))) {
                count++;
            }
        }
        return count;
    }

    arePeopleDoingKitchenTooMuch() {
        for (const person of this.people) {
            if (this.howManyTimesIsPersonDoingKitchen(person) > 2) {
                return true;
            }
        }
        return false;
    }

    randomizeAssignments(count: number) {
        if (count > 2000) {
            console.warn(`Randomized ${count} times, giving up`);
            return false;
        }

        // Save current state in case we need to revert
        const originalState = this.schedule.getWeeks().map(week => 
            week.jobs.map(job => [...job.people])
        );

        // Randomize all weeks
        for (const week of this.schedule.getWeeks()) {
            let people: Person[] = [];
            for (const job of week.jobs) {
                people.push(...job.people);
                job.people = [];
            }
            
            people.sort(() => Math.random() - 0.5);
            let personIndex = 0;
            
            // Assign people to jobs respecting numOfPeople
            for (const job of week.jobs) {
                for (let i = 0; i < job.numOfPeople; i++) {
                    if (personIndex < people.length) {
                        job.addPerson(people[personIndex]);
                        personIndex++;
                    }
                }
            }
        }

        if (this.arePeopleDoingKitchenTooMuch()) {
            // Restore original state
            this.schedule.getWeeks().forEach((week, weekIndex) => {
                week.jobs.forEach((job, jobIndex) => {
                    job.people = [...originalState[weekIndex][jobIndex]];
                });
            });
            // Try again
            return this.randomizeAssignments(count + 1);
        }

        console.log(`Randomized ${count} times, found a valid assignment`);
        return true;
    }

    toJson() {
        const json = {
            weeks: this.schedule.getWeeks().map(week => ({
                weekNumber: week.weekNumber,
                jobs: week.jobs.map(job => ({
                name: job.name,
                people: job.getPeople().map(person => ({
                    name: person.name
                }))
            }))
        }))

        };
        
        // Convert to JSON string with proper formatting
        const jsonString = JSON.stringify(json, null, 2);

        // Use Node's filesystem module to write the file
        const fs = require('fs');
        const path = require('path');
        const currentDir = process.cwd();
        const filePath = path.join(currentDir, 'schedule.json');
        console.log(`Writing schedule to ${filePath}`);
        fs.writeFileSync(filePath, jsonString);

        return json;
    }

    maxTimesOnePersonIsDoingKitchen() {
        let max = 0;
        for (const person of this.people) {
            const times = this.howManyTimesIsPersonDoingKitchen(person);
            if (times > max) {
                max = times;
            }
        }
        return max;
    }


}



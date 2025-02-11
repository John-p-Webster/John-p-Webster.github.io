import { config } from "../config";
import { Hall } from "../hall/hall";
import { Job } from "../job/job";
import { Person } from "../person/person";
import { Schedule } from "../schedule/schedule";
import { Week } from "../week/week";

export class Scheduler {
    schedule: Schedule;
    halls: Hall[];
    people: Person[];
    jobs: Job[];
    jobConfigs;
    hallConfigs
    maxAssignments: number;
    MAX_RANDOMIZE_COUNT: number = 2000000;
    KITCHEN_DUTY_TARGET: number = 1;
    KITCHEN_DUTY_GIVE_UP: number = 4;

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
            { name: 'Lower North', people: ['Tim ', 'Baba', 'Josh Pearson'] },
            { name: 'Lower South', people: ['Gary Groudsky', 'Dom Spiotta', 'Tomaso Calviello', 'Matteo Calviello'] }
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
        this.schedule = this.randomizeAssignments(0);
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

    /**
     * Randomize assignments
     * @param count - number of times randomized
     * @param maxCount - max number of times to randomize
     * @param target - max number of times one person is doing kitchen
     * @param giveUp - will try to randomize again until this number is reached
     * @returns true if successful, false if giving up
     */
    randomizeAssignments(count: number) {
        let lowestKitchenCount = this.maxAssignments;
        let bestConfig = this.deepCopySchedule(this.schedule); // Create initial deep copy
        let message = `Randomizing assignments...`;
        while (count < this.MAX_RANDOMIZE_COUNT) {
            if (count % 100000 === 0) {
                this.updateProgress(count, this.MAX_RANDOMIZE_COUNT, message);
            }
            
            // Save current state in case we need to revert
            const originalState = this.schedule.getWeeks().map(week => 
                week.jobs.map(job => [...job.people])
            );

            // Randomize all weeks
            for (const week of this.schedule.getWeeks()) {
                let people: Person[] = [];

                for (const job of week.jobs) {
                    if (!job.hall) {
                        people.push(...job.people);
                        job.people = [];
                    }
                }
                
                people.sort(() => Math.random() - 0.5);
                let personIndex = 0;
                
                for (const job of week.jobs) {
                    if (!job.hall) {
                        for (let i = 0; i < job.numOfPeople; i++) {
                            if (personIndex < people.length) {
                                    job.addPerson(people[personIndex]);
                                    personIndex++;
                            }
                        }
                    }
                }
            }

            const kitchenCount = this.maxTimesOnePersonIsDoingKitchen();
            
            if (kitchenCount.max < lowestKitchenCount) {
                lowestKitchenCount = kitchenCount.max;
                message = `New lowest kitchen count ${lowestKitchenCount} at loop index ${count}`;
                bestConfig = this.deepCopySchedule(this.schedule); // Create deep copy when saving best config
            }

            count++;
        }
        return bestConfig;
    }

    toJson() {
        const json = {
            quarter: config.quarter,
            year: config.year,
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
        let maxPerson: Person | null = null;
        for (const person of this.people) {
            const times = this.howManyTimesIsPersonDoingKitchen(person);
            if (times > max) {
                max = times;
                maxPerson = person;
            }
        }
        return {
            max: max,
            person: maxPerson,
        };
    }

    private deepCopySchedule(schedule: Schedule): Schedule {
        const newSchedule = new Schedule(schedule.getWeeks().length);
        
        schedule.getWeeks().forEach((week) => {
            const newWeek = new Week(week.weekNumber, []);
            week.jobs.forEach((job) => {
                const newJob = new Job(job.name, job.numOfPeople, job.hall);
                newJob.people = [...job.people]; // Copy the people array
                newWeek.jobs.push(newJob);
            });
            newSchedule.addWeek(newWeek);
        });
        
        return newSchedule;
    }

    private createProgressBar(progress: number): string {
        const barLength = 30;
        const filledLength = Math.floor(barLength * progress);
        const emptyLength = barLength - filledLength;
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        return `[${progressBar}] ${Math.floor(progress * 100)}%`;
    }
    
    private updateProgress(count: number, total: number, message: string) {
        const progress = count / total;
        // Move cursor up one line and to the beginning
        process.stdout.moveCursor(0, -1);
        // Clear both lines
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(message + '\n');
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(this.createProgressBar(progress));
    }
}



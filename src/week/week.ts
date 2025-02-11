import { Job } from "../job/job";

export class Week {
    
    jobs: Job[];
    weekNumber: number;

    constructor(weekNumber: number, jobs: Job[]) {
        this.weekNumber = weekNumber;
        this.jobs = jobs;
    }

    displayWeek(): any {
        return this.jobs.map(job => job.displayJob()).join('\n');
    }
}
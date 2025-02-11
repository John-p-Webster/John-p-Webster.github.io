import { Job } from "./job";
import { Week } from "./week";

export class Schedule {
    weeks: Week[];
    numOfWeeks: number;

    constructor(numOfWeeks: number) {
        this.weeks = [];
        this.numOfWeeks = numOfWeeks;
    }

    addWeek(week: Week) {
        this.weeks.push(week);
    }

    getWeeks() {
        return this.weeks;
    }

    displaySchedule() {
        this.weeks.forEach(week => {
            console.log(week.displayWeek());
        });
    }
}
import { Hall } from "./hall";

export class Person {
    name: string;
    hall: Hall;
    active: boolean; // People on their last quarter are not active
    numAssignedJobs: number;

    constructor(name: string, hall: Hall, active: boolean) {
        this.name = name;
        this.hall = hall;
        this.active = active;
    }
}



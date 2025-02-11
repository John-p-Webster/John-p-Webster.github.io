import { Hall } from "../hall/hall";
import { Person } from "../person/person";

export class Job {
    name: string;
    people: Person[];
    hall?: Hall;
    numOfPeople: number;

    constructor(name: string, numOfPeople: number, hall?: Hall) {
        this.name = name;
        this.numOfPeople = numOfPeople;
        this.hall = hall;
    }

    addPerson(person: Person) {
        this.people.push(person);
    }

    removePerson(person: Person) {
        this.people = this.people.filter(p => p !== person);
    }

    getPeople() {
        return this.people;
    }

    displayJob(): any {
        return `${this.name}: ${this.people.map(person => person.name).join(', ')}`;
    }
}
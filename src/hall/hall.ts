import { Person } from "../person/person";

export class Hall {
    name: string;
    people: Person[];

    constructor(name: string) {
        this.name = name;
        this.people = [];
    }

    addPerson(person: Person) {
        this.people.push(person);
    }
}
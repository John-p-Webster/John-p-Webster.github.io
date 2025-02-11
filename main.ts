import { Scheduler } from "./scheduler";

function main() {
    // Create a new scheduler instance
    const scheduler = new Scheduler();
    
    // Assign people to jobs
    scheduler.assignPeopleToJobs();
    
    // Display the schedule
    console.log("=== House Job Schedule ===\n");

    const assignmentCountByName: Record<string, number> = {};
    scheduler.people.forEach(person => {
        assignmentCountByName[person.name] = 0;
    });
    
    scheduler.schedule.getWeeks().forEach((week, index) => {
        console.log(`\n=== Week ${week.weekNumber} ===`);
        console.log(week.displayWeek());
        console.log("------------------------");

        scheduler.schedule.getWeeks().forEach(w => {
            w.jobs.forEach(job => {
                job.getPeople().forEach(person => {
                    assignmentCountByName[person.name] += 1;
                });
            });
        });
    });

    console.log(`People - ${scheduler.people.length}`);
    console.log("------------------------");
    Object.entries(assignmentCountByName).forEach(([name, count]) => {
        console.log(`${name}: ${count/scheduler.schedule.getWeeks().length}`);
    });
    console.log(`Max times one person is doing kitchen: ${scheduler.maxTimesOnePersonIsDoingKitchen()}`);

    scheduler.toJson();
}

// Run the main function
main(); 
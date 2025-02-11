import { Scheduler } from "../src/scheduler/scheduler";
import { Person } from "../src/person/person";
import { expect } from '@jest/globals';
import { describe, test, beforeEach } from '@jest/globals';

describe('Scheduler', () => {
  let scheduler: Scheduler;
  let maxAssignments: number;

  beforeEach(() => {
    scheduler = new Scheduler();
    scheduler.assignPeopleToJobs();
    maxAssignments = scheduler.maxAssignments;
  });

  test("should not assign a person more than once per week", () => {
    // For each week, collect all assigned persons and ensure each person is unique.
    const weeks = scheduler.schedule.getWeeks();
    weeks.forEach(week => {
      const assignedNames: string[] = [];
      week.jobs.forEach(job => {
        job.getPeople().forEach(person => {
          assignedNames.push(person.name);
        });
      });
      const uniqueNames = new Set(assignedNames);
      expect(uniqueNames.size).toBe(assignedNames.length);
    });
  });

  test(`should not assign a person more than the max number of assignments`, () => {
    // Count assignments by iterating over weeks and jobs.
    const assignmentCountByName: Record<string, number> = {};
    scheduler.people.forEach(person => {
      assignmentCountByName[person.name] = 0;
    });
    scheduler.schedule.getWeeks().forEach(week => {
      week.jobs.forEach(job => {
        job.getPeople().forEach(person => {
          assignmentCountByName[person.name] += 1;
        });
      });
    });
    
    Object.entries(assignmentCountByName).forEach(([name, count]) => {
      expect(count).toBeLessThanOrEqual(maxAssignments);
    });
  });

  test("jobs with hall requirement assign from hall if eligible", () => {
    // For each week and for every job that has a hall requirement:
    // If a candidate assigned to the job is not from the hall, then every eligible 
    // hall person for that week must already have a job.
    scheduler.schedule.getWeeks().forEach(week => {
      week.jobs.forEach(job => {
        if (job.hall) {
          job.getPeople().forEach(candidate => {
            if (!job.hall!.people.includes(candidate)) {
              // This candidate came from fallback.
              // Identify hall candidates that are eligible (active and have capacity).
              const eligibleHallCandidates = job.hall!.people.filter(p => 
                p.active && p.numAssignedJobs < maxAssignments
              );
              // For every eligible hall candidate, verify they are already assigned a job in this week.
              eligibleHallCandidates.forEach(hallPerson => {
                const isAssignedInWeek = week.jobs.some(j => j.getPeople().includes(hallPerson));
                expect(isAssignedInWeek).toBeTruthy();
              });
            }
          });
        }
      });
    });
  });

  test("a job does not assign duplicate persons", () => {
    scheduler.schedule.getWeeks().forEach(week => {
      week.jobs.forEach(job => {
        const names = job.getPeople().map(p => p.name);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);
      });
    });
  });

  test("every job should have the required number of people assigned", () => {
    scheduler.schedule.getWeeks().forEach(week => {
      week.jobs.forEach(job => {
        expect(job.getPeople().length).toBe(job.numOfPeople);  // Assuming there's a getter method
      });
    });
  });

  test("no jobs should be left unfilled", () => {
    scheduler.schedule.getWeeks().forEach(week => {
      week.jobs.forEach(job => {
        const assignedPeople = job.getPeople();
        expect(assignedPeople.length).toBeGreaterThan(0);
        expect(assignedPeople.every(person => person !== null && person !== undefined)).toBeTruthy();
      });
    });
  });

  test("every person should have at least one less than the max number of assignments", () => {
    // Count assignments for each person
    const assignmentCountByName: Record<string, number> = {};
    scheduler.people.forEach(person => {
      assignmentCountByName[person.name] = 0;
    });

    scheduler.schedule.getWeeks().forEach(week => {
      week.jobs.forEach(job => {
        job.getPeople().forEach(person => {
          assignmentCountByName[person.name] += 1;
        });
      });
    });
    
    // Check that each active person has at least 5 assignments
    scheduler.people.forEach(person => {
      if (person.active) {
        expect(assignmentCountByName[person.name]).toBeGreaterThanOrEqual(maxAssignments - 1);
      }
    });
  });
}); 
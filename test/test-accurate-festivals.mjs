import fs from "fs";
import path from "path";

// Accurate astrological & solar festival calendar for 2026 & 2027 by country
const FESTIVAL_CALENDAR_DATABASE = {
  IN: [
    { name: "Navratri & Durga Puja", date: "2026-10-11" },
    { name: "Dussehra (Vijayadashami)", date: "2026-10-20" },
    { name: "Karwa Chauth", date: "2026-10-29" },
    { name: "Dhanteras", date: "2026-11-06" },
    { name: "Diwali (Deepavali)", date: "2026-11-08" },
    { name: "Bhai Dooj", date: "2026-11-10" },
    { name: "Chhath Puja", date: "2026-11-15" },
    { name: "Christmas Day", date: "2026-12-25" },
    { name: "New Year", date: "2027-01-01" },
    { name: "Makar Sankranti / Pongal", date: "2027-01-14" },
    { name: "Maha Shivratri", date: "2027-03-06" },
    { name: "Holi (Festival of Colors)", date: "2027-03-22" },
  ],
  US: [
    { name: "Halloween", date: "2026-10-31" },
    { name: "Thanksgiving Day", date: "2026-11-26" },
    { name: "Christmas Day", date: "2026-12-25" },
    { name: "New Year's Eve", date: "2026-12-31" },
  ],
};

function getUpcomingFestivals(countryCode = "IN", referenceDate = new Date()) {
  const list = FESTIVAL_CALENDAR_DATABASE[countryCode] || FESTIVAL_CALENDAR_DATABASE["IN"];
  const upcoming = [];

  for (const item of list) {
    const festDate = new Date(`${item.date}T00:00:00Z`);
    const diffTime = festDate.getTime() - referenceDate.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft >= 0 && daysLeft <= 60) {
      upcoming.push({
        name: item.name,
        date: item.date,
        daysLeft,
      });
    }
  }

  upcoming.sort((a, b) => a.daysLeft - b.daysLeft);
  return upcoming;
}

const now = new Date("2026-10-05T00:00:00Z");
console.log("Upcoming festivals from Oct 5, 2026:");
console.log(JSON.stringify(getUpcomingFestivals("IN", now), null, 2));

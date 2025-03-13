import { React } from "react";
import FullCalendar from "@fullcalendar/react";
import multiMonthPlugin from "@fullcalendar/multimonth";

const Calendar1 = () => {
  return (
    <div>
      <FullCalendar
        plugins={[multiMonthPlugin]}
        initialView="multiMonthYear"
        height="90vh"
        events={[
          { title: "event 1", date: "2025-03-11" },
          { title: "event 2", start: "2025-03-18", end: "2025-03-25T23:59:59" },
          { title: "event 3", start: "2025-03-12T12:00:00", allDay: false },
        ]}
      />
    </div>
  );
};

export default Calendar1;

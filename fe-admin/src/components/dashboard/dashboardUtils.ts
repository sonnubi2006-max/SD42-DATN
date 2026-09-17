

export const getRangeParams = (type: "TODAY" | "WEEK" | "MONTH" | "YEAR") => {
  const now = new Date();
  const toISODateString = (date: Date, isEnd = false) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const time = isEnd ? "T23:59:59" : "T00:00:00";
    return `${yyyy}-${mm}-${dd}${time}`;
  };

  let fromDate: string;
  let toDate: string;

  if (type === "TODAY") {
    fromDate = toISODateString(now);
    toDate = toISODateString(now, true);
  } else if (type === "WEEK") {
    const monday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    fromDate = toISODateString(monday);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    toDate = toISODateString(sunday, true);
  } else if (type === "MONTH") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    fromDate = toISODateString(firstDay);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    toDate = toISODateString(lastDay, true);
  } else {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    fromDate = toISODateString(firstDay);
    const lastDay = new Date(now.getFullYear(), 11, 31);
    toDate = toISODateString(lastDay, true);
  }

  return { fromDate, toDate };
};

export const getQuickCompareDates = (
  type: "today-yesterday" | "thisweek-lastweek" | "thismonth-lastmonth"
) => {
  const toInputFormat = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  if (type === "today-yesterday") {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      p1From: toInputFormat(today),
      p1To: toInputFormat(today),
      p2From: toInputFormat(yesterday),
      p2To: toInputFormat(yesterday),
    };
  } else if (type === "thisweek-lastweek") {
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);

    const monThis = new Date(today);
    monThis.setDate(diff);
    const sunThis = new Date(monThis);
    sunThis.setDate(sunThis.getDate() + 6);

    const monLast = new Date(monThis);
    monLast.setDate(monLast.getDate() - 7);
    const sunLast = new Date(monLast);
    sunLast.setDate(sunLast.getDate() + 6);

    return {
      p1From: toInputFormat(monThis),
      p1To: toInputFormat(sunThis),
      p2From: toInputFormat(monLast),
      p2To: toInputFormat(sunLast),
    };
  } else {
    const y = today.getFullYear();
    const m = today.getMonth();

    const firstThis = new Date(y, m, 1);
    const lastThis = new Date(y, m + 1, 0);

    const firstLast = new Date(y, m - 1, 1);
    const lastLast = new Date(y, m, 0);

    return {
      p1From: toInputFormat(firstThis),
      p1To: toInputFormat(lastThis),
      p2From: toInputFormat(firstLast),
      p2To: toInputFormat(lastLast),
    };
  }
};
